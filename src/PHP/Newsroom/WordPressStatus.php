<?php
namespace Veridis\NewsDesk\Newsroom;

defined( 'ABSPATH' ) || exit;

/**
 * WordPress publication status helper for Newsroom queries and labels.
 * Independent of Veridis Editorial workflow status.
 */
final class WordPressStatus {
	public const ALLOWED         = array( 'draft', 'pending', 'future', 'publish' );
	public const ACTIVE_STATUSES = array( 'draft', 'pending', 'future' );

	public static function label( string $status ): string {
		$labels = array(
			'draft'   => __( 'Draft', 'veridis-news-desk' ),
			'pending' => __( 'In review', 'veridis-news-desk' ),
			'future'  => __( 'Scheduled', 'veridis-news-desk' ),
			'publish' => __( 'Published', 'veridis-news-desk' ),
		);
		return $labels[ $status ] ?? $status;
	}

	public static function tone( string $status ): string {
		return array( 'draft' => 'neutral', 'pending' => 'warning', 'future' => 'info', 'publish' => 'success' )[ $status ] ?? 'neutral';
	}
}

// Backwards compatibility alias if referenced elsewhere.
class_alias( WordPressStatus::class, EditorialStatus::class );
