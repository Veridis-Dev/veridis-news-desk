<?php
namespace Veridis\NewsDesk\Editorial;

defined( 'ABSPATH' ) || exit;

final class EditorialMetadataService {
	private $repository;

	public function __construct( ?EditorialMetadataRepository $repository = null ) {
		$this->repository = $repository ?: new EditorialMetadataRepository();
	}

	public function get_repository(): EditorialMetadataRepository {
		return $this->repository;
	}

	/**
	 * Retrieve complete editorial presentation details for an article.
	 *
	 * @param int $post_id
	 * @param object|null $post
	 * @return array
	 */
	public function get( int $post_id, ?object $post = null ): array {
		if ( ! $post ) {
			$post = get_post( $post_id );
		}

		$raw = $this->repository->get( $post_id, $post );

		// Assigned User Details
		$assigned_id = $raw['assigned_to'];
		if ( $assigned_id > 0 ) {
			$user = get_userdata( $assigned_id );
			$assigned_name     = $user ? $user->display_name : __( 'Unknown editor', 'veridis-news-desk' );
			$assigned_initials = $this->initials( $assigned_name );
		} else {
			$assigned_name     = __( 'Unassigned', 'veridis-news-desk' );
			$assigned_initials = '';
		}

		// Deadline & Overdue calculation in site timezone
		$deadline_utc  = $raw['deadline_utc'];
		$deadline_site = null;
		$deadline_iso  = null;
		$deadline_local= null;
		$deadline_label= null;
		$is_overdue    = false;

		if ( $deadline_utc ) {
			$utc_dt = \DateTimeImmutable::createFromFormat( 'Y-m-d H:i:s', $deadline_utc, new \DateTimeZone( 'UTC' ) );
			if ( $utc_dt ) {
				$site_tz = wp_timezone();
				$deadline_site = $utc_dt->setTimezone( $site_tz );
				$deadline_iso  = $deadline_site->format( DATE_ATOM );
				$deadline_local= $deadline_site->format( 'Y-m-d\TH:i' );

				$now_utc = gmdate( 'Y-m-d H:i:s' );
				$post_status = $post ? (string) $post->post_status : 'draft';
				$is_overdue = ( $deadline_utc < $now_utc && 'publish' !== $post_status );

				$now_site = current_datetime();
				$deadline_label = $this->format_deadline_label( $deadline_site, $now_site, $is_overdue );
			}
		}

		return array(
			'editorialStatus'      => $raw['editorial_status'],
			'editorialStatusLabel' => EditorialStatus::label( $raw['editorial_status'] ),
			'editorialStatusTone'  => EditorialStatus::tone( $raw['editorial_status'] ),
			'assignedTo'           => $assigned_id,
			'assignedName'         => $assigned_name,
			'assignedInitials'     => $assigned_initials,
			'isUnassigned'         => $raw['is_unassigned'],
			'deadline'             => $deadline_iso,
			'deadlineLocal'        => $deadline_local,
			'deadlineLabel'        => $deadline_label,
			'isOverdue'            => $is_overdue,
			'priority'             => $raw['priority'],
			'priorityLabel'        => Priority::label( $raw['priority'] ),
			'priorityTone'         => Priority::tone( $raw['priority'] ),
			'internalNotes'        => $raw['internal_notes'],
			'sources'              => $raw['sources'],
		);
	}

	/**
	 * Validate and update editorial metadata.
	 *
	 * @param int $post_id
	 * @param array $input
	 * @return true|\WP_Error
	 */
	public function update( int $post_id, array $input ) {
		$data = array();

		// 1. Editorial Status
		if ( array_key_exists( 'editorialStatus', $input ) ) {
			$status = (string) $input['editorialStatus'];
			if ( ! EditorialStatus::is_valid( $status ) ) {
				return new \WP_Error(
					'veridis_news_invalid_editorial_status',
					__( 'Invalid editorial status.', 'veridis-news-desk' ),
					array( 'status' => 400 )
				);
			}
			$data['editorial_status'] = $status;
		}

		// 2. Assigned To (0 = Unassigned, > 0 = valid user with edit_posts)
		if ( array_key_exists( 'assignedTo', $input ) ) {
			$assigned_id = absint( $input['assignedTo'] );
			if ( $assigned_id > 0 ) {
				$user = get_userdata( $assigned_id );
				if ( ! $user || ! user_can( $user, 'edit_posts' ) ) {
					return new \WP_Error(
						'veridis_news_invalid_assigned_user',
						__( 'Assigned user must have permission to edit posts.', 'veridis-news-desk' ),
						array( 'status' => 400 )
					);
				}
			}
			$data['assigned_to'] = $assigned_id;
		}

		$current = $this->repository->get( $post_id );
		$effective_status = $data['editorial_status'] ?? $current['editorial_status'];
		$effective_assignee = $data['assigned_to'] ?? $current['assigned_to'];
		if ( EditorialStatus::IDEA !== $effective_status && 0 === $effective_assignee ) {
			return new \WP_Error(
				'veridis_news_assignee_required',
				__( 'Choose an assignee for Writing, Review, or Ready to publish.', 'veridis-news-desk' ),
				array( 'status' => 400 )
			);
		}

		// 3. Deadline (parse in wp_timezone, convert to UTC)
		if ( array_key_exists( 'deadline', $input ) ) {
			$raw_deadline = $input['deadline'];
			if ( null === $raw_deadline || '' === trim( (string) $raw_deadline ) ) {
				$data['deadline_utc'] = null;
			} else {
				$parsed = $this->parse_to_utc( (string) $raw_deadline );
				if ( ! $parsed ) {
					return new \WP_Error(
						'veridis_news_invalid_deadline',
						__( 'Invalid deadline datetime format.', 'veridis-news-desk' ),
						array( 'status' => 400 )
					);
				}
				$data['deadline_utc'] = $parsed;
			}
		}

		// 4. Priority
		if ( array_key_exists( 'priority', $input ) ) {
			$priority = (string) $input['priority'];
			if ( ! Priority::is_valid( $priority ) ) {
				return new \WP_Error(
					'veridis_news_invalid_priority',
					__( 'Invalid editorial priority.', 'veridis-news-desk' ),
					array( 'status' => 400 )
				);
			}
			$data['priority'] = $priority;
		}

		// 5. Internal Notes
		if ( array_key_exists( 'internalNotes', $input ) ) {
			$data['internal_notes'] = sanitize_textarea_field( (string) $input['internalNotes'] );
		}

		// 6. Sources
		if ( array_key_exists( 'sources', $input ) ) {
			if ( ! is_array( $input['sources'] ) ) {
				return new \WP_Error(
					'veridis_news_invalid_sources',
					__( 'Sources must be an array.', 'veridis-news-desk' ),
					array( 'status' => 400 )
				);
			}
			$validated_sources = array();
			foreach ( $input['sources'] as $item ) {
				if ( ! is_array( $item ) || ! isset( $item['name'] ) || '' === trim( (string) $item['name'] ) ) {
					continue;
				}
				$status = isset( $item['status'] ) ? (string) $item['status'] : SourceStatus::DEFAULT;
				if ( ! SourceStatus::is_valid( $status ) ) {
					return new \WP_Error(
						'veridis_news_invalid_source_status',
						sprintf(
							/* translators: %s: source status. */
							__( 'Invalid source status "%s".', 'veridis-news-desk' ),
							$status
						),
						array( 'status' => 400 )
					);
				}
				$validated_sources[] = array(
					'id'     => isset( $item['id'] ) && '' !== trim( (string) $item['id'] ) ? sanitize_text_field( (string) $item['id'] ) : wp_generate_uuid4(),
					'name'   => sanitize_text_field( (string) $item['name'] ),
					'status' => $status,
				);
			}
			$data['sources'] = $validated_sources;
		}

		$first_assignee = isset( $data['assigned_to'] ) && $data['assigned_to'] > 0 && metadata_exists( 'post', $post_id, EditorialMetadataRepository::META_PENDING_AUTHOR );
		$temporary_author = $first_assignee ? (int) get_post_meta( $post_id, EditorialMetadataRepository::META_PENDING_AUTHOR, true ) : 0;
		$post = $first_assignee ? get_post( $post_id ) : null;
		$author_changed = false;
		if ( $first_assignee && 0 === $current['assigned_to'] && $post && $temporary_author > 0 && (int) $post->post_author === $temporary_author && (int) $post->post_author !== $data['assigned_to'] ) {
			$updated = wp_update_post( array( 'ID' => $post_id, 'post_author' => $data['assigned_to'] ), true );
			if ( is_wp_error( $updated ) ) {
				return $updated;
			}
			$author_changed = true;
		}

		$this->repository->save( $post_id, $data );
		if ( $first_assignee ) {
			if ( (int) get_post_meta( $post_id, EditorialMetadataRepository::META_ASSIGNED, true ) !== $data['assigned_to'] ) {
				if ( $author_changed ) {
					wp_update_post( array( 'ID' => $post_id, 'post_author' => $temporary_author ) );
				}
				return new \WP_Error( 'veridis_news_assignment_save_failed', __( 'Could not save the story assignment.', 'veridis-news-desk' ), array( 'status' => 500 ) );
			}
			delete_post_meta( $post_id, EditorialMetadataRepository::META_PENDING_AUTHOR );
		}
		return true;
	}

	/**
	 * Count posts with overdue deadlines for Dashboard integration.
	 */
	public function count_overdue_deadlines(): int {
		global $wpdb;
		$now_utc = gmdate( 'Y-m-d H:i:s' );
		$count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(DISTINCT p.ID)
				FROM {$wpdb->posts} p
				INNER JOIN {$wpdb->postmeta} pm ON (p.ID = pm.post_id AND pm.meta_key = %s)
				WHERE p.post_type = 'post'
				  AND p.post_status IN ('draft', 'pending', 'future')
				  AND " . \Veridis\NewsDesk\Core\Access::readable_post_sql( 'p' ) . "
				  AND pm.meta_value != ''
				  AND pm.meta_value < %s",
				EditorialMetadataRepository::META_DEADLINE,
				$now_utc
			)
		);
		return (int) $count;
	}

	/**
	 * Parse date string from input (site timezone) to UTC string 'Y-m-d H:i:s'.
	 */
	public function parse_to_utc( string $date_str ): ?string {
		$site_tz = wp_timezone();
		$dt = null;

		// Try various input formats (HTML datetime-local, ISO 8601, Y-m-d H:i:s, etc.)
		$formats = array(
			'Y-m-d\TH:i',
			'Y-m-d\TH:i:s',
			'Y-m-d H:i:s',
			'Y-m-d H:i',
			DATE_ATOM,
		);

		foreach ( $formats as $fmt ) {
			$parsed = \DateTimeImmutable::createFromFormat( $fmt, $date_str, $site_tz );
			if ( $parsed && $parsed->format( $fmt ) === $date_str ) {
				$dt = $parsed;
				break;
			}
		}

		if ( ! $dt ) {
			try {
				$dt = new \DateTimeImmutable( $date_str, $site_tz );
			} catch ( \Throwable $e ) {
				return null;
			}
		}

		$utc_dt = $dt->setTimezone( new \DateTimeZone( 'UTC' ) );
		return $utc_dt->format( 'Y-m-d H:i:s' );
	}

	private function format_deadline_label( \DateTimeImmutable $deadline, \DateTimeImmutable $now, bool $is_overdue ): string {
		$time_format = get_option( 'time_format' ) ?: 'H:i';
		$time_str    = wp_date( $time_format, $deadline->getTimestamp(), wp_timezone() );

		if ( $is_overdue ) {
			$diff_seconds = max( 0, $now->getTimestamp() - $deadline->getTimestamp() );
			if ( $diff_seconds < 3600 ) {
				$mins = max( 1, (int) round( $diff_seconds / 60 ) );
				/* translators: %d: number of minutes. */
				return sprintf( __( 'Overdue by %dm', 'veridis-news-desk' ), $mins );
			}
			if ( $diff_seconds < 86400 ) {
				$hours = (int) floor( $diff_seconds / 3600 );
				$mins  = (int) round( ( $diff_seconds % 3600 ) / 60 );
				if ( $mins > 0 ) {
					/* translators: 1: hours, 2: minutes. */
					return sprintf( __( 'Overdue by %1$dh %2$dm', 'veridis-news-desk' ), $hours, $mins );
				}
				/* translators: %d: hours. */
				return sprintf( __( 'Overdue by %dh', 'veridis-news-desk' ), $hours );
			}
			$days = (int) floor( $diff_seconds / 86400 );
			/* translators: %d: number of days. */
			return sprintf( _n( 'Overdue by %d day', 'Overdue by %d days', $days, 'veridis-news-desk' ), $days );
		}

		$today_date    = $now->format( 'Y-m-d' );
		$tomorrow_date = $now->modify( '+1 day' )->format( 'Y-m-d' );
		$deadline_date = $deadline->format( 'Y-m-d' );

		if ( $deadline_date === $today_date ) {
			/* translators: %s: formatted local time. */
			return sprintf( __( 'Today, %s', 'veridis-news-desk' ), $time_str );
		}

		if ( $deadline_date === $tomorrow_date ) {
			/* translators: %s: formatted local time. */
			return sprintf( __( 'Tomorrow, %s', 'veridis-news-desk' ), $time_str );
		}

		if ( $deadline->format( 'Y' ) === $now->format( 'Y' ) ) {
			return wp_date( 'M j, ' . $time_format, $deadline->getTimestamp(), wp_timezone() );
		}

		return wp_date( 'M j Y, ' . $time_format, $deadline->getTimestamp(), wp_timezone() );
	}

	private function initials( string $name ): string {
		$parts = preg_split( '/\s+/u', trim( $name ) ) ?: array();
		if ( ! $parts ) {
			return '?';
		}
		$selected = 1 === count( $parts ) ? array( $parts[0] ) : array( $parts[0], $parts[ count( $parts ) - 1 ] );
		return strtoupper( implode( '', array_map( static function ( $part ): string {
			return function_exists( 'mb_substr' ) ? mb_substr( $part, 0, 1 ) : substr( $part, 0, 1 );
		}, $selected ) ) );
	}
}
