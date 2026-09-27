<?php
namespace Veridis\NewsDesk\Breaking;
defined( 'ABSPATH' ) || exit;

final class BreakingMetadataRepository {
	const KEYS = array( 'active' => 'active', 'startedAt' => 'started_at', 'expiresAt' => 'expires_at', 'priority' => 'priority', 'label' => 'label', 'homepageLead' => 'homepage_lead' );
	public function get( int $id ): array {
		$data = array();
		foreach ( self::KEYS as $field => $suffix ) {
			$data[ $field ] = get_post_meta( $id, '_veridis_breaking_' . $suffix, true );
		}
		return $data;
	}
	public function save( int $id, array $data ): void {
		foreach ( self::KEYS as $field => $suffix ) {
			if ( array_key_exists( $field, $data ) ) {
				update_post_meta( $id, '_veridis_breaking_' . $suffix, $data[ $field ] );
			}
		}
	}
}
