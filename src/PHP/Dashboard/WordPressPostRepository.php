<?php
namespace Veridis\NewsDesk\Dashboard;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Editorial\EditorialMetadataRepository;
use Veridis\NewsDesk\Editorial\Priority;
use Veridis\NewsDesk\Newsroom\WordPressStatus;

/** Read-only, bounded queries used by the dashboard. */
final class WordPressPostRepository {
	public function count_stories(): int {
		return count( Access::readable_post_ids() );
	}

	public function count_published_between( \DateTimeImmutable $start, \DateTimeImmutable $end ): int {
		global $wpdb;

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(ID) FROM {$wpdb->posts}
				WHERE post_type = %s AND post_status = %s
				AND post_date >= %s AND post_date < %s AND " . Access::readable_post_sql( $wpdb->posts ),
				'post',
				'publish',
				$start->format( 'Y-m-d H:i:s' ),
				$end->format( 'Y-m-d H:i:s' )
			)
		);
	}

	public function count_scheduled(): int {
		global $wpdb;
		return (int) $wpdb->get_var( "SELECT COUNT(ID) FROM {$wpdb->posts} posts WHERE posts.post_type = 'post' AND posts.post_status = 'future' AND " . Access::readable_post_sql( 'posts' ) );
	}

	/**
	 * Select the most urgent active work without loading post content.
	 *
	 * @return array<int, object>
	 */
	public function dashboard_editorial_work( int $limit = 6 ): array {
		global $wpdb;
		$now_utc = gmdate( 'Y-m-d H:i:s' );
		$end_of_today_utc = current_datetime()->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
		$limit = max( 1, min( 6, $limit ) );

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT posts.ID, posts.post_title, posts.post_author, posts.post_status, posts.post_modified, posts.post_date, posts.post_excerpt
				FROM {$wpdb->posts} posts
				LEFT JOIN {$wpdb->postmeta} deadline ON deadline.meta_id = (
					SELECT MIN(meta_id) FROM {$wpdb->postmeta}
					WHERE post_id = posts.ID AND meta_key = %s
				)
				LEFT JOIN {$wpdb->postmeta} priority ON priority.meta_id = (
					SELECT MIN(meta_id) FROM {$wpdb->postmeta}
					WHERE post_id = posts.ID AND meta_key = %s
				)
				WHERE posts.post_type = 'post' AND posts.post_status IN ('draft', 'pending', 'future') AND " . Access::readable_post_sql( 'posts' ) . "
				ORDER BY
					CASE
							WHEN deadline.meta_value != '' AND deadline.meta_value < %s THEN 0
							WHEN priority.meta_value = %s THEN 1
							WHEN priority.meta_value = %s THEN 2
							WHEN deadline.meta_value >= %s AND deadline.meta_value <= %s THEN 3
							ELSE 4
						END ASC,
					CASE WHEN deadline.meta_value != '' AND deadline.meta_value <= %s THEN deadline.meta_value END ASC,
					posts.post_modified DESC, posts.ID DESC
				LIMIT %d",
				EditorialMetadataRepository::META_DEADLINE,
				EditorialMetadataRepository::META_PRIORITY,
				$now_utc,
				Priority::URGENT,
				Priority::HIGH,
				$now_utc,
				$end_of_today_utc,
				$end_of_today_utc,
				$limit
			)
		);

		$this->prime_related_caches( $rows );
		return $rows;
	}

	/** @return array{dueToday:int,items:array<int,object>} */
	public function deadline_watch( int $limit = 8 ): array {
		global $wpdb;
		$now_utc = gmdate( 'Y-m-d H:i:s' );
		$end_of_today_utc = current_datetime()->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
		$limit = max( 1, min( 10, $limit ) );

		$due_today = (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT COUNT(DISTINCT posts.ID) FROM {$wpdb->posts} posts
			INNER JOIN {$wpdb->postmeta} deadline ON deadline.meta_id = (
				SELECT MIN(meta_id) FROM {$wpdb->postmeta}
				WHERE post_id = posts.ID AND meta_key = %s
			)
			WHERE posts.post_type = 'post' AND posts.post_status IN ('draft', 'pending', 'future') AND " . Access::readable_post_sql( 'posts' ) . "
			AND deadline.meta_value >= %s AND deadline.meta_value <= %s",
			EditorialMetadataRepository::META_DEADLINE,
			$now_utc,
			$end_of_today_utc
		) );

		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT posts.ID, posts.post_title, posts.post_author, posts.post_status, posts.post_modified, posts.post_date, posts.post_excerpt
			FROM {$wpdb->posts} posts
			INNER JOIN {$wpdb->postmeta} deadline ON deadline.meta_id = (
				SELECT MIN(meta_id) FROM {$wpdb->postmeta}
				WHERE post_id = posts.ID AND meta_key = %s
			)
			WHERE posts.post_type = 'post' AND posts.post_status IN ('draft', 'pending', 'future') AND " . Access::readable_post_sql( 'posts' ) . "
			AND deadline.meta_value != '' AND deadline.meta_value <= %s
			ORDER BY deadline.meta_value ASC, posts.ID DESC
			LIMIT %d",
			EditorialMetadataRepository::META_DEADLINE,
			$end_of_today_utc,
			$limit
		) );

		$this->prime_related_caches( $rows );
		return array( 'dueToday' => $due_today, 'items' => $rows );
	}

	/** @return string[] */
	public function category_names( int $post_id ): array {
		$terms = get_the_terms( $post_id, 'category' );
		if ( ! is_array( $terms ) ) {
			return array();
		}

		return array_values( wp_list_pluck( $terms, 'name' ) );
	}

	/** @param array<int, object> $rows */
	private function prime_related_caches( array $rows ): void {
		$post_ids   = array_map( 'intval', wp_list_pluck( $rows, 'ID' ) );
		$author_ids = array_unique( array_map( 'intval', wp_list_pluck( $rows, 'post_author' ) ) );
		if ( $post_ids ) {
			update_meta_cache( 'post', $post_ids );
			update_object_term_cache( $post_ids, 'post' );
		}
		if ( $author_ids ) {
			cache_users( $author_ids );
		}
	}
}
