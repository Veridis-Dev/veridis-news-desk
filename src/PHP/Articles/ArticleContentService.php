<?php
namespace Veridis\NewsDesk\Articles;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Editorial\EditorialMetadataRepository;
use Veridis\NewsDesk\Editorial\EditorialStatus;

final class ArticleContentService {
	private $articles;

	public function __construct( ?ArticleService $articles = null ) {
		$this->articles = $articles ?: new ArticleService();
	}

	/**
	 * Update content health fields for an article.
	 *
	 * @param int   $id
	 * @param array $input
	 * @return true|\WP_Error
	 */
	public function update( int $id, array $input ) {
		$post = get_post( $id );
		if ( ! $post || 'post' !== $post->post_type ) {
			return new \WP_Error(
				'veridis_news_article_not_found',
				__( 'The article could not be found.', 'veridis-news-desk' ),
				array( 'status' => 404 )
			);
		}

		$editorial = ( new EditorialMetadataRepository() )->get( $id, $post );
		if ( EditorialStatus::IDEA === $editorial['editorial_status'] && $editorial['is_unassigned'] ) {
			return new \WP_Error(
				'veridis_news_story_needs_assignee',
				__( 'Assign this story before editing its content.', 'veridis-news-desk' ),
				array( 'status' => 400 )
			);
		}

		$post_update = array();
		if ( array_key_exists( 'excerpt', $input ) ) {
			$post_update['ID']           = $id;
			$post_update['post_excerpt'] = sanitize_textarea_field( (string) $input['excerpt'] );
		}

		if ( ! empty( $post_update ) ) {
			$result = wp_update_post( $post_update, true );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		if ( array_key_exists( 'photoCredit', $input ) ) {
			$credit = sanitize_text_field( (string) $input['photoCredit'] );
			if ( '' === trim( $credit ) ) {
				delete_post_meta( $id, '_veridis_news_photo_credit' );
			} else {
				update_post_meta( $id, '_veridis_news_photo_credit', $credit );
			}
		}

		return true;
	}
}
