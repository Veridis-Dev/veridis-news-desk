<?php
namespace Veridis\NewsDesk\FollowUps;

defined( 'ABSPATH' ) || exit;

final class FollowUpInstaller {
	public const OPTION_VERSION = 'veridis_news_desk_schema_version';
	public const CURRENT_VERSION = 1;

	public static function table_name( ?\wpdb $db = null ): string {
		global $wpdb;
		$db = $db ?: $wpdb;
		return $db->prefix . 'veridis_news_followups';
	}

	public static function install(): void {
		global $wpdb;

		$table_name      = self::table_name( $wpdb );
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			post_id BIGINT UNSIGNED NOT NULL,
			title VARCHAR(190) NOT NULL,
			notes TEXT NULL,
			assigned_to BIGINT UNSIGNED NOT NULL DEFAULT 0,
			status VARCHAR(20) NOT NULL DEFAULT 'open',
			due_at_utc DATETIME NULL,
			created_by BIGINT UNSIGNED NOT NULL,
			created_at_utc DATETIME NOT NULL,
			updated_at_utc DATETIME NOT NULL,
			completed_at_utc DATETIME NULL,
			PRIMARY KEY  (id),
			KEY post_id (post_id),
			KEY status (status),
			KEY due_at_utc (due_at_utc),
			KEY assigned_to (assigned_to),
			KEY status_due (status, due_at_utc)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );

		update_option( self::OPTION_VERSION, self::CURRENT_VERSION );
	}

	public static function maybe_install(): void {
		$installed = (int) get_option( self::OPTION_VERSION, 0 );
		if ( $installed < self::CURRENT_VERSION ) {
			self::install();
		}
	}
}
