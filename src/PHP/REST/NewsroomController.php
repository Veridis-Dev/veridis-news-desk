<?php
namespace Veridis\NewsDesk\REST;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Newsroom\NewsroomService;

final class NewsroomController {
	public function register(): void {
		register_rest_route( 'veridis-news/v1', '/newsroom', array(
			'methods'             => \WP_REST_Server::READABLE,
			'permission_callback' => array( Access::class, 'allowed' ),
			'callback'            => array( $this, 'get' ),
			'args'                => $this->args(),
		) );

		register_rest_route( 'veridis-news/v1', '/newsroom/options', array(
			'methods'             => \WP_REST_Server::READABLE,
			'permission_callback' => array( Access::class, 'allowed' ),
			'callback'            => array( $this, 'options' ),
		) );

		register_rest_route( 'veridis-news/v1', '/newsroom/board', array(
			'methods'             => \WP_REST_Server::READABLE,
			'permission_callback' => array( Access::class, 'allowed' ),
			'callback'            => array( $this, 'board' ),
			'args'                => $this->board_args(),
		) );
	}

	public function get( \WP_REST_Request $request ): \WP_REST_Response {
		$response = new \WP_REST_Response( ( new NewsroomService() )->get( $request->get_params() ) );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}

	public function board( \WP_REST_Request $request ): \WP_REST_Response {
		$response = new \WP_REST_Response( ( new NewsroomService() )->board( $request->get_params() ) );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}

	public function options( \WP_REST_Request $request ): \WP_REST_Response {
		$response = new \WP_REST_Response( ( new NewsroomService() )->options() );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}

	private function args(): array {
		return array(
			'search'           => array( 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'status'           => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'active', 'draft', 'pending', 'future', 'publish' ) ),
			'editorial_status' => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'idea', 'writing', 'review', 'ready' ) ),
			'assigned_to'      => array( 'type' => 'string', 'default' => '0' ),
			'priority'         => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'urgent', 'high', 'normal', 'low' ) ),
			'deadline_state'   => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'overdue', 'due_today', 'no_deadline' ) ),
			'author'           => array( 'type' => 'integer', 'default' => 0, 'minimum' => 0, 'sanitize_callback' => 'absint' ),
			'category'         => array( 'type' => 'integer', 'default' => 0, 'minimum' => 0, 'sanitize_callback' => 'absint' ),
			'health'           => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'has_issues', 'complete', 'missing_featured_image', 'missing_excerpt', 'missing_source', 'missing_photo_credit' ) ),
			'sort'             => array( 'type' => 'string', 'default' => 'recent', 'enum' => array( 'recent', 'oldest', 'date_desc', 'date_asc', 'title_asc', 'deadline_soonest', 'priority' ) ),
			'period'           => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'today' ) ),
			'page'             => array( 'type' => 'integer', 'default' => 1, 'minimum' => 1, 'sanitize_callback' => 'absint' ),
			'per_page'         => array( 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100, 'sanitize_callback' => 'absint' ),
		);
	}

	private function board_args(): array {
		return array(
			'search'         => array( 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'status'         => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'active', 'draft', 'pending', 'future', 'publish' ) ),
			'assigned_to'    => array( 'type' => 'string', 'default' => '0' ),
			'priority'       => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'urgent', 'high', 'normal', 'low' ) ),
			'deadline_state' => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'overdue', 'due_today', 'no_deadline' ) ),
			'author'         => array( 'type' => 'integer', 'default' => 0, 'minimum' => 0, 'sanitize_callback' => 'absint' ),
			'category'       => array( 'type' => 'integer', 'default' => 0, 'minimum' => 0, 'sanitize_callback' => 'absint' ),
			'health'         => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'has_issues', 'complete', 'missing_featured_image', 'missing_excerpt', 'missing_source', 'missing_photo_credit' ) ),
			'period'         => array( 'type' => 'string', 'default' => 'all', 'enum' => array( 'all', 'today' ) ),
		);
	}
}
