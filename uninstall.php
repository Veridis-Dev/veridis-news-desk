<?php
/**
 * Veridis News Desk uninstall handler.
 *
 * Preserves data by default unless the administrator explicitly configured
 * preserve_data_on_uninstall to false.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

$settings = get_option( 'veridis_news_desk_settings', array() );

// Default / fallback behavior MUST be preservation.
// If preserve_data_on_uninstall is true or missing or invalid, do nothing destructive.
if ( ! is_array( $settings ) || ! isset( $settings['preserve_data_on_uninstall'] ) || true === (bool) $settings['preserve_data_on_uninstall'] ) {
	return;
}

global $wpdb;

// 1. Drop Veridis News Desk custom table.
$table_followups = $wpdb->prefix . 'veridis_news_followups';
$wpdb->query( "DROP TABLE IF EXISTS {$table_followups}" );

// 2. Explicitly remove all known Veridis News Desk post metadata keys.
$known_meta_keys = array(
	'_veridis_article_uuid',
	'_veridis_editorial_status',
	'_veridis_assigned_to',
	'_veridis_deadline',
	'_veridis_priority',
	'_veridis_internal_notes',
	'_veridis_news_sources',
	'_veridis_news_source',
	'_veridis_news_photo_credit',
	'_veridis_pending_initial_author',
	'_veridis_breaking_active',
	'_veridis_breaking_label',
	'_veridis_breaking_priority',
	'_veridis_breaking_started_at',
	'_veridis_breaking_expires_at',
	'_veridis_breaking_homepage_lead',
	'_veridis_news_demo',
	'_veridis_news_demo_batch',
);

$format_placeholders = implode( ', ', array_fill( 0, count( $known_meta_keys ), '%s' ) );
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->postmeta} WHERE meta_key IN ({$format_placeholders})",
		$known_meta_keys
	)
);

// 3. Remove Veridis News Desk options.
delete_option( 'veridis_news_desk_settings' );
delete_option( 'veridis_news_desk_schema_version' );
delete_option( 'veridis_news_desk_demo_manifest' );
