<?php
namespace Veridis\NewsDesk\ArticleHealth;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;

/** Keeps the first Article Health rules isolated from dashboard presentation. */
final class ArticleHealthService {
	/**
	 * Determine whether an article has a valid source.
	 * Complete if either structured sources has >=1 non-empty source, or legacy source is non-empty.
	 */
	public function has_source( int $post_id ): bool {
		$sources = get_post_meta( $post_id, '_veridis_news_sources', true );
		if ( is_array( $sources ) && ! empty( $sources ) ) {
			foreach ( $sources as $item ) {
				if ( is_array( $item ) && isset( $item['name'] ) && '' !== trim( (string) $item['name'] ) ) {
					return true;
				}
			}
		}

		$legacy = (string) get_post_meta( $post_id, '_veridis_news_source', true );
		return '' !== trim( $legacy );
	}

	/** @return string[] */
	public function issues_for_post( int $post_id, string $excerpt, ?object $post = null ): array {
		$issues = array();
		if ( ! has_post_thumbnail( $post ? new \WP_Post( $post ) : $post_id ) ) {
			$issues[] = 'missing_featured_image';
		}
		if ( '' === trim( $excerpt ) ) {
			$issues[] = 'missing_excerpt';
		}
		if ( ! $this->has_source( $post_id ) ) {
			$issues[] = 'missing_source';
		}
		if ( '' === trim( (string) get_post_meta( $post_id, '_veridis_news_photo_credit', true ) ) ) {
			$issues[] = 'missing_photo_credit';
		}

		return $issues;
	}

	/**
	 * @return array{affectedPosts:int,items:array<int,array{id:string,label:string,detail:string,count:int}>}
	 */
	public function summary(): array {
		$totals = $this->aggregate_for_statuses( array( 'draft', 'pending', 'future' ) );
		$featured_count = $totals['missing_featured_image'];
		$excerpt_count  = $totals['missing_excerpt'];
		$source_count   = $totals['missing_source'];
		$credit_count   = $totals['missing_photo_credit'];
		/* translators: %d: number of articles. */
		$featured_detail = sprintf( _n( '%d article has no featured image', '%d articles have no featured image', $featured_count, 'veridis-news-desk' ), $featured_count );
		/* translators: %d: number of articles. */
		$excerpt_detail = sprintf( _n( '%d article has no excerpt', '%d articles have no excerpt', $excerpt_count, 'veridis-news-desk' ), $excerpt_count );
		/* translators: %d: number of articles. */
		$source_detail = sprintf( _n( '%d article has no source information', '%d articles have no source information', $source_count, 'veridis-news-desk' ), $source_count );
		/* translators: %d: number of articles. */
		$credit_detail = sprintf( _n( '%d article has no photo credit', '%d articles have no photo credit', $credit_count, 'veridis-news-desk' ), $credit_count );
		$items = array(
			array(
				'id'     => 'missingFeaturedImage',
				'label'  => __( 'Missing featured image', 'veridis-news-desk' ),
				'detail' => $featured_detail,
				'count'  => $featured_count,
			),
			array(
				'id'     => 'missingExcerpt',
				'label'  => __( 'Missing excerpt', 'veridis-news-desk' ),
				'detail' => $excerpt_detail,
				'count'  => $excerpt_count,
			),
			array(
				'id'     => 'missingSource',
				'label'  => __( 'Missing source', 'veridis-news-desk' ),
				'detail' => $source_detail,
				'count'  => $source_count,
			),
			array(
				'id'     => 'missingPhotoCredit',
				'label'  => __( 'Missing photo credit', 'veridis-news-desk' ),
				'detail' => $credit_detail,
				'count'  => $credit_count,
			),
		);

		return array( 'affectedPosts' => $totals['affected_posts'], 'items' => $items );
	}

	/**
	 * SQL expressions shared by aggregate and paginated newsroom queries.
	 *
	 * @return array<string,string>
	 */
	public function sql_conditions( string $alias = 'posts' ): array {
		global $wpdb;
		$alias = preg_replace( '/[^A-Za-z0-9_]/', '', $alias ) ?: 'posts';

		return array(
			'missing_featured_image' => "NOT EXISTS (
				SELECT 1 FROM {$wpdb->postmeta} thumb
				INNER JOIN {$wpdb->posts} attachment
					ON attachment.ID = CAST(thumb.meta_value AS UNSIGNED)
					AND attachment.post_type = 'attachment'
					AND attachment.post_status = 'inherit'
				WHERE thumb.post_id = {$alias}.ID AND thumb.meta_key = '_thumbnail_id'
			)",
			'missing_excerpt' => "TRIM({$alias}.post_excerpt) = ''",
			// Note: Checking serialized _veridis_news_sources in SQL is an isolated v0.2 post_meta limitation.
			// Structured sources are considered present in SQL if at least one entry has a non-empty name (string length >= 1).
			// This will be migrated to a dedicated relational table in a future major release.
			'missing_source' => "NOT EXISTS (
				SELECT 1 FROM {$wpdb->postmeta} source_meta
				WHERE source_meta.post_id = {$alias}.ID
				AND (
					(source_meta.meta_key = '_veridis_news_source' AND TRIM(source_meta.meta_value) <> '')
					OR
					(source_meta.meta_key = '_veridis_news_sources' AND source_meta.meta_value REGEXP 's:4:\\\"name\\\";s:[1-9][0-9]*:\\\"')
				)
			)",
			'missing_photo_credit' => "NOT EXISTS (
				SELECT 1 FROM {$wpdb->postmeta} credit_meta
				WHERE credit_meta.post_id = {$alias}.ID
				AND credit_meta.meta_key = '_veridis_news_photo_credit'
				AND TRIM(credit_meta.meta_value) <> ''
			)",
		);
	}

	/** @return array<string,int> */
	private function aggregate_for_statuses( array $statuses ): array {
		global $wpdb;
		$conditions = $this->sql_conditions( 'posts' );
		$any_issue  = implode( ' OR ', array_map( static function ( $condition ) { return '(' . $condition . ')'; }, $conditions ) );
		$statuses   = array_values( array_intersect( array( 'draft', 'pending', 'future', 'publish' ), $statuses ) );
		$placeholders = implode( ', ', array_fill( 0, count( $statuses ), '%s' ) );
		$sql = "SELECT
			SUM(CASE WHEN {$conditions['missing_featured_image']} THEN 1 ELSE 0 END) AS missing_featured_image,
			SUM(CASE WHEN {$conditions['missing_excerpt']} THEN 1 ELSE 0 END) AS missing_excerpt,
			SUM(CASE WHEN {$conditions['missing_source']} THEN 1 ELSE 0 END) AS missing_source,
			SUM(CASE WHEN {$conditions['missing_photo_credit']} THEN 1 ELSE 0 END) AS missing_photo_credit,
			SUM(CASE WHEN {$any_issue} THEN 1 ELSE 0 END) AS affected_posts
			FROM {$wpdb->posts} posts
			WHERE posts.post_type = 'post' AND posts.post_status IN ({$placeholders}) AND " . Access::readable_post_sql( 'posts' );
		$row = $wpdb->get_row( $wpdb->prepare( $sql, $statuses ), ARRAY_A );
		$empty = array( 'affected_posts' => 0, 'missing_featured_image' => 0, 'missing_excerpt' => 0, 'missing_source' => 0, 'missing_photo_credit' => 0 );
		return array_map( 'intval', array_merge( $empty, is_array( $row ) ? $row : array() ) );
	}
}
