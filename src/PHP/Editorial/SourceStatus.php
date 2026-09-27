<?php
namespace Veridis\NewsDesk\Editorial;

defined( 'ABSPATH' ) || exit;

final class SourceStatus {
	public const CONFIRMED  = 'confirmed';
	public const CONTACTED  = 'contacted';
	public const WAITING    = 'waiting';
	public const UNVERIFIED = 'unverified';

	public const DEFAULT = self::UNVERIFIED;

	public const ALLOWED = array(
		self::CONFIRMED,
		self::CONTACTED,
		self::WAITING,
		self::UNVERIFIED,
	);

	public static function label( string $status ): string {
		$labels = array(
			self::CONFIRMED  => __( 'Confirmed', 'veridis-news-desk' ),
			self::CONTACTED  => __( 'Contacted', 'veridis-news-desk' ),
			self::WAITING    => __( 'Waiting', 'veridis-news-desk' ),
			self::UNVERIFIED => __( 'Unverified', 'veridis-news-desk' ),
		);
		return $labels[ $status ] ?? $status;
	}

	public static function tone( string $status ): string {
		$tones = array(
			self::CONFIRMED  => 'success',
			self::CONTACTED  => 'info',
			self::WAITING    => 'warning',
			self::UNVERIFIED => 'neutral',
		);
		return $tones[ $status ] ?? 'neutral';
	}

	public static function is_valid( string $status ): bool {
		return in_array( $status, self::ALLOWED, true );
	}
}
