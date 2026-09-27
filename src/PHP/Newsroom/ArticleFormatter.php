<?php
namespace Veridis\NewsDesk\Newsroom;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\ArticleHealth\ArticleHealthService;
use Veridis\NewsDesk\Editorial\EditorialMetadataService;

final class ArticleFormatter {
	private $health;
	private $editorial;

	public function __construct( ?ArticleHealthService $health = null, ?EditorialMetadataService $editorial = null ) {
		$this->health    = $health ?: new ArticleHealthService();
		$this->editorial = $editorial ?: new EditorialMetadataService();
	}

	public function summary( object $post, array $followups_map = array() ): array {
		// Selected SQL rows are raw; mark the local object to avoid WP_Post::filter reloading full content.
		$post = new \WP_Post( $post );
		$post->filter = 'raw';
		$id         = (int) $post->ID;
		$status     = (string) $post->post_status;
		$author     = get_userdata( (int) $post->post_author );
		$author_name = $author ? $author->display_name : __( 'Unknown author', 'veridis-news-desk' );
		$categories = $this->terms( $id, 'category', $post );
		$issues     = $this->health->issues_for_post( $id, (string) $post->post_excerpt, $post );
		$date       = in_array( $status, array( 'future', 'publish' ), true ) ? (string) $post->post_date : (string) $post->post_modified;
		$editorial  = $this->editorial->get( $id, $post );
		if ( isset( $followups_map[ $id ] ) ) {
			$followup_info = $followups_map[ $id ];
		} elseif ( isset( $followups_map['open'] ) ) {
			$followup_info = $followups_map;
		} else {
			$followup_info = array( 'open' => 0, 'overdue' => 0 );
		}

		return array(
			'id'                      => $id,
			'breaking' => ( new \Veridis\NewsDesk\Breaking\BreakingService() )->get( $id ),
			'followUps'               => array(
				'count'        => $followup_info['open'],
				'overdueCount' => $followup_info['overdue'],
			),
			'title'                   => '' !== trim( (string) $post->post_title ) ? wp_specialchars_decode( $post->post_title, ENT_QUOTES ) : __( '(no title)', 'veridis-news-desk' ),
			'authorId'                => (int) $post->post_author,
			'authorName'              => $author_name,
			'authorInitials'          => $this->initials( $author_name ),
			'categories'              => $categories,
			'primaryCategory'         => $categories[0] ?? null,
			'additionalCategoryCount' => max( 0, count( $categories ) - 1 ),
			'status'                  => $status,
			'statusLabel'             => WordPressStatus::label( $status ),
			'tone'                    => WordPressStatus::tone( $status ),
			'wpStatus'                => $status,
			'wpStatusLabel'           => WordPressStatus::label( $status ),
			'wpStatusTone'            => WordPressStatus::tone( $status ),
			'editorialStatus'         => $editorial['editorialStatus'],
			'editorialStatusLabel'    => $editorial['editorialStatusLabel'],
			'editorialStatusTone'     => $editorial['editorialStatusTone'],
			'assignedTo'              => $editorial['assignedTo'],
			'assignedName'            => $editorial['assignedName'],
			'assignedInitials'        => $editorial['assignedInitials'],
			'isUnassigned'            => $editorial['isUnassigned'],
			'deadline'                => $editorial['deadline'],
			'deadlineLocal'           => $editorial['deadlineLocal'],
			'deadlineLabel'           => $editorial['deadlineLabel'],
			'isOverdue'               => $editorial['isOverdue'],
			'priority'                => $editorial['priority'],
			'priorityLabel'           => $editorial['priorityLabel'],
			'priorityTone'            => $editorial['priorityTone'],
			'dateKind'                => 'future' === $status ? 'scheduled' : ( 'publish' === $status ? 'published' : 'modified' ),
			'dateAt'                  => $this->iso_date( $date ),
			'dateLabel'               => $this->display_date( $date ),
			'healthIssueCount'        => count( $issues ),
			'complete'                => ! $issues,
		);
	}

	/** @return array<int,array{id:int,name:string}> */
	public function terms( int $post_id, string $taxonomy, ?object $post = null ): array {
		$terms = get_the_terms( $post ? new \WP_Post( $post ) : $post_id, $taxonomy );
		if ( ! is_array( $terms ) ) {
			return array();
		}
		return array_map( static function ( $term ) { return array( 'id' => (int) $term->term_id, 'name' => $term->name ); }, $terms );
	}

	public function iso_date( string $date ): string {
		$value = \DateTimeImmutable::createFromFormat( 'Y-m-d H:i:s', $date, wp_timezone() );
		return $value ? $value->format( DATE_ATOM ) : '';
	}

	public function display_date( string $date ): string {
		$value = \DateTimeImmutable::createFromFormat( 'Y-m-d H:i:s', $date, wp_timezone() );
		return $value ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $value->getTimestamp(), wp_timezone() ) : '';
	}

	public function initials( string $name ): string {
		$parts = preg_split( '/\s+/u', trim( $name ) ) ?: array();
		$selected = count( $parts ) > 1 ? array( $parts[0], $parts[ count( $parts ) - 1 ] ) : $parts;
		$initials = implode( '', array_map( static function ( $part ) { return function_exists( 'mb_substr' ) ? mb_substr( $part, 0, 1 ) : substr( $part, 0, 1 ); }, $selected ) );
		return function_exists( 'mb_strtoupper' ) ? mb_strtoupper( $initials ) : strtoupper( $initials ?: '?' );
	}
}
