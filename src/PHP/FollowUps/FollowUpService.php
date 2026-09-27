<?php
namespace Veridis\NewsDesk\FollowUps;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Newsroom\NewsroomRepository;

final class FollowUpService {
	private $repository;
	private $newsroom_repository;

	public function __construct( ?FollowUpRepository $repository = null, ?NewsroomRepository $newsroom_repository = null ) {
		$this->repository          = $repository ?: new FollowUpRepository();
		$this->newsroom_repository = $newsroom_repository ?: new NewsroomRepository();
	}

	public function listing( array $filters ): array {
		$result = $this->repository->query( $filters );
		$items  = array();
		foreach ( $result['items'] as $row ) {
			$items[] = $this->format( $row );
		}

		return array(
			'items'          => $items,
			'total'          => $result['total'],
			'pages'          => $result['pages'],
			'page'           => $result['page'],
			'counts'         => $result['counts'],
			'overallStories' => $this->newsroom_repository->count_all(),
		);
	}

	public function get_for_article( int $post_id ): array {
		$rows  = $this->repository->get_for_article( $post_id );
		$items = array();
		$post  = get_post( $post_id );
		foreach ( $rows as $row ) {
			$items[] = $this->format( $row, $post );
		}
		return $items;
	}

	public function create( int $post_id, array $payload ) {
		$post = get_post( $post_id );
		if ( ! $post || 'post' !== $post->post_type ) {
			return new \WP_Error( 'veridis_followup_not_found', __( 'Article not found.', 'veridis-news-desk' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'veridis_followup_forbidden', __( 'You cannot add follow-ups for this article.', 'veridis-news-desk' ), array( 'status' => 403 ) );
		}

		$title_validation = $this->validate_title( $payload['title'] ?? '' );
		if ( is_wp_error( $title_validation ) ) {
			return $title_validation;
		}
		$title = $title_validation;

		// Default or explicit assignee
		if ( array_key_exists( 'assignedTo', $payload ) ) {
			$assignee_validation = $this->validate_assigned_to( (int) $payload['assignedTo'] );
			if ( is_wp_error( $assignee_validation ) ) {
				return $assignee_validation;
			}
			$assigned_to = $assignee_validation;
		} else {
			$assigned_to = $this->determine_default_assignee( $post_id );
		}

		$due_validation = $this->validate_and_parse_due_at( $payload['dueAt'] ?? null );
		if ( is_wp_error( $due_validation ) ) {
			return $due_validation;
		}
		$due_at_utc = $due_validation;

		$notes = isset( $payload['notes'] ) ? sanitize_textarea_field( (string) $payload['notes'] ) : null;
		$now   = gmdate( 'Y-m-d H:i:s' );

		$data = array(
			'post_id'          => $post_id,
			'title'            => $title,
			'notes'            => $notes,
			'assigned_to'      => $assigned_to,
			'status'           => FollowUpStatus::STATUS_OPEN,
			'due_at_utc'       => $due_at_utc,
			'created_by'       => get_current_user_id(),
			'created_at_utc'   => $now,
			'updated_at_utc'   => $now,
			'completed_at_utc' => null,
		);

		$id = $this->repository->insert( $data );
		if ( ! $id ) {
			return new \WP_Error( 'veridis_followup_create_failed', __( 'Could not save follow-up.', 'veridis-news-desk' ), array( 'status' => 500 ) );
		}

		$saved = $this->repository->get( $id );
		return $this->format( $saved, $post );
	}

	public function update( int $id, array $payload ) {
		$existing = $this->repository->get( $id );
		if ( ! $existing ) {
			return new \WP_Error( 'veridis_followup_not_found', __( 'Follow-up not found.', 'veridis-news-desk' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'edit_post', $existing->post_id ) ) {
			return new \WP_Error( 'veridis_followup_forbidden', __( 'You cannot edit this follow-up.', 'veridis-news-desk' ), array( 'status' => 403 ) );
		}

		$data = array();

		if ( array_key_exists( 'title', $payload ) ) {
			$title_validation = $this->validate_title( $payload['title'] );
			if ( is_wp_error( $title_validation ) ) {
				return $title_validation;
			}
			$data['title'] = $title_validation;
		}

		if ( array_key_exists( 'notes', $payload ) ) {
			$data['notes'] = null !== $payload['notes'] ? sanitize_textarea_field( (string) $payload['notes'] ) : null;
		}

		if ( array_key_exists( 'assignedTo', $payload ) ) {
			$assignee_validation = $this->validate_assigned_to( (int) $payload['assignedTo'] );
			if ( is_wp_error( $assignee_validation ) ) {
				return $assignee_validation;
			}
			$data['assigned_to'] = $assignee_validation;
		}

		if ( array_key_exists( 'dueAt', $payload ) ) {
			$due_validation = $this->validate_and_parse_due_at( $payload['dueAt'] );
			if ( is_wp_error( $due_validation ) ) {
				return $due_validation;
			}
			$data['due_at_utc'] = $due_validation;
		}

		if ( array_key_exists( 'status', $payload ) ) {
			$status = (string) $payload['status'];
			if ( ! in_array( $status, FollowUpStatus::ALLOWED, true ) ) {
				return new \WP_Error( 'veridis_followup_invalid_status', __( 'Invalid status.', 'veridis-news-desk' ), array( 'status' => 400 ) );
			}
			$data['status'] = $status;
			if ( FollowUpStatus::STATUS_DONE === $status && FollowUpStatus::STATUS_DONE !== $existing->status ) {
				$data['completed_at_utc'] = gmdate( 'Y-m-d H:i:s' );
			} elseif ( FollowUpStatus::STATUS_DONE !== $status && FollowUpStatus::STATUS_DONE === $existing->status ) {
				$data['completed_at_utc'] = null;
			}
		}

		if ( empty( $data ) ) {
			return $this->format( $existing );
		}

		$data['updated_at_utc'] = gmdate( 'Y-m-d H:i:s' );
		$updated                = $this->repository->update( $id, $data );
		if ( ! $updated ) {
			return new \WP_Error( 'veridis_followup_update_failed', __( 'Could not update follow-up.', 'veridis-news-desk' ), array( 'status' => 500 ) );
		}

		$fresh = $this->repository->get( $id );
		return $this->format( $fresh );
	}

	public function determine_default_assignee( int $post_id ): int {
		$has_assigned = metadata_exists( 'post', $post_id, '_veridis_assigned_to' );
		if ( $has_assigned ) {
			$raw_assigned = get_post_meta( $post_id, '_veridis_assigned_to', true );
			// Explicitly unassigned if 0, -1, or empty
			if ( '0' === (string) $raw_assigned || '-1' === (string) $raw_assigned || '' === (string) $raw_assigned ) {
				return 0;
			}

			$assigned_to = absint( $raw_assigned );
			if ( $assigned_to > 0 ) {
				$user = get_userdata( $assigned_to );
				if ( $user && user_can( $user, 'edit_posts' ) ) {
					return $assigned_to;
				}
			}
			return 0;
		}

		// No explicit assignment state on article - check post author first per editorial fallback
		$post = get_post( $post_id );
		$author_id = $post ? (int) $post->post_author : 0;
		if ( $author_id > 0 ) {
			$author = get_userdata( $author_id );
			if ( $author && user_can( $author, 'edit_posts' ) ) {
				return $author_id;
			}
		}

		// Fallback to current user if eligible
		$current_user_id = get_current_user_id();
		if ( $current_user_id && current_user_can( 'edit_posts' ) ) {
			return $current_user_id;
		}

		return 0;
	}

	public function validate_title( $title ) {
		$clean = sanitize_text_field( trim( (string) $title ) );
		if ( '' === $clean ) {
			return new \WP_Error( 'veridis_followup_empty_title', __( 'Follow-up title is required.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}
		if ( mb_strlen( $clean ) > 190 ) {
			return new \WP_Error( 'veridis_followup_title_too_long', __( 'Title cannot exceed 190 characters.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}
		return $clean;
	}

	public function validate_assigned_to( int $user_id ) {
		if ( 0 === $user_id || -1 === $user_id ) {
			return 0;
		}
		$user = get_userdata( $user_id );
		if ( ! $user || ! user_can( $user_id, 'edit_posts' ) ) {
			return new \WP_Error( 'veridis_followup_invalid_assignee', __( 'Selected assignee is invalid or ineligible.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}
		return $user_id;
	}

	public function validate_and_parse_due_at( $due_at ) {
		if ( null === $due_at || '' === trim( (string) $due_at ) ) {
			return null;
		}

		$input = trim( (string) $due_at );
		$tz    = wp_timezone();

		try {
			// If no timezone offset is in the input, interpret in site timezone
			if ( ! preg_match( '/(Z|[+-]\d{2}:?\d{2})$/', $input ) ) {
				$dt = new \DateTimeImmutable( $input, $tz );
			} else {
				$dt = new \DateTimeImmutable( $input );
			}
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'veridis_followup_invalid_date', __( 'Invalid due date format.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}

		return $dt->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
	}

	public function format( object $row, ?object $post = null ): array {
		$post_id = (int) $row->post_id;
		$post    = $post ?: get_post( $post_id );

		$article_title  = $post ? ( '' !== trim( $post->post_title ) ? wp_specialchars_decode( $post->post_title, ENT_QUOTES ) : __( '(no title)', 'veridis-news-desk' ) ) : ( $row->article_title ?? '' );
		$article_status = $post ? (string) $post->post_status : ( $row->article_status ?? 'draft' );

		$tz      = wp_timezone();
		$now_utc = gmdate( 'Y-m-d H:i:s' );

		$now_site         = current_datetime();
		$end_of_today_utc = $now_site->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

		$status = (string) $row->status;

		$due_at_utc   = $row->due_at_utc ? (string) $row->due_at_utc : null;
		$due_at_iso   = null;
		$due_at_local = null;
		$due_label    = __( 'No deadline', 'veridis-news-desk' );
		$due_state    = 'no_deadline';
		$is_overdue   = false;

		if ( $due_at_utc ) {
			$utc_dt       = new \DateTimeImmutable( $due_at_utc, new \DateTimeZone( 'UTC' ) );
			$site_dt      = $utc_dt->setTimezone( $tz );
			$due_at_iso   = $utc_dt->format( 'Y-m-d\TH:i:s\Z' );
			$due_at_local = $site_dt->format( 'Y-m-d\TH:i' );

			if ( FollowUpStatus::STATUS_OPEN === $status ) {
				if ( $due_at_utc < $now_utc ) {
					$is_overdue = true;
					$due_state  = 'overdue';
				} elseif ( $due_at_utc <= $end_of_today_utc ) {
					$due_state = 'due_today';
				} else {
					$due_state = 'upcoming';
				}
			} else {
				$due_state = FollowUpStatus::STATUS_DONE === $status ? 'done' : 'cancelled';
			}

			$due_label = $this->format_due_label( $site_dt, $is_overdue, $due_state );
		}

		$assigned_to = (int) $row->assigned_to;
		$assignee    = $assigned_to > 0 ? get_userdata( $assigned_to ) : null;
		$creator     = get_userdata( (int) $row->created_by );

		return array(
			'id'               => (int) $row->id,
			'postId'           => $post_id,
			'articleTitle'     => $article_title,
			'articleStatus'    => $article_status,
			'title'            => wp_specialchars_decode( (string) $row->title, ENT_QUOTES ),
			'notes'            => (string) ( $row->notes ?? '' ),
			'assignedTo'       => $assigned_to,
			'assignedName'     => $assignee ? $assignee->display_name : ( 0 === $assigned_to ? __( 'Unassigned', 'veridis-news-desk' ) : __( 'Unknown', 'veridis-news-desk' ) ),
			'assignedInitials' => $assignee ? $this->initials( $assignee->display_name ) : '',
			'isUnassigned'     => 0 === $assigned_to,
			'status'           => $status,
			'statusLabel'      => FollowUpStatus::label( $status ),
			'statusTone'       => FollowUpStatus::tone( $status ),
			'dueAt'            => $due_at_iso,
			'dueAtLocal'       => $due_at_local,
			'dueLabel'         => $due_label,
			'dueState'         => $due_state,
			'isOverdue'        => $is_overdue,
			'createdBy'        => (int) $row->created_by,
			'createdByName'    => $creator ? $creator->display_name : __( 'System', 'veridis-news-desk' ),
			'createdAt'        => ( new \DateTimeImmutable( (string) $row->created_at_utc, new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' ),
			'updatedAt'        => ( new \DateTimeImmutable( (string) $row->updated_at_utc, new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' ),
			'completedAt'      => $row->completed_at_utc ? ( new \DateTimeImmutable( (string) $row->completed_at_utc, new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' ) : null,
		);
	}

	private function format_due_label( \DateTimeImmutable $site_dt, bool $is_overdue, string $due_state ): string {
		$now_site = current_datetime();
		$time_str = wp_date( 'H:i', $site_dt->getTimestamp() );

		if ( $is_overdue ) {
			$diff = $now_site->getTimestamp() - $site_dt->getTimestamp();
			if ( $diff < 3600 ) {
				$mins = max( 1, (int) round( $diff / 60 ) );
				/* translators: %d: number of minutes overdue */
				return sprintf( _n( 'Overdue by %d min', 'Overdue by %d mins', $mins, 'veridis-news-desk' ), $mins );
			}
			if ( $diff < 86400 ) {
				$hours = max( 1, (int) round( $diff / 3600 ) );
				/* translators: %d: number of hours overdue */
				return sprintf( _n( 'Overdue by %d hr', 'Overdue by %d hrs', $hours, 'veridis-news-desk' ), $hours );
			}
			/* translators: %s: formatted date */
			return sprintf( __( 'Overdue (%s)', 'veridis-news-desk' ), wp_date( 'M j', $site_dt->getTimestamp() ) );
		}

		if ( 'due_today' === $due_state ) {
			/* translators: %s: formatted local time. */
			return sprintf( __( 'Today, %s', 'veridis-news-desk' ), $time_str );
		}

		$tomorrow_start = $now_site->setTime( 0, 0, 0 )->modify( '+1 day' );
		$tomorrow_end   = $tomorrow_start->modify( '+1 day' );
		if ( $site_dt >= $tomorrow_start && $site_dt < $tomorrow_end ) {
			/* translators: %s: formatted local time. */
			return sprintf( __( 'Tomorrow, %s', 'veridis-news-desk' ), $time_str );
		}

		if ( $site_dt->format( 'Y' ) === $now_site->format( 'Y' ) ) {
			return wp_date( 'M j, H:i', $site_dt->getTimestamp() );
		}

		return wp_date( 'M j Y, H:i', $site_dt->getTimestamp() );
	}

	private function initials( string $name ): string {
		$parts = preg_split( '/\s+/', trim( $name ) );
		if ( empty( $parts ) || '' === $parts[0] ) {
			return '?';
		}
		if ( 1 === count( $parts ) ) {
			return mb_strtoupper( mb_substr( $parts[0], 0, 1 ) );
		}
		return mb_strtoupper( mb_substr( $parts[0], 0, 1 ) . mb_substr( end( $parts ), 0, 1 ) );
	}
}
