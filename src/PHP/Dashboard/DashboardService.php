<?php
namespace Veridis\NewsDesk\Dashboard;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\ArticleHealth\ArticleHealthService;
use Veridis\NewsDesk\Core\Access;
use Veridis\NewsDesk\Editorial\EditorialMetadataRepository;
use Veridis\NewsDesk\Editorial\EditorialMetadataService;

final class DashboardService {
	private $posts;
	private $health;
	private $editorial;

	public function __construct(
		?WordPressPostRepository $posts = null,
		?ArticleHealthService $health = null,
		?EditorialMetadataService $editorial = null
	) {
		$this->posts     = $posts ?: new WordPressPostRepository();
		$this->health    = $health ?: new ArticleHealthService();
		$this->editorial = $editorial ?: new EditorialMetadataService();
	}

	public function get(): array {
		$now             = current_datetime();
		$day_start       = $now->setTime( 0, 0, 0 );
		$day_end         = $day_start->modify( '+1 day' );
		$published       = $this->posts->count_published_between( $day_start, $day_end );
		$scheduled       = $this->posts->count_scheduled();
		$health          = $this->health->summary();
		$overdue_count   = $this->editorial->count_overdue_deadlines();
		$deadline_watch  = $this->posts->deadline_watch();

		if ( $overdue_count > 0 ) {
			$health['items'][] = array(
				'id'     => 'overdue_deadlines',
				'label'  => __( 'Overdue deadlines', 'veridis-news-desk' ),
				/* translators: %d: number of overdue editorial stories. */
				'detail' => sprintf( _n( '%d story has missed its editorial deadline', '%d stories have missed their editorial deadline', $overdue_count, 'veridis-news-desk' ), $overdue_count ),
				'count'  => $overdue_count,
			);
		}

		$attention_total = $this->count_attention_stories();

		/* translators: %d: number of articles. */
		$published_note = sprintf( _n( '%d article published today', '%d articles published today', $published, 'veridis-news-desk' ), $published );
		/* translators: %d: number of articles. */
		$scheduled_note = sprintf( _n( '%d article scheduled', '%d articles scheduled', $scheduled, 'veridis-news-desk' ), $scheduled );
		/* translators: %d: number of stories requiring attention. */
		$attention_note = sprintf( _n( '%d story requires attention', '%d stories require attention', $attention_total, 'veridis-news-desk' ), $attention_total );

		$breaking_service = new \Veridis\NewsDesk\Breaking\BreakingService();
		$breaking         = $breaking_service->listing( 3 );
		$breaking_total   = (int) $breaking['total'];

		if ( 0 === $breaking_total ) {
			$breaking_note = __( 'No active breaking stories', 'veridis-news-desk' );
		} else {
			/* translators: %d: number of active breaking stories. */
			$breaking_note = sprintf( _n( '%d active breaking story', '%d active breaking stories', $breaking_total, 'veridis-news-desk' ), $breaking_total );
		}

		$followups_repo    = new \Veridis\NewsDesk\FollowUps\FollowUpRepository();
		$followups_summary = $followups_repo->summary_counts();
		$followups_top     = $followups_repo->top_priority_open( 5 );
		$followup_service  = new \Veridis\NewsDesk\FollowUps\FollowUpService( $followups_repo );
		$followups_items   = array();
		foreach ( $followups_top as $f_row ) {
			$followups_items[] = $followup_service->format( $f_row );
		}

		return array(
			'totalStories' => $this->posts->count_stories(),
			'stats'     => array(
				array( 'id' => 'published', 'label' => __( 'Published today', 'veridis-news-desk' ), 'value' => $published, 'note' => $published_note, 'tone' => 'success' ),
				array( 'id' => 'scheduled', 'label' => __( 'Scheduled', 'veridis-news-desk' ), 'value' => $scheduled, 'note' => $scheduled_note, 'tone' => 'info' ),
				array( 'id' => 'attention', 'label' => __( 'Needs attention', 'veridis-news-desk' ), 'value' => $attention_total, 'note' => $attention_note, 'tone' => $attention_total > 0 ? 'warning' : 'success' ),
				array( 'id' => 'breaking', 'label' => __( 'Active Breaking', 'veridis-news-desk' ), 'value' => $breaking_total, 'note' => $breaking_note, 'tone' => $breaking_total > 0 ? 'error' : 'neutral' ),
			),
			'stories'   => array_map( array( $this, 'format_story' ), $this->posts->dashboard_editorial_work() ),
			'deadlineWatch' => array(
				'overdue'  => $overdue_count,
				'dueToday' => $deadline_watch['dueToday'],
				'items'    => array_map( array( $this, 'format_story' ), $deadline_watch['items'] ),
				'limit'    => 8,
			),
			'health'    => $health,
			'followups' => array(
				'items'   => $followups_items,
				'summary' => $followups_summary,
				'limit'   => 5,
			),
			'breaking'  => $breaking,
			'features'  => array( 'breakingActive' => true, 'followUpsActive' => true ),
		);
	}

	/** Count each unpublished story once if it has a health issue or an overdue editorial deadline. */
	private function count_attention_stories(): int {
		global $wpdb;
		$conditions = $this->health->sql_conditions( 'posts' );
		$health_issue = implode( ' OR ', array_map( static function ( $condition ) { return '(' . $condition . ')'; }, $conditions ) );
		$overdue = $wpdb->prepare(
			"EXISTS (
				SELECT 1 FROM {$wpdb->postmeta} deadline
				WHERE deadline.post_id = posts.ID
				AND deadline.meta_key = %s
				AND deadline.meta_value != ''
				AND deadline.meta_value < %s
			)",
			EditorialMetadataRepository::META_DEADLINE,
			gmdate( 'Y-m-d H:i:s' )
		);

		return (int) $wpdb->get_var(
			"SELECT COUNT(ID) FROM {$wpdb->posts} posts
			WHERE posts.post_type = 'post'
			AND posts.post_status IN ('draft', 'pending', 'future')
			AND " . Access::readable_post_sql( 'posts' ) . "
			AND (({$health_issue}) OR {$overdue})"
		);
	}

	private function format_story( object $post ): array {
		$post_id   = (int) $post->ID;
		$author    = get_userdata( (int) $post->post_author );
		$name      = $author ? $author->display_name : __( 'Unknown author', 'veridis-news-desk' );
		$status    = (string) $post->post_status;
		$editorial = $this->editorial->get( $post_id, $post );

		return array(
			'id'                   => $post_id,
			'title'                => '' !== trim( $post->post_title ) ? wp_specialchars_decode( $post->post_title, ENT_QUOTES ) : __( '(no title)', 'veridis-news-desk' ),
			'authorId'             => (int) $post->post_author,
			'authorName'           => $name,
			'authorInitials'       => $this->initials( $name ),
			'categories'           => $this->posts->category_names( $post_id ),
			'status'               => $status,
			'statusLabel'          => $this->status_label( $status ),
			'tone'                 => $this->status_tone( $status ),
			'editorialStatus'      => $editorial['editorialStatus'],
			'editorialStatusLabel' => $editorial['editorialStatusLabel'],
			'editorialStatusTone'  => $editorial['editorialStatusTone'],
			'assignedTo'           => $editorial['assignedTo'],
			'assignedName'         => $editorial['assignedName'],
			'assignedInitials'     => $editorial['assignedInitials'],
			'isUnassigned'         => $editorial['isUnassigned'],
			'deadline'             => $editorial['deadline'],
			'deadlineLabel'        => $editorial['deadlineLabel'],
			'isOverdue'            => $editorial['isOverdue'],
			'priority'             => $editorial['priority'],
			'priorityLabel'        => $editorial['priorityLabel'],
			'priorityTone'         => $editorial['priorityTone'],
			'modifiedAt'           => $this->local_iso_date( $post->post_modified ),
			'modifiedLabel'        => $this->local_display_date( $post->post_modified ),
			'scheduledAt'          => 'future' === $status ? $this->local_iso_date( $post->post_date ) : null,
			'scheduledLabel'       => 'future' === $status ? $this->local_display_date( $post->post_date ) : null,
			'healthIssueCount'     => count( $this->health->issues_for_post( $post_id, (string) $post->post_excerpt ) ),
		);
	}

	private function status_label( string $status ): string {
		$labels = array(
			'draft'   => __( 'Draft', 'veridis-news-desk' ),
			'pending' => __( 'In review', 'veridis-news-desk' ),
			'future'  => __( 'Scheduled', 'veridis-news-desk' ),
		);
		return $labels[ $status ] ?? $status;
	}

	private function status_tone( string $status ): string {
		return array( 'draft' => 'neutral', 'pending' => 'warning', 'future' => 'info' )[ $status ] ?? 'neutral';
	}

	private function local_iso_date( string $date ): string {
		$value = \DateTimeImmutable::createFromFormat( 'Y-m-d H:i:s', $date, wp_timezone() );
		return $value ? $value->format( DATE_ATOM ) : '';
	}

	private function local_display_date( string $date ): string {
		$value = \DateTimeImmutable::createFromFormat( 'Y-m-d H:i:s', $date, wp_timezone() );
		return $value ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $value->getTimestamp(), wp_timezone() ) : '';
	}

	private function initials( string $name ): string {
		$parts = preg_split( '/\s+/u', trim( $name ) ) ?: array();
		if ( ! $parts ) {
			return '?';
		}
		$selected = 1 === count( $parts ) ? array( $parts[0] ) : array( $parts[0], $parts[ count( $parts ) - 1 ] );
		return strtoupper( implode( '', array_map( static function ( $part ): string {
			return function_exists( 'mb_substr' ) ? mb_substr( $part, 0, 1 ) : substr( $part, 0, 1 );
		}, $selected ) ) );
	}
}
