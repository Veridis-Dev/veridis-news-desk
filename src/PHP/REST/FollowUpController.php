<?php
namespace Veridis\NewsDesk\REST;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\FollowUps\FollowUpRepository;
use Veridis\NewsDesk\FollowUps\FollowUpService;
use Veridis\NewsDesk\Newsroom\WordPressStatus;

final class FollowUpController {
	private $service;
	private $repository;

	public function __construct( ?FollowUpService $service = null, ?FollowUpRepository $repository = null ) {
		$this->repository = $repository ?: new FollowUpRepository();
		$this->service    = $service ?: new FollowUpService( $this->repository );
	}

	public function register(): void {
		register_rest_route(
			'veridis-news/v1',
			'/follow-ups',
			array(
				'methods'             => 'GET',
				'permission_callback' => array( Access::class, 'allowed' ),
				'args'                => array(
					'status'      => array(
						'type'              => 'string',
						'default'           => 'open',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'due'         => array(
						'type'              => 'string',
						'default'           => 'all',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'assigned_to' => array(
						'type'              => 'integer',
						'minimum'           => -1,
					),
					'search'      => array(
						'type'              => 'string',
						'default'           => '',
						'maxLength'         => 200,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'page'        => array(
						'type'              => 'integer',
						'default'           => 1,
						'minimum'           => 1,
						'sanitize_callback' => 'absint',
					),
					'per_page'    => array(
						'type'              => 'integer',
						'default'           => 25,
						'minimum'           => 1,
						'maximum'           => 100,
						'sanitize_callback' => 'absint',
					),
				),
				'callback'            => array( $this, 'listing' ),
			)
		);

		register_rest_route(
			'veridis-news/v1',
			'/articles/(?P<id>\d+)/follow-ups',
			array(
				array(
					'methods'             => 'GET',
					'permission_callback' => array( $this, 'can_read_article' ),
					'callback'            => array( $this, 'article_follow_ups' ),
				),
				array(
					'methods'             => 'POST',
					'permission_callback' => array( $this, 'can_edit_article' ),
					'callback'            => array( $this, 'create' ),
				),
			)
		);

		register_rest_route(
			'veridis-news/v1',
			'/follow-ups/(?P<id>\d+)',
			array(
				'methods'             => 'PATCH',
				'permission_callback' => array( $this, 'can_edit_follow_up' ),
				'callback'            => array( $this, 'update' ),
			)
		);
	}

	public function can_read_article( \WP_REST_Request $request ) {
		if ( ! Access::allowed() ) {
			return false;
		}
		$post = get_post( (int) $request['id'] );
		if ( ! $post || 'post' !== $post->post_type || ! in_array( $post->post_status, WordPressStatus::ALLOWED, true ) ) {
			return new \WP_Error( 'veridis_news_article_not_found', __( 'The article could not be found.', 'veridis-news-desk' ), array( 'status' => 404 ) );
		}
		if ( ! Access::can_read_post( (int) $request['id'] ) ) {
			return new \WP_Error( 'veridis_news_article_forbidden', __( 'You do not have permission to view this article.', 'veridis-news-desk' ), array( 'status' => 403 ) );
		}
		return true;
	}

	public function can_edit_article( \WP_REST_Request $request ): bool {
		if ( ! Access::allowed() ) {
			return false;
		}
		$post_id = (int) $request['id'];
		return current_user_can( 'edit_post', $post_id );
	}

	public function can_edit_follow_up( \WP_REST_Request $request ): bool {
		if ( ! Access::allowed() ) {
			return false;
		}
		$follow_up = $this->repository->get( (int) $request['id'] );
		if ( ! $follow_up ) {
			return true; // Let the callback return 404
		}
		return current_user_can( 'edit_post', $follow_up->post_id );
	}

	public function listing( \WP_REST_Request $request ) {
		$filters = array(
			'status'   => $request->get_param( 'status' ) ?: 'open',
			'due'      => $request->get_param( 'due' ) ?: 'all',
			'search'   => $request->get_param( 'search' ) ?: '',
			'page'     => (int) ( $request->get_param( 'page' ) ?: 1 ),
			'per_page' => (int) ( $request->get_param( 'per_page' ) ?: 25 ),
		);

		if ( null !== $request->get_param( 'assigned_to' ) ) {
			$filters['assigned_to'] = (int) $request->get_param( 'assigned_to' );
		}

		$data = $this->service->listing( $filters );
		return $this->response( $data );
	}

	public function article_follow_ups( \WP_REST_Request $request ) {
		$post_id = (int) $request['id'];
		$items   = $this->service->get_for_article( $post_id );
		return $this->response( array( 'items' => $items ) );
	}

	public function create( \WP_REST_Request $request ) {
		$post_id = (int) $request['id'];
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new \WP_Error( 'veridis_invalid_json', __( 'Expected a JSON object.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}

		$result = $this->service->create( $post_id, $payload );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return $this->response( $result, 201 );
	}

	public function update( \WP_REST_Request $request ) {
		$id      = (int) $request['id'];
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new \WP_Error( 'veridis_invalid_json', __( 'Expected a JSON object.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}

		$result = $this->service->update( $id, $payload );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return $this->response( $result );
	}

	private function response( $data, int $status = 200 ) {
		if ( is_wp_error( $data ) ) {
			return $data;
		}
		$response = new \WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
