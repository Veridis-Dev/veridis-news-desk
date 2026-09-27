<?php
namespace Veridis\NewsDesk\Newsroom;

defined( 'ABSPATH' ) || exit;

/**
 * @deprecated Use WordPressStatus instead. Maintained for backwards compatibility.
 */
final class EditorialStatus {
	public const ALLOWED = WordPressStatus::ALLOWED;

	public static function label( string $status ): string {
		return WordPressStatus::label( $status );
	}

	public static function tone( string $status ): string {
		return WordPressStatus::tone( $status );
	}
}
