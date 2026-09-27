<?php
namespace Veridis\NewsDesk\Admin;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Editorial\EditorialMetadataRepository;
use Veridis\NewsDesk\Editorial\EditorialStatus;

final class EditorMode {
	/** @var int|null */
	private $active_post_id = null;

	public function register(): void {
		add_action( 'admin_init', array( $this, 'maybe_activate' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_tab_session_fallback' ) );
	}

	public function maybe_activate(): void {
		if ( ! is_admin() ) {
			return;
		}

		// Activate ONLY when query param vnd_mode=editor is explicitly requested
		if ( ! isset( $_GET['vnd_mode'] ) || 'editor' !== $_GET['vnd_mode'] ) {
			return;
		}

		global $pagenow;
		if ( 'post.php' !== $pagenow ) {
			return;
		}

		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : ( isset( $_REQUEST['post'] ) ? absint( $_REQUEST['post'] ) : 0 );
		if ( ! $post_id ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post || 'post' !== $post->post_type ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) || ! Access::allowed() ) {
			return;
		}

		if ( ! $this->is_story_eligible( $post ) ) {
			$newsroom_url = admin_url( 'admin.php?page=veridis-news-desk&vnd_view=newsroom&article=' . $post_id );
			wp_die(
				esc_html__( 'Assign this story before editing its content.', 'veridis-news-desk' ) . ' <a href="' . esc_url( $newsroom_url ) . '">' . esc_html__( 'Back to Newsroom', 'veridis-news-desk' ) . '</a>',
				esc_html__( 'Story needs an assignee', 'veridis-news-desk' ),
				array( 'response' => 403 )
			);
		}

		$this->active_post_id = $post_id;

		add_filter( 'admin_body_class', array( $this, 'filter_body_class' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_assets' ) );
		add_filter( 'script_loader_tag', array( $this, 'filter_module_tag' ), 10, 3 );
	}

	public function is_active(): bool {
		return null !== $this->active_post_id;
	}

	public function get_active_post_id(): ?int {
		return $this->active_post_id;
	}

	public function is_story_eligible( \WP_Post $post ): bool {
		$metadata = ( new EditorialMetadataRepository() )->get( $post->ID, $post );
		return ! ( EditorialStatus::IDEA === $metadata['editorial_status'] && $metadata['is_unassigned'] );
	}

	public function filter_body_class( string $classes ): string {
		return $classes . ' vnd-editor-mode';
	}

	public function enqueue_tab_session_fallback( string $hook_suffix = '' ): void {
		if ( 'post.php' !== $hook_suffix && ( ! isset( $GLOBALS['pagenow'] ) || 'post.php' !== $GLOBALS['pagenow'] ) ) {
			return;
		}

		if ( $this->is_active() ) {
			return;
		}

		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
		$post = $post_id ? get_post( $post_id ) : null;
		if ( ! $post || 'post' !== $post->post_type || ! Access::allowed() || ! current_user_can( 'edit_post', $post_id ) || ! $this->is_story_eligible( $post ) ) {
			return;
		}

		// Non-blocking tab-scoped reload recovery: ONLY recovers on explicit browser reload
		$script = sprintf(
			'(function() {
	try {
		var postId = %d;
		var storageKey = "vnd_editor_active_" + postId;
		var raw = sessionStorage.getItem(storageKey);
		if (!raw) return;

		var isReload = false;
		if (window.performance) {
			var navEntries = performance.getEntriesByType("navigation");
			if (navEntries && navEntries.length > 0 && navEntries[0].type) {
				isReload = navEntries[0].type === "reload";
			} else if (performance.navigation) {
				isReload = performance.navigation.type === 1;
			}
		}

		if (!isReload) {
			sessionStorage.removeItem(storageKey);
			sessionStorage.removeItem("vnd_editor_return");
			return;
		}

		var data = JSON.parse(raw);
		if (data && data.active) {
			var url = new URL(window.location.href);
			if (url.searchParams.get("vnd_mode") !== "editor") {
				url.searchParams.set("vnd_mode", "editor");
				if (data.returnUrl && !url.searchParams.has("vnd_return")) {
					url.searchParams.set("vnd_return", data.returnUrl);
				}
				window.location.replace(url.toString());
			}
		}
	} catch (e) {}
})();',
			(int) $post_id
		);

		wp_register_script( 'veridis-editor-mode-fallback', false, array(), VERIDIS_NEWS_DESK_VERSION, false );
		wp_enqueue_script( 'veridis-editor-mode-fallback' );
		wp_add_inline_script( 'veridis-editor-mode-fallback', $script );
	}

	public function print_tab_session_fallback(): void {
		$this->enqueue_tab_session_fallback( 'post.php' );
	}

	public function enqueue_assets(): void {
		if ( ! $this->active_post_id ) {
			return;
		}

		$raw_return = isset( $_GET['vnd_return'] ) ? (string) wp_unslash( $_GET['vnd_return'] ) : '';
		$safe_return = self::validate_return_url( $raw_return );

		$config = array(
			'postId'           => $this->active_post_id,
			'restUrl'          => esc_url_raw( rest_url( 'veridis-news/v1/' ) ),
			'nonce'            => wp_create_nonce( 'wp_rest' ),
			'adminUrl'         => esc_url_raw( admin_url() ),
			'returnUrl'        => esc_url_raw( admin_url( $safe_return ) ),
			'version'          => VERIDIS_NEWS_DESK_VERSION,
			'canEditEditorial' => Access::allowed() && current_user_can( 'edit_post', $this->active_post_id ),
		);

		$dev = defined( 'VERIDIS_NEWS_DESK_DEV_SERVER' ) && in_array( wp_get_environment_type(), array( 'local', 'development' ), true )
			? untrailingslashit( esc_url_raw( VERIDIS_NEWS_DESK_DEV_SERVER ) ) : '';

		if ( $dev ) {
			wp_enqueue_script(
				'veridis-editor-mode',
				$dev . '/src/EditorApp/main.ts',
				array( 'wp-plugins', 'wp-editor', 'wp-components', 'wp-data', 'wp-element', 'wp-i18n', 'wp-api-fetch' ),
				null,
				true
			);
		} else {
			$manifest_path = VERIDIS_NEWS_DESK_PATH . 'build/manifest.json';
			$manifest = is_readable( $manifest_path ) ? json_decode( file_get_contents( $manifest_path ), true ) : array();
			$entry = $manifest['src/EditorApp/main.ts'] ?? null;

			if ( empty( $entry['file'] ) || ! is_file( VERIDIS_NEWS_DESK_PATH . 'build/' . $entry['file'] ) ) {
				return;
			}

			foreach ( $entry['css'] ?? array() as $idx => $css ) {
				wp_enqueue_style(
					'veridis-editor-mode-' . $idx,
					VERIDIS_NEWS_DESK_URL . 'build/' . $css,
					array(),
					VERIDIS_NEWS_DESK_VERSION
				);
			}

			wp_enqueue_script(
				'veridis-editor-mode',
				VERIDIS_NEWS_DESK_URL . 'build/' . $entry['file'],
				array( 'wp-plugins', 'wp-editor', 'wp-components', 'wp-data', 'wp-element', 'wp-i18n', 'wp-api-fetch' ),
				VERIDIS_NEWS_DESK_VERSION,
				true
			);
		}

		wp_set_script_translations( 'veridis-editor-mode', 'veridis-news-desk', VERIDIS_NEWS_DESK_PATH . 'languages' );
		wp_add_inline_script(
			'veridis-editor-mode',
			'window.veridisEditorMode = ' . wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';',
			'before'
		);
	}

	public function filter_module_tag( string $tag, string $handle, string $src ): string {
		if ( 'veridis-editor-mode' === $handle ) {
			$pattern = '/<script(?![^>]*\\btype=)(?=[^>]*\\bid="' . preg_quote( $handle . '-js', '/' ) . '")/';
			$module_tag = preg_replace( $pattern, '<script type="module"', $tag, 1 );
			return is_string( $module_tag ) ? $module_tag : $tag;
		}
		return $tag;
	}

	/**
	 * Validate and sanitize untrusted return URL.
	 *
	 * Accepts ONLY relative wp-admin targets for admin.php?page=veridis-news-desk.
	 * Rejects external URLs, protocol-relative URLs, and non-Veridis screens.
	 *
	 * @param string|null $url Untrusted input.
	 * @return string Safe relative destination.
	 */
	public static function validate_return_url( ?string $url ): string {
		$fallback = 'admin.php?page=veridis-news-desk&vnd_view=newsroom';
		if ( null === $url || '' === trim( $url ) ) {
			return $fallback;
		}

		$raw = trim( rawurldecode( $url ) );

		// Reject protocol-relative URLs (//evil.com) and any URL with a scheme (http://, javascript:, etc.)
		if ( preg_match( '#^([a-z0-9+.-]+:)?//#i', $raw ) || preg_match( '#^[a-z0-9+.-]+:#i', $raw ) ) {
			return $fallback;
		}

		// Strip leading /wp-admin/ or wp-admin/ if present
		$stripped = preg_replace( '#^/?(wp-admin/)?#i', '', $raw );

		$parsed = wp_parse_url( $stripped );
		if ( false === $parsed || empty( $parsed['path'] ) ) {
			return $fallback;
		}

		// Must point to admin.php
		if ( 'admin.php' !== $parsed['path'] ) {
			return $fallback;
		}

		if ( empty( $parsed['query'] ) ) {
			return $fallback;
		}

		parse_str( $parsed['query'], $query );

		// Must have page=veridis-news-desk
		if ( ( $query['page'] ?? '' ) !== 'veridis-news-desk' ) {
			return $fallback;
		}

		// Allow only known safe News Desk parameters
		$allowed_keys = array(
			'page',
			'vnd_view',
			'vnd_layout',
			'search',
			'status',
			'editorial_status',
			'assigned_to',
			'priority',
			'deadline_state',
			'author',
			'category',
			'health',
			'sort',
			'period',
			'vnd_page',
			'article',
		);

		$safe_query = array();
		foreach ( $allowed_keys as $key ) {
			if ( isset( $query[ $key ] ) && is_scalar( $query[ $key ] ) ) {
				$safe_query[ $key ] = sanitize_text_field( (string) $query[ $key ] );
			}
		}

		if ( ( $safe_query['page'] ?? '' ) !== 'veridis-news-desk' ) {
			return $fallback;
		}

		return 'admin.php?' . http_build_query( $safe_query );
	}
}
