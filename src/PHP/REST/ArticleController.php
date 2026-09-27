<?php
namespace Veridis\NewsDesk\REST;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Articles\ArticleService;
use Veridis\NewsDesk\Core\Access;

final class ArticleController {
	public function register(): void {
		register_rest_route( 'veridis-news/v1', '/articles/(?P<id>\d+)', array(
			'methods'             => \WP_REST_Server::READABLE,
			'permission_callback' => array( Access::class, 'allowed' ),
			'callback'            => array( $this, 'get' ),
			'args'                => array( 'id' => array( 'type' => 'integer', 'minimum' => 1, 'sanitize_callback' => 'absint' ) ),
		) );
		register_rest_route( 'veridis-news/v1', '/articles/(?P<id>\d+)/editorial', array(
			'methods'             => \WP_REST_Server::EDITABLE,
			'permission_callback' => array( $this, 'can_edit_article' ),
			'callback'            => array( $this, 'update_editorial' ),
			'args'                => array(
				'id' => array( 'type' => 'integer', 'minimum' => 1, 'sanitize_callback' => 'absint' ),
			),
		) );
		register_rest_route( 'veridis-news/v1', '/articles/(?P<id>\d+)/content', array(
			'methods'             => 'PATCH',
			'permission_callback' => array( $this, 'can_edit_article' ),
			'callback'            => array( $this, 'update_content' ),
			'args'                => array(
				'id'          => array( 'type' => 'integer', 'minimum' => 1, 'sanitize_callback' => 'absint' ),
				'excerpt'     => array( 'type' => 'string', 'required' => false ),
				'photoCredit' => array( 'type' => 'string', 'required' => false ),
			),
		) );
		register_rest_route( 'veridis-news/v1', '/articles', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'permission_callback' => array( $this, 'can_create_article' ),
			'callback'            => array( $this, 'create' ),
			'args'                => array(
				'title'           => array( 'type' => 'string', 'required' => true, 'minLength' => 1, 'sanitize_callback' => 'sanitize_text_field' ),
				'author'          => array( 'type' => 'integer', 'required' => false, 'minimum' => 1, 'sanitize_callback' => 'absint' ),
				'category'        => array( 'type' => 'integer', 'required' => true, 'minimum' => 1, 'sanitize_callback' => 'absint' ),
				'editorialStatus' => array( 'type' => 'string', 'required' => false ),
				'assignedTo'      => array( 'type' => 'integer', 'required' => false ),
				'priority'        => array( 'type' => 'string', 'required' => false ),
				'deadline'        => array( 'type' => 'string', 'required' => false ),
			),
		) );
	}

	public function can_create_article(): bool {
		$post_type = get_post_type_object( 'post' );
		return Access::allowed() && $post_type && current_user_can( $post_type->cap->create_posts );
	}

	public function can_edit_article( \WP_REST_Request $request ): bool {
		if ( ! Access::allowed() ) {
			return false;
		}
		$id = (int) $request['id'];
		return current_user_can( 'edit_post', $id );
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function get( \WP_REST_Request $request ) {
		$result = ( new ArticleService() )->get( (int) $request['id'] );
		return is_wp_error( $result ) ? $result : $this->response( $result );
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function update_editorial( \WP_REST_Request $request ) {
		$id      = (int) $request['id'];
		$service = new ArticleService();
		$update  = $service->get_editorial_service()->update( $id, $request->get_json_params() ?: $request->get_params() );
		if ( is_wp_error( $update ) ) {
			return $update;
		}
		$result = $service->get( $id );
		return is_wp_error( $result ) ? $result : $this->response( $result );
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function update_content( \WP_REST_Request $request ) {
		$id              = (int) $request['id'];
		$content_service = new \Veridis\NewsDesk\Articles\ArticleContentService();
		$update          = $content_service->update( $id, $request->get_json_params() ?: $request->get_params() );
		if ( is_wp_error( $update ) ) {
			return $update;
		}
		$service = new ArticleService();
		$result  = $service->get( $id );
		return is_wp_error( $result ) ? $result : $this->response( $result );
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function create( \WP_REST_Request $request ) {
		$result = ( new ArticleService() )->create( $request->get_json_params() ?: $request->get_params() );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$response = $this->response( $result, 201 );
		$response->header( 'Location', rest_url( 'veridis-news/v1/articles/' . $result['id'] ) );
		return $response;
	}

	private function response( array $data, int $status = 200 ): \WP_REST_Response {
		$response = new \WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
