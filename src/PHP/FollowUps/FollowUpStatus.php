<?php
namespace Veridis\NewsDesk\FollowUps;

defined( 'ABSPATH' ) || exit;

final class FollowUpStatus {
	public const STATUS_OPEN      = 'open';
	public const STATUS_DONE      = 'done';
	public const STATUS_CANCELLED = 'cancelled';

	public const ALLOWED = array(
		self::STATUS_OPEN,
		self::STATUS_DONE,
		self::STATUS_CANCELLED,
	);

	public static function label( string $status ): string {
		switch ( $status ) {
			case self::STATUS_DONE:
				return __( 'Done', 'veridis-news-desk' );
			case self::STATUS_CANCELLED:
				return _x( 'Cancelled', 'single follow-up status', 'veridis-news-desk' );
			case self::STATUS_OPEN:
			default:
				return __( 'Open', 'veridis-news-desk' );
		}
	}

	public static function tone( string $status ): string {
		switch ( $status ) {
			case self::STATUS_DONE:
				return 'success';
			case self::STATUS_CANCELLED:
				return 'neutral';
			case self::STATUS_OPEN:
			default:
				return 'info';
		}
	}
}
