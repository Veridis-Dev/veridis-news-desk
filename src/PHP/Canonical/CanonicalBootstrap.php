<?php
namespace Veridis\NewsDesk\Canonical;

defined( 'ABSPATH' ) || exit;

/**
 * Bootstraps the canonical content layer and post meta registrations.
 */
final class CanonicalBootstrap {
	public function register(): void {
		add_action( 'init', array( $this, 'register_meta' ) );
	}

	public function register_meta(): void {
		register_post_meta(
			'post',
			ArticleIdentity::META_KEY,
			array(
				'type'              => 'string',
				'description'       => __( 'Canonical Veridis UUID for the article.', 'veridis-news-desk' ),
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => array( ArticleIdentity::class, 'sanitize_uuid' ),
				'auth_callback'     => static function ( $allowed, $meta_key, $post_id ) {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);
	}
}
