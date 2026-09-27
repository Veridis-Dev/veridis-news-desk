<?php
namespace Veridis\NewsDesk\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Manages storage, retrieval, defaults, and sanitization for Veridis News Desk settings.
 */
final class SettingsRepository {
	public const OPTION_NAME = 'veridis_news_desk_settings';

	/**
	 * Default settings values.
	 *
	 * @return array
	 */
	public static function defaults(): array {
		return array(
			'preserve_data_on_uninstall' => true,
		);
	}

	/**
	 * Retrieve normalized settings from storage, safely merging with defaults.
	 *
	 * @return array
	 */
	public static function get(): array {
		$raw      = get_option( self::OPTION_NAME, array() );
		$defaults = self::defaults();

		if ( ! is_array( $raw ) ) {
			return $defaults;
		}

		$clean = array();
		foreach ( $defaults as $key => $default_val ) {
			if ( array_key_exists( $key, $raw ) ) {
				$clean[ $key ] = (bool) rest_sanitize_boolean( $raw[ $key ] );
			} else {
				$clean[ $key ] = $default_val;
			}
		}

		return $clean;
	}

	/**
	 * Update settings partially. Only supported keys are updated.
	 * Omitted keys retain their existing stored values.
	 *
	 * @param array $input
	 * @return array The updated settings.
	 */
	public static function update( array $input ): array {
		$current = self::get();

		// Map supported camelCase input keys to storage snake_case keys.
		$key_map = array(
			'preserveDataOnUninstall'    => 'preserve_data_on_uninstall',
			'preserve_data_on_uninstall' => 'preserve_data_on_uninstall',
		);

		foreach ( $key_map as $input_key => $storage_key ) {
			if ( array_key_exists( $input_key, $input ) ) {
				$current[ $storage_key ] = (bool) rest_sanitize_boolean( $input[ $input_key ] );
			}
		}

		update_option( self::OPTION_NAME, $current, false );

		return $current;
	}

	/**
	 * Format settings into the public DTO representation.
	 *
	 * @param array $settings
	 * @return array
	 */
	public static function format_dto( array $settings ): array {
		return array(
			'preserveDataOnUninstall' => (bool) ( $settings['preserve_data_on_uninstall'] ?? true ),
		);
	}
}
