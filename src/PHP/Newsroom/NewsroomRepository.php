<?php
namespace Veridis\NewsDesk\Newsroom;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\ArticleHealth\ArticleHealthService;
use Veridis\NewsDesk\Core\Access;

final class NewsroomRepository {
	private $health;

	public function __construct( ?ArticleHealthService $health = null ) {
		$this->health = $health ?: new ArticleHealthService();
	}

	public function count_all(): int {
		return count( Access::readable_post_ids() );
	}

	/** @return array{rows:array<int,object>,total:int,pages:int} */
	public function query( array $filters ): array {
		global $wpdb;
		$table = $wpdb->posts;

		$clauses = $this->build_filter_clauses( $filters, $table );
		$joins   = $clauses['joins'];
		$wheres  = $clauses['wheres'];
		$wheres[] = Access::readable_post_sql( $table );

		// Sorting joins
		$sort = $filters['sort'] ?? 'recent';
		if ( 'deadline_soonest' === $sort && ! isset( $joins['meta_deadline'] ) ) {
			$joins['meta_deadline'] = "LEFT JOIN {$wpdb->postmeta} AS meta_deadline ON ({$table}.ID = meta_deadline.post_id AND meta_deadline.meta_key = '_veridis_deadline')";
		} elseif ( 'priority' === $sort && ! isset( $joins['meta_priority'] ) ) {
			$joins['meta_priority'] = "LEFT JOIN {$wpdb->postmeta} AS meta_priority ON ({$table}.ID = meta_priority.post_id AND meta_priority.meta_key = '_veridis_priority')";
		}

		$join_filter = function ( string $join ) use ( $joins ): string {
			if ( ! empty( $joins ) ) {
				$join .= ' ' . implode( ' ', array_values( $joins ) );
			}
			return $join;
		};

		$where_filter = function ( string $where ) use ( $wheres ): string {
			if ( ! empty( $wheres ) ) {
				$where .= ' AND ' . implode( ' AND ', $wheres );
			}
			return $where;
		};

		$order_filter = function ( string $orderby ) use ( $sort, $table ): string {
			if ( 'recent' === $sort ) {
				return "FIELD({$table}.post_status, 'draft', 'pending', 'future', 'publish'), {$table}.post_modified DESC, {$table}.ID DESC";
			}
			if ( 'deadline_soonest' === $sort ) {
				return "CASE WHEN meta_deadline.meta_value IS NOT NULL AND meta_deadline.meta_value != '' THEN 0 ELSE 1 END ASC, meta_deadline.meta_value ASC, {$table}.post_modified DESC";
			}
			if ( 'priority' === $sort ) {
				return "FIELD(COALESCE(meta_priority.meta_value, 'normal'), 'urgent', 'high', 'normal', 'low') ASC, {$table}.post_modified DESC, {$table}.ID DESC";
			}
			return $orderby;
		};

		add_filter( 'posts_join', $join_filter );
		add_filter( 'posts_where', $where_filter );
		add_filter( 'posts_orderby', $order_filter );

		$args = array(
			'post_type'              => 'post',
			'post_status'            => 'all' === $filters['status'] ? WordPressStatus::ALLOWED : ( 'active' === $filters['status'] ? WordPressStatus::ACTIVE_STATUSES : array( $filters['status'] ) ),
			'posts_per_page'         => $filters['per_page'],
			'paged'                  => $filters['page'],
			'fields'                 => 'ids',
			'no_found_rows'          => false,
			'ignore_sticky_posts'    => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			's'                      => $filters['search'],
			'post_search_columns'    => array( 'post_title' ),
		);
		if ( $filters['author'] ) {
			$args['author'] = $filters['author'];
		}
		if ( $filters['category'] ) {
			$args['cat'] = $filters['category'];
		}
		if ( 'today' === $filters['period'] ) {
			$start = current_datetime()->setTime( 0, 0, 0 );
			$args['date_query'] = array( array( 'year' => (int) $start->format( 'Y' ), 'month' => (int) $start->format( 'n' ), 'day' => (int) $start->format( 'j' ), 'column' => 'post_date' ) );
		}
		if ( ! in_array( $sort, array( 'recent', 'deadline_soonest', 'priority' ), true ) ) {
			$sorts = array(
				'oldest'     => array( 'orderby' => 'modified', 'order' => 'ASC' ),
				'date_desc'  => array( 'orderby' => 'date', 'order' => 'DESC' ),
				'date_asc'   => array( 'orderby' => 'date', 'order' => 'ASC' ),
				'title_asc'  => array( 'orderby' => 'title', 'order' => 'ASC' ),
			);
			$args = array_merge( $args, $sorts[ $sort ] ?? array() );
		}

		$query = new \WP_Query( $args );
		remove_filter( 'posts_join', $join_filter );
		remove_filter( 'posts_where', $where_filter );
		remove_filter( 'posts_orderby', $order_filter );

		$rows = $this->selected_rows( array_map( 'intval', $query->posts ) );
		$this->prime_related_caches( $rows );

		return array( 'rows' => $rows, 'total' => (int) $query->found_posts, 'pages' => (int) $query->max_num_pages );
	}

	/** @return array{columns:array<string,array{ids:array<int,int>,total:int,limit:int}>,rows:array<int,object>} */
	public function board_query( array $filters ): array {
		global $wpdb;
		$table = $wpdb->posts;

		$status = $filters['status'] ?? 'all';
		if ( 'all' === $status || 'active' === $status ) {
			$post_statuses = WordPressStatus::ACTIVE_STATUSES;
		} else {
			$post_statuses = in_array( $status, WordPressStatus::ALLOWED, true ) ? array( $status ) : WordPressStatus::ACTIVE_STATUSES;
		}

		$now_utc = gmdate( 'Y-m-d H:i:s' );
		$columns = array();
		$all_ids = array();

		foreach ( array( 'idea', 'writing', 'review', 'ready' ) as $col ) {
			$col_filters = $filters;
			$col_filters['editorial_status'] = $col;

			$clauses = $this->build_filter_clauses( $col_filters, $table );
			$clauses['wheres'][] = Access::readable_post_sql( $table );

			if ( ! isset( $clauses['joins']['meta_deadline'] ) ) {
				$clauses['joins']['meta_deadline'] = "LEFT JOIN {$wpdb->postmeta} AS meta_deadline ON ({$table}.ID = meta_deadline.post_id AND meta_deadline.meta_key = '_veridis_deadline')";
			}
			if ( ! isset( $clauses['joins']['meta_priority'] ) ) {
				$clauses['joins']['meta_priority'] = "LEFT JOIN {$wpdb->postmeta} AS meta_priority ON ({$table}.ID = meta_priority.post_id AND meta_priority.meta_key = '_veridis_priority')";
			}

			$join_filter = function ( string $join ) use ( $clauses ): string {
				if ( ! empty( $clauses['joins'] ) ) {
					$join .= ' ' . implode( ' ', array_values( $clauses['joins'] ) );
				}
				return $join;
			};

			$where_filter = function ( string $where ) use ( $clauses ): string {
				if ( ! empty( $clauses['wheres'] ) ) {
					$where .= ' AND ' . implode( ' AND ', $clauses['wheres'] );
				}
				return $where;
			};

			$order_filter = function () use ( $table, $now_utc ): string {
				return "(CASE WHEN meta_deadline.meta_value IS NOT NULL AND meta_deadline.meta_value != '' AND meta_deadline.meta_value < '{$now_utc}' AND {$table}.post_status != 'publish' THEN 0 ELSE 1 END) ASC, " .
					"(CASE " .
					"WHEN meta_priority.meta_value = 'urgent' THEN 1 " .
					"WHEN meta_priority.meta_value = 'high' THEN 2 " .
					"WHEN meta_priority.meta_value = 'normal' OR meta_priority.meta_value IS NULL THEN 3 " .
					"ELSE 4 END) ASC, " .
					"(CASE WHEN meta_deadline.meta_value IS NOT NULL AND meta_deadline.meta_value != '' THEN 0 ELSE 1 END) ASC, " .
					"meta_deadline.meta_value ASC, " .
					"{$table}.post_modified DESC, {$table}.ID DESC";
			};

			add_filter( 'posts_join', $join_filter );
			add_filter( 'posts_where', $where_filter );
			add_filter( 'posts_orderby', $order_filter );

			$args = array(
				'post_type'              => 'post',
				'post_status'            => $post_statuses,
				'posts_per_page'         => 50,
				'paged'                  => 1,
				'fields'                 => 'ids',
				'no_found_rows'          => false,
				'ignore_sticky_posts'    => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				's'                      => $filters['search'] ?? '',
				'post_search_columns'    => array( 'post_title' ),
			);
			if ( ! empty( $filters['author'] ) ) {
				$args['author'] = $filters['author'];
			}
			if ( ! empty( $filters['category'] ) ) {
				$args['cat'] = $filters['category'];
			}
			if ( 'today' === ( $filters['period'] ?? 'all' ) ) {
				$start = current_datetime()->setTime( 0, 0, 0 );
				$args['date_query'] = array( array( 'year' => (int) $start->format( 'Y' ), 'month' => (int) $start->format( 'n' ), 'day' => (int) $start->format( 'j' ), 'column' => 'post_date' ) );
			}

			$query = new \WP_Query( $args );
			remove_filter( 'posts_join', $join_filter );
			remove_filter( 'posts_where', $where_filter );
			remove_filter( 'posts_orderby', $order_filter );

			$col_ids = array_map( 'intval', $query->posts );
			$columns[ $col ] = array(
				'ids'   => $col_ids,
				'total' => (int) $query->found_posts,
				'limit' => 50,
			);
			$all_ids = array_merge( $all_ids, $col_ids );
		}

		$all_ids = array_values( array_unique( $all_ids ) );
		$rows    = $this->selected_rows( $all_ids );
		$this->prime_related_caches( $rows );

		return array(
			'columns' => $columns,
			'rows'    => $rows,
		);
	}

	/** @return array{joins:array<string,string>,wheres:array<int,string>} */
	private function build_filter_clauses( array $filters, string $table ): array {
		global $wpdb;
		$joins  = array();
		$wheres = array();

		// Health filter
		$health_filter = $filters['health'] ?? 'all';
		if ( 'all' !== $health_filter ) {
			$conditions = $this->health->sql_conditions( $table );
			$any_issue = implode( ' OR ', array_map( static function ( $condition ) { return '(' . $condition . ')'; }, $conditions ) );
			$map = array(
				'has_issues'             => '(' . $any_issue . ')',
				'complete'               => 'NOT (' . $any_issue . ')',
				'missing_featured_image' => $conditions['missing_featured_image'],
				'missing_excerpt'        => $conditions['missing_excerpt'],
				'missing_source'         => $conditions['missing_source'],
				'missing_photo_credit'   => $conditions['missing_photo_credit'],
			);
			if ( isset( $map[ $health_filter ] ) ) {
				$wheres[] = '(' . $map[ $health_filter ] . ')';
			}
		}

		// Editorial status filter with fallbacks
		$editorial_status = $filters['editorial_status'] ?? 'all';
		if ( 'all' !== $editorial_status ) {
			$joins['meta_editorial_status'] = "LEFT JOIN {$wpdb->postmeta} AS meta_editorial_status ON ({$table}.ID = meta_editorial_status.post_id AND meta_editorial_status.meta_key = '_veridis_editorial_status')";
			if ( 'writing' === $editorial_status ) {
				$wheres[] = "((meta_editorial_status.meta_value = 'writing') OR (meta_editorial_status.meta_value IS NULL AND {$table}.post_status = 'draft'))";
			} elseif ( 'review' === $editorial_status ) {
				$wheres[] = "((meta_editorial_status.meta_value = 'review') OR (meta_editorial_status.meta_value IS NULL AND {$table}.post_status = 'pending'))";
			} elseif ( 'ready' === $editorial_status ) {
				$wheres[] = "((meta_editorial_status.meta_value = 'ready') OR (meta_editorial_status.meta_value IS NULL AND {$table}.post_status IN ('future', 'publish')))";
			} elseif ( 'idea' === $editorial_status ) {
				$wheres[] = "(meta_editorial_status.meta_value = 'idea')";
			}
		}

		// Assigned To filter with fallbacks
		$assigned_to = isset( $filters['assigned_to'] ) ? (int) $filters['assigned_to'] : 0;
		if ( 0 !== $assigned_to ) {
			$joins['meta_assigned_to'] = "LEFT JOIN {$wpdb->postmeta} AS meta_assigned_to ON ({$table}.ID = meta_assigned_to.post_id AND meta_assigned_to.meta_key = '_veridis_assigned_to')";
			if ( -1 === $assigned_to ) {
				$wheres[] = "(meta_assigned_to.meta_value = '0')";
			} else {
				$uid = absint( $assigned_to );
				$wheres[] = "((meta_assigned_to.meta_value = '{$uid}') OR (meta_assigned_to.meta_value IS NULL AND {$table}.post_author = {$uid}))";
			}
		}

		// Priority filter with fallback
		$priority = $filters['priority'] ?? 'all';
		if ( 'all' !== $priority ) {
			$joins['meta_priority'] = "LEFT JOIN {$wpdb->postmeta} AS meta_priority ON ({$table}.ID = meta_priority.post_id AND meta_priority.meta_key = '_veridis_priority')";
			if ( 'normal' === $priority ) {
				$wheres[] = "((meta_priority.meta_value = 'normal') OR (meta_priority.meta_value IS NULL))";
			} else {
				$safe_prio = esc_sql( $priority );
				$wheres[]  = "(meta_priority.meta_value = '{$safe_prio}')";
			}
		}

		// Deadline state filter
		$deadline_state = $filters['deadline_state'] ?? 'all';
		if ( 'all' !== $deadline_state ) {
			$joins['meta_deadline'] = "LEFT JOIN {$wpdb->postmeta} AS meta_deadline ON ({$table}.ID = meta_deadline.post_id AND meta_deadline.meta_key = '_veridis_deadline')";
			if ( 'overdue' === $deadline_state ) {
				$now_utc  = gmdate( 'Y-m-d H:i:s' );
				$wheres[] = "(meta_deadline.meta_value IS NOT NULL AND meta_deadline.meta_value != '' AND meta_deadline.meta_value < '{$now_utc}' AND {$table}.post_status != 'publish')";
			} elseif ( 'due_today' === $deadline_state ) {
				$now_utc     = gmdate( 'Y-m-d H:i:s' );
				$today_end   = current_datetime()->setTime( 23, 59, 59 )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
				$wheres[]    = "(meta_deadline.meta_value >= '{$now_utc}' AND meta_deadline.meta_value <= '{$today_end}')";
			} elseif ( 'no_deadline' === $deadline_state ) {
				$wheres[] = "(meta_deadline.meta_value IS NULL OR meta_deadline.meta_value = '')";
			}
		}

		return array( 'joins' => $joins, 'wheres' => $wheres );
	}

	/** @return array{authors:array<int,array{id:int,name:string}>,assignees:array<int,array{id:int,name:string}>,categories:array<int,array{id:int,name:string}>} */
	public function options(): array {
		global $wpdb;
		$author_ids = array_map( 'intval', $wpdb->get_col( "SELECT DISTINCT post_author FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status IN ('draft','pending','future','publish') AND " . Access::readable_post_sql( $wpdb->posts ) . " ORDER BY post_author LIMIT 200" ) );
		$current_id = get_current_user_id();
		if ( $current_id && current_user_can( 'edit_posts' ) ) {
			$author_ids[] = $current_id;
		}
		$author_ids = array_values( array_unique( $author_ids ) );
		cache_users( $author_ids );
		$authors = array();
		foreach ( $author_ids as $id ) {
			$user = get_userdata( $id );
			if ( $user && user_can( $user, 'edit_posts' ) ) {
				$authors[] = array( 'id' => $id, 'name' => $user->display_name );
			}
		}
		usort( $authors, static function ( $a, $b ) { return strcasecmp( $a['name'], $b['name'] ); } );
		$assignee_ids = array_map( 'intval', get_users( array( 'capability' => 'edit_posts', 'fields' => 'ID' ) ) );
		cache_users( $assignee_ids );
		$assignees = array();
		foreach ( $assignee_ids as $id ) {
			$user = get_userdata( $id );
			if ( $user && user_can( $user, 'edit_posts' ) ) {
				$assignees[] = array( 'id' => $id, 'name' => $user->display_name );
			}
		}
		usort( $assignees, static function ( $a, $b ) { return strcasecmp( $a['name'], $b['name'] ); } );
		$terms = get_categories( array( 'hide_empty' => false, 'number' => 200, 'orderby' => 'name', 'order' => 'ASC' ) );
		$categories = array_map( static function ( $term ) { return array( 'id' => (int) $term->term_id, 'name' => $term->name ); }, $terms );
		return array( 'authors' => $authors, 'assignees' => $assignees, 'categories' => $categories );
	}

	/** @return array<int,object> */
	private function selected_rows( array $ids ): array {
		global $wpdb;
		if ( ! $ids ) {
			return array();
		}
		$id_list = implode( ',', $ids );
		return $wpdb->get_results( "SELECT ID, post_title, post_author, post_status, post_modified, post_date, post_excerpt FROM {$wpdb->posts} WHERE ID IN ({$id_list}) ORDER BY FIELD(ID, {$id_list})" );
	}

	/** @param array<int,object> $rows */
	public function prime_related_caches( array $rows ): void {
		$ids = array_map( 'intval', wp_list_pluck( $rows, 'ID' ) );
		$authors = array_unique( array_map( 'intval', wp_list_pluck( $rows, 'post_author' ) ) );
		if ( $ids ) {
			update_meta_cache( 'post', $ids );
			update_object_term_cache( $ids, 'post' );
			// Collect assigned users from primed post meta
			foreach ( $ids as $post_id ) {
				$assigned = get_post_meta( $post_id, '_veridis_assigned_to', true );
				if ( $assigned && (int) $assigned > 0 ) {
					$authors[] = (int) $assigned;
				}
			}
		}
		if ( $authors ) {
			cache_users( array_values( array_unique( $authors ) ) );
		}
	}
}
