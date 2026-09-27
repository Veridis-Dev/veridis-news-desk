<?php
namespace Veridis\NewsDesk\Admin;

defined( 'ABSPATH' ) || exit;

final class Assets {
	private $page;

	public function __construct( AdminPage $page ) {
		$this->page = $page;
	}

	public function enqueue( string $hook ): void {
		if ( $hook !== $this->page->hook() ) {
			return;
		}
		$current_domain = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
		$utm_link       = 'https://veridis.dev/?utm_source=' . rawurlencode( $current_domain ) . '&utm_medium=plugin_footer&utm_campaign=news_desk';

		$config = array(
			'restUrl' => esc_url_raw( rest_url( 'veridis-news/v1/' ) ),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
			'version' => VERIDIS_NEWS_DESK_VERSION,
			'utmLink' => esc_url( $utm_link ),
		);
		// Opt-in only. Production never contacts the development server.
		$dev = defined( 'VERIDIS_NEWS_DESK_DEV_SERVER' ) && in_array( wp_get_environment_type(), array( 'local', 'development' ), true )
			? untrailingslashit( esc_url_raw( VERIDIS_NEWS_DESK_DEV_SERVER ) ) : '';
		if ( $dev ) {
			wp_enqueue_script( 'veridis-news-desk-vite', $dev . '/@vite/client', array(), null, true );
			wp_enqueue_script( 'veridis-news-desk-app', $dev . '/src/AdminApp/main.tsx', array( 'wp-i18n', 'veridis-news-desk-vite' ), null, true );
			add_action( 'admin_head', static function () use ( $dev ) {
				$preamble = 'import RefreshRuntime from ' . wp_json_encode( $dev . '/@react-refresh' ) . '; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;';
				wp_print_inline_script_tag( $preamble, array( 'type' => 'module' ) );
			} );
		} else {
			$path = VERIDIS_NEWS_DESK_PATH . 'build/manifest.json';
			$manifest = is_readable( $path ) ? json_decode( file_get_contents( $path ), true ) : array();
			$entry = $manifest['src/AdminApp/main.tsx'] ?? null;
			if ( empty( $entry['file'] ) || ! is_file( VERIDIS_NEWS_DESK_PATH . 'build/' . $entry['file'] ) ) {
				add_action( 'admin_notices', static function () {
					echo '<div class="notice notice-error"><p>' . esc_html__( 'News Desk assets are missing. Run npm install and npm run build in the plugin directory.', 'veridis-news-desk' ) . '</p></div>';
				} );
				return;
			}
			// The current single-entry build bundles its imported styles here.
			foreach ( $entry['css'] ?? array() as $index => $css ) {
				wp_enqueue_style( 'veridis-news-desk-' . $index, VERIDIS_NEWS_DESK_URL . 'build/' . $css, array(), VERIDIS_NEWS_DESK_VERSION );
			}
			wp_enqueue_script( 'veridis-news-desk-app', VERIDIS_NEWS_DESK_URL . 'build/' . $entry['file'], array( 'wp-i18n' ), VERIDIS_NEWS_DESK_VERSION, true );
		}
		wp_set_script_translations( 'veridis-news-desk-app', 'veridis-news-desk', VERIDIS_NEWS_DESK_PATH . 'languages' );
		wp_add_inline_script( 'veridis-news-desk-app', 'window.veridisNewsDesk = ' . wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';', 'before' );
		add_filter( 'script_loader_tag', array( $this, 'module_tag' ), 10, 3 );
	}

	public function module_tag( string $tag, string $handle, string $src ): string {
		if ( in_array( $handle, array( 'veridis-news-desk-app', 'veridis-news-desk-vite' ), true ) ) {
			$pattern = '/<script(?![^>]*\\btype=)(?=[^>]*\\bid="' . preg_quote( $handle . '-js', '/' ) . '")/';
			$module_tag = preg_replace( $pattern, '<script type="module"', $tag, 1 );
			return is_string( $module_tag ) ? $module_tag : $tag;
		}
		return $tag;
	}
}
