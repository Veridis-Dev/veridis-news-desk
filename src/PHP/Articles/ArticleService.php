<?php
namespace Veridis\NewsDesk\Articles;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\ArticleHealth\ArticleHealthService;
use Veridis\NewsDesk\Editorial\EditorialMetadataService;
use Veridis\NewsDesk\Editorial\EditorialMetadataRepository;
use Veridis\NewsDesk\Editorial\EditorialStatus;
use Veridis\NewsDesk\Editorial\Priority;
use Veridis\NewsDesk\Newsroom\ArticleFormatter;
use Veridis\NewsDesk\Newsroom\WordPressStatus;

final class ArticleService {
	private $health;
	private $formatter;
	private $editorial;

	public function __construct(
		?ArticleHealthService $health = null,
		?ArticleFormatter $formatter = null,
		?EditorialMetadataService $editorial = null
	) {
		$this->health    = $health ?: new ArticleHealthService();
		$this->editorial = $editorial ?: new EditorialMetadataService();
		$this->formatter = $formatter ?: new ArticleFormatter( $this->health, $this->editorial );
	}

	public function get_editorial_service(): EditorialMetadataService {
		return $this->editorial;
	}

	/** @return array|\WP_Error */
	public function get( int $id ) {
		$post = get_post( $id );
		if ( ! $post || 'post' !== $post->post_type || ! in_array( $post->post_status, WordPressStatus::ALLOWED, true ) ) {
			return new \WP_Error( 'veridis_news_article_not_found', __( 'The article could not be found.', 'veridis-news-desk' ), array( 'status' => 404 ) );
		}
		if ( ! current_user_can( 'edit_post', $id ) ) {
			return new \WP_Error( 'veridis_news_article_forbidden', __( 'You do not have permission to view this article.', 'veridis-news-desk' ), array( 'status' => 403 ) );
		}
		$summary   = $this->formatter->summary( $post );
		$editorial = $this->editorial->get( $id, $post );
		$issues    = $this->health->issues_for_post( $id, (string) $post->post_excerpt );
		$checks    = array(
			array( 'id' => 'featuredImage', 'label' => __( 'Featured image', 'veridis-news-desk' ), 'passed' => ! in_array( 'missing_featured_image', $issues, true ) ),
			array( 'id' => 'excerpt', 'label' => __( 'Excerpt', 'veridis-news-desk' ), 'passed' => ! in_array( 'missing_excerpt', $issues, true ) ),
			array( 'id' => 'source', 'label' => __( 'Source', 'veridis-news-desk' ), 'passed' => ! in_array( 'missing_source', $issues, true ) ),
			array( 'id' => 'photoCredit', 'label' => __( 'Photo credit', 'veridis-news-desk' ), 'passed' => ! in_array( 'missing_photo_credit', $issues, true ) ),
		);

		return array_merge( $summary, $editorial, array(
			'tags'        => $this->formatter->terms( $id, 'post_tag' ),
			'excerpt'     => (string) $post->post_excerpt,
			'source'      => (string) get_post_meta( $id, '_veridis_news_source', true ),
			'photoCredit' => (string) get_post_meta( $id, '_veridis_news_photo_credit', true ),
			'healthChecks'=> $checks,
			'editUrl'     => get_edit_post_link( $id, 'raw' ) ?: null,
			'viewUrl'     => 'publish' === $post->post_status ? get_permalink( $id ) : null,
		) );
	}

	/** @return array|\WP_Error */
	public function create( array $input ) {
		$title       = sanitize_text_field( (string) ( $input['title'] ?? '' ) );
		$creator_id  = get_current_user_id();
		// A legacy author parameter remains an assignee default when assignedTo is omitted.
		$assigned_to = array_key_exists( 'assignedTo', $input ) ? absint( $input['assignedTo'] ) : absint( $input['author'] ?? $creator_id );
		$author_id   = $assigned_to ?: $creator_id;
		$category_id = absint( $input['category'] ?? 0 );
		if ( '' === $title ) {
			return new \WP_Error( 'veridis_news_title_required', __( 'Enter a working title.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}
		$author = get_userdata( $author_id );
		if ( ! $author || ! user_can( $author, 'edit_posts' ) ) {
			return new \WP_Error( 'veridis_news_invalid_assigned_user', __( 'Assigned user must have permission to edit posts.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}
		if ( $category_id && ! term_exists( $category_id, 'category' ) ) {
			return new \WP_Error( 'veridis_news_invalid_category', __( 'Select a valid category.', 'veridis-news-desk' ), array( 'status' => 400 ) );
		}
		$id = wp_insert_post( array(
			'post_type'     => 'post',
			'post_status'   => 'draft',
			'post_title'    => $title,
			'post_author'   => $author_id,
			'post_category' => $category_id ? array( $category_id ) : array(),
		), true );
		if ( is_wp_error( $id ) ) {
			return $id;
		}

		// Save initial editorial metadata
		$editorial_status = (string) ( $input['editorialStatus'] ?? EditorialStatus::WRITING );
		$priority         = (string) ( $input['priority'] ?? Priority::DEFAULT );
		$deadline         = isset( $input['deadline'] ) && '' !== trim( (string) $input['deadline'] ) ? (string) $input['deadline'] : null;

		$editorial_update = $this->editorial->update( (int) $id, array(
			'editorialStatus' => EditorialStatus::is_valid( $editorial_status ) ? $editorial_status : EditorialStatus::WRITING,
			'assignedTo'      => $assigned_to,
			'priority'        => Priority::is_valid( $priority ) ? $priority : Priority::DEFAULT,
			'deadline'        => $deadline,
		) );

		if ( is_wp_error( $editorial_update ) ) {
			wp_delete_post( (int) $id, true );
			return $editorial_update;
		}
		if ( EditorialStatus::IDEA === $editorial_status && 0 === $assigned_to ) {
			update_post_meta( (int) $id, EditorialMetadataRepository::META_PENDING_AUTHOR, $creator_id );
			if ( $creator_id !== (int) get_post_meta( (int) $id, EditorialMetadataRepository::META_PENDING_AUTHOR, true ) ) {
				wp_delete_post( (int) $id, true );
				return new \WP_Error( 'veridis_news_assignment_save_failed', __( 'Could not save the story assignment.', 'veridis-news-desk' ), array( 'status' => 500 ) );
			}
		}

		return $this->get( (int) $id );
	}
}
