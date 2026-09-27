<?php
namespace Veridis\NewsDesk\Newsroom;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Editorial\EditorialStatus;
use Veridis\NewsDesk\Editorial\Priority;

final class NewsroomService {
	private $repository;
	private $formatter;

	public function __construct( ?NewsroomRepository $repository = null, ?ArticleFormatter $formatter = null ) {
		$this->repository = $repository ?: new NewsroomRepository();
		$this->formatter  = $formatter ?: new ArticleFormatter();
	}

	public function get( array $input ): array {
		$status           = $input['status'] ?? 'all';
		$editorial_status = $input['editorial_status'] ?? $input['editorialStatus'] ?? 'all';
		$assigned_raw     = $input['assigned_to'] ?? $input['assignedTo'] ?? 0;
		$assigned_to      = ( -1 === (int) $assigned_raw || 'unassigned' === (string) $assigned_raw ) ? -1 : absint( $assigned_raw );
		$priority         = $input['priority'] ?? 'all';
		$deadline_state   = $input['deadline_state'] ?? $input['deadlineState'] ?? 'all';
		$health           = $input['health'] ?? 'all';
		$sort             = $input['sort'] ?? 'recent';

		$filters = array(
			'search'           => sanitize_text_field( (string) ( $input['search'] ?? '' ) ),
			'status'           => in_array( $status, array_merge( array( 'all', 'active' ), WordPressStatus::ALLOWED ), true ) ? $status : 'all',
			'editorial_status' => in_array( $editorial_status, array_merge( array( 'all' ), EditorialStatus::ALLOWED ), true ) ? $editorial_status : 'all',
			'assigned_to'      => $assigned_to,
			'priority'         => in_array( $priority, array_merge( array( 'all' ), Priority::ALLOWED ), true ) ? $priority : 'all',
			'deadline_state'   => in_array( $deadline_state, array( 'all', 'overdue', 'due_today', 'no_deadline' ), true ) ? $deadline_state : 'all',
			'author'           => absint( $input['author'] ?? 0 ),
			'category'         => absint( $input['category'] ?? 0 ),
			'health'           => in_array( $health, array( 'all', 'has_issues', 'complete', 'missing_featured_image', 'missing_excerpt', 'missing_source', 'missing_photo_credit' ), true ) ? $health : 'all',
			'sort'             => in_array( $sort, array( 'recent', 'oldest', 'date_desc', 'date_asc', 'title_asc', 'deadline_soonest', 'priority' ), true ) ? $sort : 'recent',
			'period'           => 'today' === ( $input['period'] ?? 'all' ) ? 'today' : 'all',
			'page'             => max( 1, absint( $input['page'] ?? 1 ) ),
			'per_page'         => min( 100, max( 1, absint( $input['per_page'] ?? 20 ) ) ),
		);
		$result = $this->repository->query( $filters );
		$post_ids = array_map( function( $row ) { return (int) $row->ID; }, $result['rows'] );
		$followup_repo = new \Veridis\NewsDesk\FollowUps\FollowUpRepository();
		$followup_counts = $followup_repo->counts_for_posts( $post_ids );

		$items = array();
		foreach ( $result['rows'] as $row ) {
			$items[] = $this->formatter->summary( $row, $followup_counts );
		}

		return array(
			'items'        => $items,
			'overallTotal' => $this->repository->count_all(),
			'pagination'   => array( 'page' => $filters['page'], 'perPage' => $filters['per_page'], 'totalItems' => $result['total'], 'totalPages' => $result['pages'] ),
			'filters'      => $filters,
		);
	}

	/** @return array{columns:array<string,array{items:array<int,array<string,mixed>>,total:int,limit:int}>,filters:array<string,mixed>} */
	public function board( array $input ): array {
		$status         = $input['status'] ?? 'all';
		$assigned_raw   = $input['assigned_to'] ?? $input['assignedTo'] ?? 0;
		$assigned_to    = ( -1 === (int) $assigned_raw || 'unassigned' === (string) $assigned_raw ) ? -1 : absint( $assigned_raw );
		$priority       = $input['priority'] ?? 'all';
		$deadline_state = $input['deadline_state'] ?? $input['deadlineState'] ?? 'all';
		$health         = $input['health'] ?? 'all';

		$filters = array(
			'search'         => sanitize_text_field( (string) ( $input['search'] ?? '' ) ),
			'status'         => in_array( $status, array_merge( array( 'all', 'active' ), WordPressStatus::ALLOWED ), true ) ? $status : 'all',
			'assigned_to'    => $assigned_to,
			'priority'       => in_array( $priority, array_merge( array( 'all' ), Priority::ALLOWED ), true ) ? $priority : 'all',
			'deadline_state' => in_array( $deadline_state, array( 'all', 'overdue', 'due_today', 'no_deadline' ), true ) ? $deadline_state : 'all',
			'author'         => absint( $input['author'] ?? 0 ),
			'category'       => absint( $input['category'] ?? 0 ),
			'health'         => in_array( $health, array( 'all', 'has_issues', 'complete', 'missing_featured_image', 'missing_excerpt', 'missing_source', 'missing_photo_credit' ), true ) ? $health : 'all',
			'period'         => 'today' === ( $input['period'] ?? 'all' ) ? 'today' : 'all',
		);

		$result     = $this->repository->board_query( $filters );
		$rows_by_id = array();
		foreach ( $result['rows'] as $row ) {
			$rows_by_id[ (int) $row->ID ] = $row;
		}

		$post_ids = array_keys( $rows_by_id );
		$followup_repo = new \Veridis\NewsDesk\FollowUps\FollowUpRepository();
		$followup_counts = $followup_repo->counts_for_posts( $post_ids );

		$columns = array();
		foreach ( $result['columns'] as $col_key => $col_data ) {
			$items = array();
			foreach ( $col_data['ids'] as $id ) {
				if ( isset( $rows_by_id[ $id ] ) ) {
					$items[] = $this->formatter->summary( $rows_by_id[ $id ], $followup_counts );
				}
			}
			$columns[ $col_key ] = array(
				'items' => $items,
				'total' => $col_data['total'],
				'limit' => $col_data['limit'],
			);
		}

		return array(
			'columns' => $columns,
			'filters' => $filters,
		);
	}

	/** @return array{authors:array<int,array{id:int,name:string}>,assignees:array<int,array{id:int,name:string}>,categories:array<int,array{id:int,name:string}>} */
	public function options(): array {
		return $this->repository->options();
	}
}
