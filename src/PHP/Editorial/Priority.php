<?php
namespace Veridis\NewsDesk\Editorial;

defined( 'ABSPATH' ) || exit;

final class Priority {
	public const LOW    = 'low';
	public const NORMAL = 'normal';
	public const HIGH   = 'high';
	public const URGENT = 'urgent';

	public const DEFAULT = self::NORMAL;

	public const ALLOWED = array(
		self::LOW,
		self::NORMAL,
		self::HIGH,
		self::URGENT,
	);

	public static function label( string $priority ): string {
		$labels = array(
			self::LOW    => __( 'Low', 'veridis-news-desk' ),
			self::NORMAL => __( 'Normal', 'veridis-news-desk' ),
			self::HIGH   => __( 'High', 'veridis-news-desk' ),
			self::URGENT => __( 'Urgent', 'veridis-news-desk' ),
		);
		return $labels[ $priority ] ?? $priority;
	}

	public static function tone( string $priority ): string {
		$tones = array(
			self::LOW    => 'neutral',
			self::NORMAL => 'neutral',
			self::HIGH   => 'warning',
			self::URGENT => 'error',
		);
		return $tones[ $priority ] ?? 'neutral';
	}

	public static function is_valid( string $priority ): bool {
		return in_array( $priority, self::ALLOWED, true );
	}

	public static function weight( string $priority ): int {
		$weights = array(
			self::URGENT => 4,
			self::HIGH   => 3,
			self::NORMAL => 2,
			self::LOW    => 1,
		);
		return $weights[ $priority ] ?? 2;
	}
}
