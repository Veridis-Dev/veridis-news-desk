<?php
namespace Veridis\NewsDesk\REST;
defined( 'ABSPATH' ) || exit;
use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Breaking\BreakingService;
use Veridis\NewsDesk\Articles\ArticleService;
final class BreakingController {
	public function register(): void {
		register_rest_route( 'veridis-news/v1', '/breaking', array( 'methods' => 'GET', 'permission_callback' => array( Access::class, 'allowed' ), 'callback' => function () { return $this->response( ( new BreakingService() )->listing() ); } ) );
		register_rest_route( 'veridis-news/v1', '/breaking/search', array( 'methods' => 'GET', 'permission_callback' => array( Access::class, 'allowed' ), 'args' => array( 'search' => array( 'type' => 'string', 'default' => '', 'maxLength' => 200, 'sanitize_callback' => 'sanitize_text_field' ) ), 'callback' => function ( $request ) { return $this->response( ( new BreakingService() )->listing( 15, $request['search'] ) ); } ) );
		register_rest_route( 'veridis-news/v1', '/articles/(?P<id>\d+)/breaking', array( 'methods' => 'PATCH', 'permission_callback' => array( new ArticleController(), 'can_edit_article' ), 'callback' => array( $this, 'update' ) ) );
	}
	public function update( \WP_REST_Request $request ) {
		$input = $request->get_json_params();
		if ( ! is_array( $input ) ) return new \WP_Error( 'breaking_invalid', 'Expected a JSON object.', array( 'status' => 400 ) );
		$result = ( new BreakingService() )->update( (int) $request['id'], $input );
		if ( is_wp_error( $result ) ) return $result;
		return $this->response( ( new ArticleService() )->get( (int) $request['id'] ) );
	}
	private function response( $data ) {
		if ( is_wp_error( $data ) ) return $data;
		$response = new \WP_REST_Response( $data );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
