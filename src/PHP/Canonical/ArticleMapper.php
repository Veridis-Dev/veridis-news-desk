<?php
namespace Veridis\NewsDesk\Canonical;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Editorial\EditorialMetadataRepository;
use Veridis\NewsDesk\Editorial\EditorialStatus;
use Veridis\NewsDesk\Editorial\Priority;
use Veridis\NewsDesk\Editorial\SourceStatus;

/**
 * Maps WordPress post and metadata into canonical Veridis Article DTO.
 */
final class ArticleMapper {
	/**
	 * Map a WP_Post object into an Article DTO.
	 *
	 * @param \WP_Post $post
	 * @return Article|null
	 */
	public static function map( \WP_Post $post ): ?Article {
		if ( 'post' !== $post->post_type ) {
			return null;
		}

		$post_id = (int) $post->ID;
		$uuid    = ArticleIdentity::get_or_create( $post_id );
		if ( ! $uuid ) {
			return null;
		}

		$wp_status = (string) $post->post_status;

		// 1. Faithful content extraction (unaltered stored values).
		$title   = (string) $post->post_title;
		$excerpt = (string) $post->post_excerpt;
		$content = (string) $post->post_content;

		// 2. Timestamps.
		$date_dt      = get_post_datetime( $post, 'date', 'utc' );
		$published_at = ( 'publish' === $wp_status && $date_dt ) ? $date_dt->format( 'Y-m-d\TH:i:s\Z' ) : null;
		$scheduled_at = ( 'future' === $wp_status && $date_dt ) ? $date_dt->format( 'Y-m-d\TH:i:s\Z' ) : null;

		$mod_dt = get_post_datetime( $post, 'modified', 'utc' );
		if ( $mod_dt ) {
			$modified_at = $mod_dt->format( 'Y-m-d\TH:i:s\Z' );
		} else {
			$raw_mod     = $post->post_modified_gmt ?: $post->post_modified;
			$ts          = strtotime( $raw_mod );
			$modified_at = gmdate( 'Y-m-d\TH:i:s\Z', $ts ?: time() );
		}

		// 3. Author v0.1 (embedded reference without email).
		$author_id   = (int) $post->post_author;
		$author_user = $author_id > 0 ? get_userdata( $author_id ) : null;
		$author      = $author_user ? array(
			'wpUserId'    => $author_id,
			'displayName' => (string) $author_user->display_name,
		) : null;

		// 4. Taxonomies (categories & tags).
		$categories = self::map_terms( $post, 'category' );
		$tags       = self::map_terms( $post, 'post_tag' );

		// 5. Featured Image.
		$featured_image = self::map_featured_image( $post );

		// 6. Editorial metadata (null if no Veridis metadata exists).
		$editorial = self::map_editorial( $post );

		$article = new Article(
			$uuid,
			$post_id,
			$title,
			$excerpt,
			$content,
			$wp_status,
			$published_at,
			$scheduled_at,
			$modified_at,
			$author,
			$categories,
			$tags,
			$featured_image,
			$editorial,
			array()
		);

		/**
		 * Filter the final canonical Article DTO.
		 *
		 * @param Article  $article Canonical article DTO.
		 * @param \WP_Post $post    Original WordPress post object.
		 */
		return apply_filters( 'veridis_news_canonical_article', $article, $post );
	}

	/**
	 * Map taxonomy terms for a post.
	 *
	 * @param \WP_Post $post
	 * @param string   $taxonomy
	 * @return array<int, array{wpTermId: int, name: string, slug: string}>
	 */
	private static function map_terms( \WP_Post $post, string $taxonomy ): array {
		$terms = get_the_terms( $post, $taxonomy );
		if ( ! is_array( $terms ) ) {
			return array();
		}

		$items = array();
		foreach ( $terms as $term ) {
			if ( $term instanceof \WP_Term ) {
				$items[] = array(
					'wpTermId' => (int) $term->term_id,
					'name'     => (string) $term->name,
					'slug'     => (string) $term->slug,
				);
			}
		}
		return $items;
	}

	/**
	 * Map featured image thumbnail.
	 *
	 * @param \WP_Post $post
	 * @return array{wpAttachmentId: int, url: string, alt: string, width: ?int, height: ?int}|null
	 */
	private static function map_featured_image( \WP_Post $post ): ?array {
		if ( ! has_post_thumbnail( $post ) ) {
			return null;
		}

		$thumb_id = (int) get_post_thumbnail_id( $post );
		if ( $thumb_id <= 0 ) {
			return null;
		}

		$src = wp_get_attachment_image_src( $thumb_id, 'full' );
		if ( ! $src ) {
			return null;
		}

		$alt = (string) get_post_meta( $thumb_id, '_wp_attachment_image_alt', true );

		return array(
			'wpAttachmentId' => $thumb_id,
			'url'            => (string) $src[0],
			'alt'            => $alt,
			'width'          => isset( $src[1] ) ? (int) $src[1] : null,
			'height'         => isset( $src[2] ) ? (int) $src[2] : null,
		);
	}

	/**
	 * Map Veridis editorial metadata without presentation fallbacks.
	 *
	 * Returns null if the post has no Veridis editorial metadata stored.
	 *
	 * @param \WP_Post $post
	 * @return ArticleEditorial|null
	 */
	private static function map_editorial( \WP_Post $post ): ?ArticleEditorial {
		$post_id        = (int) $post->ID;
		$editorial_keys = array(
			EditorialMetadataRepository::META_STATUS,
			EditorialMetadataRepository::META_ASSIGNED,
			EditorialMetadataRepository::META_DEADLINE,
			EditorialMetadataRepository::META_PRIORITY,
			EditorialMetadataRepository::META_NOTES,
			EditorialMetadataRepository::META_SOURCES,
			EditorialMetadataRepository::META_LEGACY_SOURCE,
		);

		$has_editorial = false;
		foreach ( $editorial_keys as $key ) {
			if ( metadata_exists( 'post', $post_id, $key ) ) {
				$has_editorial = true;
				break;
			}
		}

		if ( ! $has_editorial ) {
			return null;
		}

		// Editorial Status (null if not explicitly stored).
		$status = null;
		if ( metadata_exists( 'post', $post_id, EditorialMetadataRepository::META_STATUS ) ) {
			$raw_status = (string) get_post_meta( $post_id, EditorialMetadataRepository::META_STATUS, true );
			$status     = EditorialStatus::is_valid( $raw_status ) ? $raw_status : null;
		}

		// Assigned To:
		// null = meta absent
		// 0    = explicitly unassigned
		// >0   = user ID
		$assigned_to = null;
		if ( metadata_exists( 'post', $post_id, EditorialMetadataRepository::META_ASSIGNED ) ) {
			$raw_assigned = get_post_meta( $post_id, EditorialMetadataRepository::META_ASSIGNED, true );
			$assigned_to  = (int) $raw_assigned;
		}

		// Deadline (stored canonically as UTC 'Y-m-d H:i:s').
		$deadline_at = null;
		if ( metadata_exists( 'post', $post_id, EditorialMetadataRepository::META_DEADLINE ) ) {
			$raw_deadline = (string) get_post_meta( $post_id, EditorialMetadataRepository::META_DEADLINE, true );
			if ( '' !== trim( $raw_deadline ) ) {
				$dt          = \DateTimeImmutable::createFromFormat( '!Y-m-d H:i:s', $raw_deadline, new \DateTimeZone( 'UTC' ) );
				$deadline_at = $dt ? $dt->format( 'Y-m-d\TH:i:s\Z' ) : null;
			}
		}

		// Priority (null if not explicitly stored).
		$priority = null;
		if ( metadata_exists( 'post', $post_id, EditorialMetadataRepository::META_PRIORITY ) ) {
			$raw_priority = (string) get_post_meta( $post_id, EditorialMetadataRepository::META_PRIORITY, true );
			$priority     = Priority::is_valid( $raw_priority ) ? $raw_priority : null;
		}

		// Internal Notes.
		$internal_notes = (string) get_post_meta( $post_id, EditorialMetadataRepository::META_NOTES, true );

		// Sources.
		$sources      = array();
		$sources_meta = get_post_meta( $post_id, EditorialMetadataRepository::META_SOURCES, true );
		if ( is_array( $sources_meta ) ) {
			foreach ( $sources_meta as $item ) {
				if ( is_array( $item ) && isset( $item['name'] ) && '' !== trim( (string) $item['name'] ) ) {
					$sources[] = array(
						'id'     => isset( $item['id'] ) && '' !== trim( (string) $item['id'] ) ? (string) $item['id'] : wp_generate_uuid4(),
						'name'   => sanitize_text_field( (string) $item['name'] ),
						'status' => isset( $item['status'] ) && SourceStatus::is_valid( (string) $item['status'] ) ? (string) $item['status'] : SourceStatus::DEFAULT,
					);
				}
			}
		}
		if ( empty( $sources ) && metadata_exists( 'post', $post_id, EditorialMetadataRepository::META_LEGACY_SOURCE ) ) {
			$legacy = trim( (string) get_post_meta( $post_id, EditorialMetadataRepository::META_LEGACY_SOURCE, true ) );
			if ( '' !== $legacy ) {
				$sources[] = array(
					'id'     => 'legacy-source',
					'name'   => $legacy,
					'status' => SourceStatus::DEFAULT,
				);
			}
		}

		$editorial = new ArticleEditorial(
			$status,
			$assigned_to,
			$deadline_at,
			$priority,
			$internal_notes,
			$sources,
			array()
		);

		/**
		 * Filter the canonical ArticleEditorial DTO.
		 *
		 * @param ArticleEditorial|null $editorial
		 * @param \WP_Post              $post
		 */
		return apply_filters( 'veridis_news_canonical_article_editorial', $editorial, $post );
	}
}
