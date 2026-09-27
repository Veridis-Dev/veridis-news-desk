<?php
namespace Veridis\NewsDesk\REST;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\FollowUps\FollowUpInstaller;
use Veridis\NewsDesk\Settings\SettingsRepository;

final class SettingsController {
	public function register(): void {
		register_rest_route(
			'veridis-news/v1',
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'permission_callback' => array( Access::class, 'allowed' ),
					'callback'            => array( $this, 'get' ),
				),
				array(
					'methods'             => 'PATCH',
					'permission_callback' => array( $this, 'can_manage_settings' ),
					'callback'            => array( $this, 'update' ),
				),
			)
		);
	}

	public function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	public function get(): \WP_REST_Response {
		$settings = SettingsRepository::get();
		return $this->response( $this->build_payload( $settings ) );
	}

	/**
	 * Handle partial settings update.
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update( \WP_REST_Request $request ) {
		$input = $request->get_json_params();
		if ( ! is_array( $input ) ) {
			$input = $request->get_params();
		}

		if ( ! is_array( $input ) ) {
			return new \WP_Error(
				'invalid_input',
				__( 'Expected a JSON object.', 'veridis-news-desk' ),
				array( 'status' => 400 )
			);
		}

		$updated = SettingsRepository::update( $input );
		return $this->response( $this->build_payload( $updated ) );
	}

	private function build_payload( array $settings ): array {
		$schema_version = get_option( FollowUpInstaller::OPTION_VERSION, null );

		return array(
			'settings'          => SettingsRepository::format_dto( $settings ),
			'canManageSettings' => current_user_can( 'manage_options' ),
			'system'            => array(
				'pluginVersion'         => VERIDIS_NEWS_DESK_VERSION,
				'wordpressVersion'      => (string) get_bloginfo( 'version' ),
				'phpVersion'            => PHP_VERSION,
				'databaseSchemaVersion' => null !== $schema_version ? (string) $schema_version : null,
				'canonicalModelVersion' => '0.1',
			),
		);
	}

	private function response( array $data ): \WP_REST_Response {
		$response = new \WP_REST_Response( $data );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
