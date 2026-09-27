<?php
namespace Veridis\NewsDesk\Editorial;

defined( 'ABSPATH' ) || exit;

final class EditorialStatus {
	public const IDEA    = 'idea';
	public const WRITING = 'writing';
	public const REVIEW  = 'review';
	public const READY   = 'ready';

	public const ALLOWED = array(
		self::IDEA,
		self::WRITING,
		self::REVIEW,
		self::READY,
	);

	public static function label( string $status ): string {
		$labels = array(
			self::IDEA    => __( 'Idea', 'veridis-news-desk' ),
			self::WRITING => __( 'Writing', 'veridis-news-desk' ),
			self::REVIEW  => __( 'Review', 'veridis-news-desk' ),
			self::READY   => __( 'Ready to publish', 'veridis-news-desk' ),
		);
		return $labels[ $status ] ?? $status;
	}

	public static function tone( string $status ): string {
		$tones = array(
			self::IDEA    => 'neutral',
			self::WRITING => 'info',
			self::REVIEW  => 'warning',
			self::READY   => 'success',
		);
		return $tones[ $status ] ?? 'neutral';
	}

	public static function is_valid( string $status ): bool {
		return in_array( $status, self::ALLOWED, true );
	}

	/**
	 * Map a WordPress post_status to its default Veridis Editorial Status.
	 */
	public static function default_from_post_status( string $post_status ): string {
		switch ( $post_status ) {
			case 'draft':
				return self::WRITING;
			case 'pending':
				return self::REVIEW;
			case 'future':
			case 'publish':
				return self::READY;
			default:
				return self::WRITING;
		}
	}
}
