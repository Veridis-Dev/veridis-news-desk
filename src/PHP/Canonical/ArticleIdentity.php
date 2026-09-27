<?php
namespace Veridis\NewsDesk\Canonical;

defined( 'ABSPATH' ) || exit;

/**
 * Manages stable Article UUID lifecycle and reverse index resolution.
 */
final class ArticleIdentity {
	public const META_KEY = '_veridis_article_uuid';

	/**
	 * Check whether a string is a valid RFC 4122 UUID v4.
	 */
	public static function is_valid_uuid( string $uuid ): bool {
		return 1 === preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', trim( $uuid ) );
	}

	/**
	 * Meta sanitization callback.
	 *
	 * @param mixed $meta_value
	 * @return string
	 */
	public static function sanitize_uuid( $meta_value ): string {
		$uuid = is_string( $meta_value ) ? strtolower( trim( $meta_value ) ) : '';
		return self::is_valid_uuid( $uuid ) ? $uuid : '';
	}

	/**
	 * Retrieve existing UUID for a post if present.
	 */
	public static function get( int $post_id ): ?string {
		if ( $post_id <= 0 ) {
			return null;
		}
		$raw = (string) get_post_meta( $post_id, self::META_KEY, true );
		$uuid = strtolower( trim( $raw ) );
		return self::is_valid_uuid( $uuid ) ? $uuid : null;
	}

	/**
	 * Lazily retrieve or generate a permanent UUID for an article.
	 *
	 * Uses atomic add_post_meta($post_id, ..., true) to prevent concurrency races.
	 * Fires 'veridis_news_article_uuid_created' only when a new UUID is first created.
	 */
	public static function get_or_create( int $post_id ): ?string {
		if ( $post_id <= 0 ) {
			return null;
		}

		$post = get_post( $post_id );
		if ( ! $post || 'post' !== $post->post_type ) {
			return null;
		}

		$existing = self::get( $post_id );
		if ( $existing ) {
			return $existing;
		}

		$new_uuid = strtolower( wp_generate_uuid4() );

		// Concurrency-safe: returns false if the meta key already exists.
		$added = add_post_meta( $post_id, self::META_KEY, $new_uuid, true );

		if ( $added ) {
			/**
			 * Fires only when an Article UUID is first created.
			 *
			 * @param string $new_uuid The generated UUID v4.
			 * @param int    $post_id  The WordPress post ID.
			 */
			do_action( 'veridis_news_article_uuid_created', $new_uuid, $post_id );
			return $new_uuid;
		}

		// Re-read if another concurrent process won the race.
		return self::get( $post_id );
	}

	/**
	 * Locate WordPress post ID by its canonical UUID.
	 */
	public static function find_post_id_by_uuid( string $uuid ): ?int {
		$clean_uuid = strtolower( trim( $uuid ) );
		if ( ! self::is_valid_uuid( $clean_uuid ) ) {
			return null;
		}

		$query = new \WP_Query( array(
			'post_type'              => 'post',
			'post_status'            => 'any',
			'posts_per_page'         => 1,
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'meta_query'             => array(
				array(
					'key'     => self::META_KEY,
					'value'   => $clean_uuid,
					'compare' => '=',
				),
			),
		) );

		return ! empty( $query->posts ) ? (int) $query->posts[0] : null;
	}
}
