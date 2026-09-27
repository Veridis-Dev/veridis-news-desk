<?php
namespace Veridis\NewsDesk\Editorial;

defined( 'ABSPATH' ) || exit;

final class EditorialMetadataRepository {
	public const META_STATUS   = '_veridis_editorial_status';
	public const META_ASSIGNED = '_veridis_assigned_to';
	public const META_PENDING_AUTHOR = '_veridis_pending_initial_author';
	public const META_DEADLINE = '_veridis_deadline';
	public const META_PRIORITY = '_veridis_priority';
	public const META_NOTES    = '_veridis_internal_notes';
	public const META_SOURCES  = '_veridis_news_sources';

	public const META_LEGACY_SOURCE       = '_veridis_news_source';
	public const META_LEGACY_PHOTO_CREDIT = '_veridis_news_photo_credit';

	/**
	 * Retrieve normalized editorial metadata for a post, with fallbacks.
	 *
	 * @return array{
	 *     editorial_status: string,
	 *     has_explicit_status: bool,
	 *     assigned_to: int,
	 *     is_unassigned: bool,
	 *     has_explicit_assigned: bool,
	 *     deadline_utc: ?string,
	 *     priority: string,
	 *     has_explicit_priority: bool,
	 *     internal_notes: string,
	 *     sources: array<int, array{id: string, name: string, status: string}>
	 * }
	 */
	public function get( int $post_id, ?object $post = null ): array {
		if ( ! $post ) {
			$post = get_post( $post_id );
		}

		$post_status = $post ? (string) $post->post_status : 'draft';
		$post_author = $post ? (int) $post->post_author : 0;

		// 1. Editorial Status
		$has_status = metadata_exists( 'post', $post_id, self::META_STATUS );
		$raw_status = (string) get_post_meta( $post_id, self::META_STATUS, true );
		$editorial_status = ( $has_status && EditorialStatus::is_valid( $raw_status ) )
			? $raw_status
			: EditorialStatus::default_from_post_status( $post_status );

		// 2. Assigned To
		// Distinguish:
		// - meta key absent -> fallback to post author if author can edit_posts
		// - meta key exists and is 0 -> explicitly Unassigned
		// - meta key exists and is > 0 -> explicitly assigned
		$has_assigned = metadata_exists( 'post', $post_id, self::META_ASSIGNED );
		if ( $has_assigned ) {
			$raw_assigned = get_post_meta( $post_id, self::META_ASSIGNED, true );
			$assigned_to  = absint( $raw_assigned );
			$is_unassigned = ( 0 === $assigned_to );
		} else {
			// Fallback to author if eligible
			$author_user = $post_author ? get_userdata( $post_author ) : null;
			if ( $author_user && user_can( $author_user, 'edit_posts' ) ) {
				$assigned_to   = $post_author;
				$is_unassigned = false;
			} else {
				$assigned_to   = 0;
				$is_unassigned = true;
			}
		}

		// 3. Deadline (stored canonically as UTC 'Y-m-d H:i:s')
		$raw_deadline = (string) get_post_meta( $post_id, self::META_DEADLINE, true );
		$deadline_utc = ( '' !== $raw_deadline ) ? $raw_deadline : null;

		// 4. Priority
		$has_priority = metadata_exists( 'post', $post_id, self::META_PRIORITY );
		$raw_priority = (string) get_post_meta( $post_id, self::META_PRIORITY, true );
		$priority     = ( $has_priority && Priority::is_valid( $raw_priority ) )
			? $raw_priority
			: Priority::DEFAULT;

		// 5. Internal Notes
		$internal_notes = (string) get_post_meta( $post_id, self::META_NOTES, true );

		// 6. Structured Sources
		$sources_meta = get_post_meta( $post_id, self::META_SOURCES, true );
		$sources      = array();
		if ( is_array( $sources_meta ) && ! empty( $sources_meta ) ) {
			foreach ( $sources_meta as $item ) {
				if ( is_array( $item ) && isset( $item['name'] ) && '' !== trim( (string) $item['name'] ) ) {
					$status = ( isset( $item['status'] ) && SourceStatus::is_valid( (string) $item['status'] ) )
						? (string) $item['status']
						: SourceStatus::DEFAULT;
					$sources[] = array(
						'id'     => isset( $item['id'] ) && '' !== trim( (string) $item['id'] ) ? (string) $item['id'] : wp_generate_uuid4(),
						'name'   => sanitize_text_field( (string) $item['name'] ),
						'status' => $status,
					);
				}
			}
		}

		// Fallback to legacy single source if structured sources empty
		if ( empty( $sources ) ) {
			$legacy = (string) get_post_meta( $post_id, self::META_LEGACY_SOURCE, true );
			if ( '' !== trim( $legacy ) ) {
				$sources[] = array(
					'id'     => 'legacy-source',
					'name'   => trim( $legacy ),
					'status' => SourceStatus::DEFAULT,
				);
			}
		}

		return array(
			'editorial_status'      => $editorial_status,
			'has_explicit_status'   => $has_status,
			'assigned_to'           => $assigned_to,
			'is_unassigned'         => $is_unassigned,
			'has_explicit_assigned' => $has_assigned,
			'deadline_utc'          => $deadline_utc,
			'priority'              => $priority,
			'has_explicit_priority' => $has_priority,
			'internal_notes'        => $internal_notes,
			'sources'               => $sources,
		);
	}

	/**
	 * Save updated editorial metadata for a post.
	 *
	 * @param int $post_id
	 * @param array $data
	 */
	public function save( int $post_id, array $data ): void {
		if ( array_key_exists( 'editorial_status', $data ) ) {
			update_post_meta( $post_id, self::META_STATUS, $data['editorial_status'] );
		}

		if ( array_key_exists( 'assigned_to', $data ) ) {
			// Save integer value, explicitly allowing 0 for Unassigned
			update_post_meta( $post_id, self::META_ASSIGNED, (int) $data['assigned_to'] );
		}

		if ( array_key_exists( 'deadline_utc', $data ) ) {
			if ( null === $data['deadline_utc'] || '' === $data['deadline_utc'] ) {
				delete_post_meta( $post_id, self::META_DEADLINE );
			} else {
				update_post_meta( $post_id, self::META_DEADLINE, (string) $data['deadline_utc'] );
			}
		}

		if ( array_key_exists( 'priority', $data ) ) {
			update_post_meta( $post_id, self::META_PRIORITY, $data['priority'] );
		}

		if ( array_key_exists( 'internal_notes', $data ) ) {
			update_post_meta( $post_id, self::META_NOTES, $data['internal_notes'] );
		}

		if ( array_key_exists( 'sources', $data ) ) {
			update_post_meta( $post_id, self::META_SOURCES, $data['sources'] );
		}
	}

	/**
	 * Batch prime post meta cache.
	 *
	 * @param int[] $post_ids
	 */
	public function prime_cache( array $post_ids ): void {
		if ( $post_ids ) {
			update_meta_cache( 'post', $post_ids );
		}
	}
}
