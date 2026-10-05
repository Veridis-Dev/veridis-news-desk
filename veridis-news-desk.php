<?php
/**
 * Plugin Name: Veridis News Desk
 * Plugin URI: https://veridis.dev/products/news-desk/
 * Description: A newsroom and editorial workflow for managing stories, assignments, deadlines, sources, follow-ups, and publishing readiness in WordPress.
 * Version: 1.0.2
 * Author: Veridis
 * Author URI: https://veridis.dev/
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Text Domain: veridis-news-desk
 * Domain Path: /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'VERIDIS_NEWS_DESK_VERSION', '1.0.2' );
define( 'VERIDIS_NEWS_DESK_PATH', plugin_dir_path( __FILE__ ) );
define( 'VERIDIS_NEWS_DESK_URL', plugin_dir_url( __FILE__ ) );

spl_autoload_register(
	static function ( $class ) {
		$prefix = 'Veridis\\NewsDesk\\';
		if ( 0 !== strpos( $class, $prefix ) ) {
			return;
		}
		$file = VERIDIS_NEWS_DESK_PATH . 'src/PHP/' . str_replace( '\\', '/', substr( $class, strlen( $prefix ) ) ) . '.php';
		if ( is_file( $file ) ) {
			require_once $file;
		}
	}
);
add_action( 'plugins_loaded', array( new \Veridis\NewsDesk\Core\Plugin(), 'boot' ) );
register_activation_hook( __FILE__, array( \Veridis\NewsDesk\FollowUps\FollowUpInstaller::class, 'install' ) );
