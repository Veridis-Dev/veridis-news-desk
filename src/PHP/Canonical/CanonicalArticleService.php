<?php
namespace Veridis\NewsDesk\Canonical;

defined( 'ABSPATH' ) || exit;

/**
 * Domain service providing access to canonical Veridis articles.
 */
final class CanonicalArticleService {
	/**
	 * Retrieve a canonical Article by its post ID or WP_Post object.
	 *
	 * @param int|\WP_Post $post
	 * @return Article|null
	 */
	public function get_by_id( $post ): ?Article {
		if ( is_int( $post ) || ( is_string( $post ) && ctype_digit( $post ) ) ) {
			$post = get_post( (int) $post );
		}

		if ( ! ( $post instanceof \WP_Post ) || 'post' !== $post->post_type ) {
			return null;
		}

		return ArticleMapper::map( $post );
	}

	/**
	 * Retrieve a canonical Article by its stable UUID.
	 *
	 * @param string $uuid
	 * @return Article|null
	 */
	public function get_by_uuid( string $uuid ): ?Article {
		$post_id = ArticleIdentity::find_post_id_by_uuid( $uuid );
		if ( ! $post_id ) {
			return null;
		}

		return $this->get_by_id( $post_id );
	}

	/**
	 * Retrieve or lazily create the stable UUID for a post.
	 *
	 * @param int|\WP_Post $post
	 * @return string|null
	 */
	public function get_uuid( $post ): ?string {
		if ( is_int( $post ) || ( is_string( $post ) && ctype_digit( $post ) ) ) {
			$post_id = (int) $post;
		} elseif ( $post instanceof \WP_Post ) {
			$post_id = (int) $post->ID;
		} else {
			return null;
		}

		return ArticleIdentity::get_or_create( $post_id );
	}
}
