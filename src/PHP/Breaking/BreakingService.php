<?php
namespace Veridis\NewsDesk\Breaking;
defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Newsroom\ArticleFormatter;
use Veridis\NewsDesk\Newsroom\NewsroomRepository;
use Veridis\NewsDesk\Core\Access;

final class BreakingService {
	public function get( int $id ): array {
		$raw = ( new BreakingMetadataRepository() )->get( $id );
		$enabled = '1' === $raw['active'];
		$expired = '' !== $raw['expiresAt'] && $raw['expiresAt'] <= gmdate( 'Y-m-d H:i:s' );
		$data = array( 'enabled' => $enabled, 'active' => $enabled && ! $expired, 'expired' => $enabled && $expired,
			'priority' => in_array( $raw['priority'], BreakingPriority::ALLOWED, true ) ? $raw['priority'] : 'standard',
			'label' => $raw['label'] ?: 'Breaking', 'homepageLead' => '1' === $raw['homepageLead'], 'timezone' => wp_timezone_string() );
		foreach ( array( 'startedAt', 'expiresAt' ) as $field ) {
			$date = $raw[ $field ] ? \DateTimeImmutable::createFromFormat( '!Y-m-d H:i:s', $raw[ $field ], new \DateTimeZone( 'UTC' ) ) : false;
			$data[ $field ] = $date ? $date->format( 'Y-m-d\TH:i:s\Z' ) : null;
			$data[ $field . 'Local' ] = $date ? $date->setTimezone( wp_timezone() )->format( 'Y-m-d\TH:i' ) : null;
			$data[ $field . 'Label' ] = $date ? wp_date( 'M j, Y H:i', $date->getTimestamp(), wp_timezone() ) : null;
		}
		return $data;
	}

	public function update( int $id, array $input ) {
		$post = get_post( $id );
		if ( ! $post || 'post' !== $post->post_type || ! in_array( $post->post_status, array( 'draft', 'pending', 'future', 'publish' ), true ) ) {
			return new \WP_Error( 'breaking_not_found', 'Article not found.', array( 'status' => 404 ) );
		}
		$data = array();
		foreach ( array( 'active', 'homepageLead' ) as $field ) {
			if ( array_key_exists( $field, $input ) ) {
				if ( ! is_bool( $input[ $field ] ) ) return $this->invalid( 'Use a boolean for ' . $field . '.' );
				$data[ $field ] = $input[ $field ] ? '1' : '0';
			}
		}
		if ( array_key_exists( 'priority', $input ) ) {
			if ( ! in_array( $input['priority'], BreakingPriority::ALLOWED, true ) ) return $this->invalid( 'Invalid Breaking priority.' );
			$data['priority'] = $input['priority'];
		}
		if ( array_key_exists( 'label', $input ) ) {
			if ( ! is_string( $input['label'] ) ) return $this->invalid( 'Enter a short label.' );
			$label = sanitize_text_field( $input['label'] );
			if ( '' === $label || preg_match_all( '/./us', $label ) > 40 ) return $this->invalid( 'Label must contain 1–40 characters.' );
			$data['label'] = $label;
		}
		if ( array_key_exists( 'expiresAt', $input ) ) {
			$value = $input['expiresAt'];
			$data['expiresAt'] = '';
			if ( null !== $value && '' !== $value ) {
				if ( ! is_string( $value ) ) return $this->invalid( 'Invalid expiry datetime.' );
				$date = false;
				foreach ( array( 'Y-m-d\TH:i', 'Y-m-d\TH:i:s', 'Y-m-d\TH:i:s\Z', DATE_ATOM ) as $format ) {
					$parsed = \DateTimeImmutable::createFromFormat( '!' . $format, $value, 'Y-m-d\TH:i:s\Z' === $format ? new \DateTimeZone( 'UTC' ) : wp_timezone() );
					if ( $parsed && $parsed->format( $format ) === $value ) { $date = $parsed; break; }
				}
				if ( ! $date ) return $this->invalid( 'Invalid expiry datetime. Use site time or an ISO datetime with offset.' );
				$data['expiresAt'] = $date->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
			}
		}
		if ( isset( $input['expiryPreset'] ) ) {
			$preset = $input['expiryPreset'];
			if ( ! in_array( $preset, array( '30', '60', '120', '240', 'end_of_day', 'none' ), true ) ) return $this->invalid( 'Invalid expiry preset.' );
			$now = current_datetime();
			$date = 'end_of_day' === $preset ? $now->setTime( 23, 59, 59 ) : $now->modify( '+' . (int) $preset . ' minutes' );
			$data['expiresAt'] = 'none' === $preset ? '' : $date->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
		}
		$previous = $this->get( $id );
		if ( '1' === ( $data['active'] ?? null ) && ! $previous['active'] ) $data['startedAt'] = gmdate( 'Y-m-d H:i:s' );
		( new BreakingMetadataRepository() )->save( $id, $data );
		return true;
	}

	public function listing( int $limit = 50, ?string $search = null ): array {
		global $wpdb;
		$limit = max( 1, min( 50, $limit ) );
		$meta = function ( string $suffix ) use ( $wpdb ): string {
			return "(SELECT m.meta_value FROM {$wpdb->postmeta} m WHERE m.post_id=p.ID AND m.meta_key='_veridis_breaking_{$suffix}' ORDER BY m.meta_id DESC LIMIT 1)";
		};
		$where = "p.post_type='post' AND p.post_status IN ('publish','future','draft','pending')";
		$where .= ' AND ' . Access::readable_post_sql( 'p' );
		if ( null === $search ) {
			$where .= ' AND ' . $meta( 'active' ) . "='1' AND (COALESCE(" . $meta( 'expires_at' ) . ",'')='' OR " . $meta( 'expires_at' ) . $wpdb->prepare( ' > %s)', gmdate( 'Y-m-d H:i:s' ) );
			$order = 'CASE ' . $meta( 'priority' ) . " WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, " . $meta( 'started_at' ) . ' DESC, p.ID DESC';
		} else {
			$where .= $wpdb->prepare( ' AND p.post_title LIKE %s', '%' . $wpdb->esc_like( $search ) . '%' );
			$order = "FIELD(p.post_status,'publish','future','pending','draft'), p.post_modified DESC, p.ID DESC";
		}
		$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts} p WHERE {$where}" );
		$rows = $wpdb->get_results( "SELECT p.ID,p.post_title,p.post_author,p.post_status,p.post_modified,p.post_date,p.post_excerpt FROM {$wpdb->posts} p WHERE {$where} ORDER BY {$order} LIMIT {$limit}" );
		( new NewsroomRepository() )->prime_related_caches( $rows );
		$formatter = new ArticleFormatter();
		return array( 'items' => array_map( array( $formatter, 'summary' ), $rows ), 'total' => $total, 'limit' => $limit );
	}
	private function invalid( string $message ): \WP_Error {
		return new \WP_Error( 'breaking_invalid', $message, array( 'status' => 400 ) );
	}
}
