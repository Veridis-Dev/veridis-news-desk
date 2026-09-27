<?php
/**
 * Public integration API for Veridis News Canonical Content Model.
 */

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Canonical\Article;
use Veridis\NewsDesk\Canonical\CanonicalArticleService;

if ( ! function_exists( 'veridis_news_get_article' ) ) {
	/**
	 * Retrieve the canonical Veridis Article by WordPress post ID or WP_Post.
	 *
	 * @param int|\WP_Post $post
	 * @return Article|null
	 */
	function veridis_news_get_article( $post ): ?Article {
		return ( new CanonicalArticleService() )->get_by_id( $post );
	}
}

if ( ! function_exists( 'veridis_news_get_article_by_uuid' ) ) {
	/**
	 * Retrieve the canonical Veridis Article by its stable UUID.
	 *
	 * @param string $uuid
	 * @return Article|null
	 */
	function veridis_news_get_article_by_uuid( string $uuid ): ?Article {
		return ( new CanonicalArticleService() )->get_by_uuid( $uuid );
	}
}

if ( ! function_exists( 'veridis_news_get_article_uuid' ) ) {
	/**
	 * Retrieve or lazily generate the stable Article UUID for a post.
	 *
	 * @param int|\WP_Post $post
	 * @return string|null
	 */
	function veridis_news_get_article_uuid( $post ): ?string {
		return ( new CanonicalArticleService() )->get_uuid( $post );
	}
}
