<?php
namespace Veridis\NewsDesk\REST;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Dashboard\DashboardService;

final class DashboardController {
	public function register(): void {
		register_rest_route( 'veridis-news/v1', '/dashboard', array(
			'methods'             => \WP_REST_Server::READABLE,
			'permission_callback' => array( Access::class, 'allowed' ),
			'callback'            => array( $this, 'get' ),
		) );
	}

	public function get(): \WP_REST_Response {
		$response = new \WP_REST_Response( ( new DashboardService() )->get() );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
