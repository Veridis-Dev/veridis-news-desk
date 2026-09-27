<?php
namespace Veridis\NewsDesk\FollowUps;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;

final class FollowUpRepository {
	private $table;

	public function __construct( ?string $table = null ) {
		global $wpdb;
		$this->table = $table ?: FollowUpInstaller::table_name( $wpdb );
	}

	public function table(): string {
		return $this->table;
	}

	public function get( int $id ): ?object {
		global $wpdb;
		$row = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d LIMIT 1", $id )
		);
		return $row ?: null;
	}

	/** @return array<int,object> */
	public function get_for_article( int $post_id ): array {
		global $wpdb;
		$now_utc          = gmdate( 'Y-m-d H:i:s' );
		$now_site         = current_datetime();
		$end_of_today_utc = $now_site->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

		$sql = $wpdb->prepare(
			"SELECT f.* FROM {$this->table} AS f
			WHERE f.post_id = %d
			ORDER BY
				CASE WHEN f.status = 'open' THEN 0 ELSE 1 END ASC,
				CASE
					WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc < %s THEN 1
					WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc <= %s THEN 2
					WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL THEN 3
					WHEN f.status = 'open' THEN 4
					ELSE 5
				END ASC,
				CASE WHEN f.due_at_utc IS NOT NULL THEN f.due_at_utc END ASC,
				f.created_at_utc DESC,
				f.id DESC",
			$post_id,
			$now_utc,
			$end_of_today_utc
		);

		return $wpdb->get_results( $sql ) ?: array();
	}

	/**
	 * Single batch query to return open and overdue follow-up counts for a list of post IDs.
	 * Zero N+1 queries.
	 *
	 * @param array<int,int> $post_ids
	 * @return array<int,array{open:int,overdue:int}>
	 */
	public function counts_for_posts( array $post_ids ): array {
		global $wpdb;
		$requested_ids = array_values( array_filter( array_map( 'intval', $post_ids ) ) );
		$map = array();
		foreach ( $requested_ids as $id ) {
			$map[ $id ] = array( 'open' => 0, 'overdue' => 0 );
		}
		$allowed = array_flip( Access::readable_post_ids() );
		$clean_ids = array_values( array_filter( $requested_ids, static function ( $id ) use ( $allowed ) {
			return isset( $allowed[ $id ] );
		} ) );
		if ( empty( $clean_ids ) ) {
			return $map;
		}

		$now_utc = gmdate( 'Y-m-d H:i:s' );
		$in_list = implode( ',', $clean_ids );

		$sql = $wpdb->prepare(
			"SELECT f.post_id,
				COUNT(*) AS open_count,
				SUM(CASE WHEN f.due_at_utc IS NOT NULL AND f.due_at_utc < %s THEN 1 ELSE 0 END) AS overdue_count
			FROM {$this->table} AS f
			WHERE f.post_id IN ({$in_list}) AND f.status = 'open'
			GROUP BY f.post_id",
			$now_utc
		);

		$results = $wpdb->get_results( $sql );

		if ( $results ) {
			foreach ( $results as $row ) {
				$pid = (int) $row->post_id;
				$map[ $pid ] = array(
					'open'    => (int) $row->open_count,
					'overdue' => (int) $row->overdue_count,
				);
			}
		}

		return $map;
	}

	/**
	 * @param array<string,mixed> $filters
	 * @return array{items:array<int,object>,total:int,pages:int,page:int,counts:array<string,int>}
	 */
	public function query( array $filters ): array {
		global $wpdb;

		$now_utc          = gmdate( 'Y-m-d H:i:s' );
		$now_site         = current_datetime();
		$end_of_today_utc = $now_site->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

		$page     = max( 1, (int) ( $filters['page'] ?? 1 ) );
		$per_page = max( 1, min( 100, (int) ( $filters['per_page'] ?? 25 ) ) );
		$offset   = ( $page - 1 ) * $per_page;

		$wheres = array( Access::readable_post_sql( 'p' ) );
		$joins  = array(
			'posts' => "INNER JOIN {$wpdb->posts} AS p ON f.post_id = p.ID",
		);

		// Status filter: default 'open'
		$status = $filters['status'] ?? 'open';
		if ( 'all' !== $status && in_array( $status, FollowUpStatus::ALLOWED, true ) ) {
			$wheres[] = $wpdb->prepare( 'f.status = %s', $status );
		}

		// Mutually exclusive Due filters
		$due = $filters['due'] ?? 'all';
		if ( 'overdue' === $due ) {
			$wheres[] = $wpdb->prepare( "f.due_at_utc IS NOT NULL AND f.due_at_utc < %s", $now_utc );
		} elseif ( 'due_today' === $due ) {
			$wheres[] = $wpdb->prepare( "f.due_at_utc IS NOT NULL AND f.due_at_utc >= %s AND f.due_at_utc <= %s", $now_utc, $end_of_today_utc );
		} elseif ( 'upcoming' === $due ) {
			$wheres[] = $wpdb->prepare( "f.due_at_utc IS NOT NULL AND f.due_at_utc > %s", $end_of_today_utc );
		} elseif ( 'no_deadline' === $due ) {
			$wheres[] = 'f.due_at_utc IS NULL';
		}

		// Assigned to filter
		if ( isset( $filters['assigned_to'] ) ) {
			$assigned_to = (int) $filters['assigned_to'];
			if ( -1 === $assigned_to ) {
				$wheres[] = 'f.assigned_to = 0';
			} elseif ( $assigned_to > 0 ) {
				$wheres[] = $wpdb->prepare( 'f.assigned_to = %d', $assigned_to );
			}
		}

		// Article filter
		if ( ! empty( $filters['post_id'] ) ) {
			$wheres[] = $wpdb->prepare( 'f.post_id = %d', (int) $filters['post_id'] );
		}

		// Search
		if ( ! empty( $filters['search'] ) ) {
			$search_term = '%' . $wpdb->esc_like( sanitize_text_field( $filters['search'] ) ) . '%';
			$wheres[]    = $wpdb->prepare(
				'(f.title LIKE %s OR f.notes LIKE %s OR p.post_title LIKE %s)',
				$search_term,
				$search_term,
				$search_term
			);
		}

		$where_clause = ! empty( $wheres ) ? 'WHERE ' . implode( ' AND ', $wheres ) : '';
		$join_clause  = implode( ' ', array_values( $joins ) );

		$order_clause = "ORDER BY
			CASE
				WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc < '{$now_utc}' THEN 1
				WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc <= '{$end_of_today_utc}' THEN 2
				WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL THEN 3
				WHEN f.status = 'open' THEN 4
				ELSE 5
			END ASC,
			CASE WHEN f.due_at_utc IS NOT NULL THEN f.due_at_utc END ASC,
			f.created_at_utc DESC,
			f.id DESC";

		$total_sql = "SELECT COUNT(*) FROM {$this->table} AS f {$join_clause} {$where_clause}";
		$total     = (int) $wpdb->get_var( $total_sql );
		$pages     = max( 1, (int) ceil( $total / $per_page ) );

		$items_sql = "SELECT f.*, p.post_title AS article_title, p.post_status AS article_status, p.post_author AS article_author
			FROM {$this->table} AS f
			{$join_clause}
			{$where_clause}
			{$order_clause}
			LIMIT {$offset}, {$per_page}";

		$items = $wpdb->get_results( $items_sql ) ?: array();

		// Calculate summary counts (mutually exclusive)
		$counts_sql = $wpdb->prepare(
			"SELECT
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc < %s THEN 1 ELSE 0 END), 0) AS overdue_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc >= %s AND f.due_at_utc <= %s THEN 1 ELSE 0 END), 0) AS due_today_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc > %s THEN 1 ELSE 0 END), 0) AS upcoming_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NULL THEN 1 ELSE 0 END), 0) AS no_deadline_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' THEN 1 ELSE 0 END), 0) AS total_open_count,
				COALESCE(SUM(CASE WHEN f.status = 'done' THEN 1 ELSE 0 END), 0) AS done_count,
				COALESCE(SUM(CASE WHEN f.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_count
			FROM {$this->table} AS f
			INNER JOIN {$wpdb->posts} AS p ON f.post_id = p.ID
			WHERE " . Access::readable_post_sql( 'p' ),
			$now_utc,
			$now_utc,
			$end_of_today_utc,
			$end_of_today_utc
		);

		$counts_row = $wpdb->get_row( $counts_sql );
		$counts     = array(
			'overdue'    => $counts_row ? (int) $counts_row->overdue_count : 0,
			'dueToday'   => $counts_row ? (int) $counts_row->due_today_count : 0,
			'upcoming'   => $counts_row ? (int) $counts_row->upcoming_count : 0,
			'noDeadline' => $counts_row ? (int) $counts_row->no_deadline_count : 0,
			'totalOpen'  => $counts_row ? (int) $counts_row->total_open_count : 0,
			'done'       => $counts_row ? (int) $counts_row->done_count : 0,
			'cancelled'  => $counts_row ? (int) $counts_row->cancelled_count : 0,
		);

		return array(
			'items'  => $items,
			'total'  => $total,
			'pages'  => $pages,
			'page'   => $page,
			'counts' => $counts,
		);
	}

	public function top_priority_open( int $limit = 5 ): array {
		global $wpdb;
		$now_utc          = gmdate( 'Y-m-d H:i:s' );
		$now_site         = current_datetime();
		$end_of_today_utc = $now_site->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

		$sql = $wpdb->prepare(
			"SELECT f.*, p.post_title AS article_title, p.post_status AS article_status, p.post_author AS article_author
			FROM {$this->table} AS f
			INNER JOIN {$wpdb->posts} AS p ON f.post_id = p.ID
			WHERE f.status = 'open' AND " . Access::readable_post_sql( 'p' ) . "
			ORDER BY
				CASE
					WHEN f.due_at_utc IS NOT NULL AND f.due_at_utc < %s THEN 1
					WHEN f.due_at_utc IS NOT NULL AND f.due_at_utc <= %s THEN 2
					WHEN f.due_at_utc IS NOT NULL THEN 3
					ELSE 4
				END ASC,
				CASE WHEN f.due_at_utc IS NOT NULL THEN f.due_at_utc END ASC,
				f.created_at_utc DESC,
				f.id DESC
			LIMIT %d",
			$now_utc,
			$end_of_today_utc,
			$limit
		);

		return $wpdb->get_results( $sql ) ?: array();
	}

	public function summary_counts(): array {
		global $wpdb;
		$now_utc          = gmdate( 'Y-m-d H:i:s' );
		$now_site         = current_datetime();
		$end_of_today_utc = $now_site->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

		$sql = $wpdb->prepare(
			"SELECT
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc < %s THEN 1 ELSE 0 END), 0) AS overdue_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc >= %s AND f.due_at_utc <= %s THEN 1 ELSE 0 END), 0) AS due_today_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NOT NULL AND f.due_at_utc > %s THEN 1 ELSE 0 END), 0) AS upcoming_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' AND f.due_at_utc IS NULL THEN 1 ELSE 0 END), 0) AS no_deadline_count,
				COALESCE(SUM(CASE WHEN f.status = 'open' THEN 1 ELSE 0 END), 0) AS total_open_count
			FROM {$this->table} AS f
			INNER JOIN {$wpdb->posts} AS p ON f.post_id = p.ID
			WHERE " . Access::readable_post_sql( 'p' ),
			$now_utc,
			$now_utc,
			$end_of_today_utc,
			$end_of_today_utc
		);

		$row = $wpdb->get_row( $sql );
		return array(
			'overdue'   => $row ? (int) $row->overdue_count : 0,
			'dueToday'  => $row ? (int) $row->due_today_count : 0,
			'upcoming'  => $row ? (int) $row->upcoming_count : 0,
			'totalOpen' => $row ? (int) $row->total_open_count : 0,
		);
	}

	public function insert( array $data ): int {
		global $wpdb;
		$result = $wpdb->insert( $this->table, $data );
		if ( false === $result ) {
			return 0;
		}
		return (int) $wpdb->insert_id;
	}

	public function update( int $id, array $data ): bool {
		global $wpdb;
		$result = $wpdb->update( $this->table, $data, array( 'id' => $id ) );
		return false !== $result;
	}
}
