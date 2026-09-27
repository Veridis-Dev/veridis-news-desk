<?php
namespace Veridis\NewsDesk\Core;

defined( 'ABSPATH' ) || exit;

final class Access {
	// Shared by the menu and API. Editors and administrators have this by default.
	public const CAPABILITY = 'edit_others_posts';

	public static function allowed(): bool {
		return current_user_can( self::CAPABILITY );
	}

	/** Match the individual article read policy for every collection query. */
	public static function can_read_post( int $post_id ): bool {
		$post = get_post( $post_id );
		return self::allowed()
			&& $post
			&& 'post' === $post->post_type
			&& in_array( $post->post_status, \Veridis\NewsDesk\Newsroom\WordPressStatus::ALLOWED, true )
			&& current_user_can( 'edit_post', $post_id );
	}

	/** @return int[] IDs authorized for the current user, cached until posts change. */
	public static function readable_post_ids(): array {
		return self::readable_post_sets()['allowed'];
	}

	/** @return array{allowed:int[],denied:int[]} */
	private static function readable_post_sets(): array {
		static $cache = array();
		$user = wp_get_current_user();
		$custom_caps = self::has_custom_capability_filters();
		$key = get_current_user_id() . ':' . md5( serialize( $user->allcaps ) ) . ':' . (string) wp_cache_get( 'last_changed', 'posts' );
		if ( ! $custom_caps && isset( $cache[ $key ] ) ) {
			return $cache[ $key ];
		}

		if ( ! self::allowed() ) {
			$empty = array( 'allowed' => array(), 'denied' => array() );
			return $custom_caps ? $empty : ( $cache[ $key ] = $empty );
		}

		global $wpdb;
		$statuses = "'" . implode( "','", \Veridis\NewsDesk\Newsroom\WordPressStatus::ALLOWED ) . "'";
		$posts = $wpdb->get_results( "SELECT ID, post_status, post_author FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status IN ({$statuses})" ) ?: array();
		$allowed = array();
		$denied  = array();
		// For ordinary posts, WordPress maps edit_post to edit_others_posts and,
		// for published/scheduled posts, edit_published_posts. Respect custom
		// capability filters by checking each object through WordPress instead.
		$can_edit_published = ! $custom_caps && current_user_can( 'edit_published_posts' );
		$can_edit_own_draft = ! $custom_caps && current_user_can( 'edit_posts' );
		$user_id = get_current_user_id();
		foreach ( $posts as $post ) {
			$id = (int) $post->ID;
			$is_published = in_array( $post->post_status, array( 'publish', 'future' ), true );
			$is_own = (int) $post->post_author > 0 && $user_id === (int) $post->post_author;
			$can_edit = $custom_caps
				? current_user_can( 'edit_post', $id )
				: ( $is_published ? $can_edit_published : ( ! $is_own || $can_edit_own_draft ) );
			if ( $can_edit ) {
				$allowed[] = $id;
			} else {
				$denied[] = $id;
			}
		}
		$sets = array( 'allowed' => $allowed, 'denied' => $denied );
		return $custom_caps ? $sets : ( $cache[ $key ] = $sets );
	}

	/** WordPress core's user_has_cap callbacks only grant unrelated site/admin caps. */
	private static function has_custom_capability_filters(): bool {
		global $wp_filter;
		if ( has_filter( 'map_meta_cap' ) ) {
			return true;
		}
		$core_callbacks = array( 'wp_maybe_grant_install_languages_cap', 'wp_maybe_grant_resume_extensions_caps', 'wp_maybe_grant_site_health_caps' );
		if ( ! isset( $wp_filter['user_has_cap'] ) ) {
			return false;
		}
		foreach ( $wp_filter['user_has_cap']->callbacks as $callbacks ) {
			foreach ( array_keys( $callbacks ) as $callback ) {
				if ( ! in_array( $callback, $core_callbacks, true ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/** SQL clause for a post table alias; all IDs are integers from WordPress. */
	public static function readable_post_sql( string $alias ): string {
		$sets = self::readable_post_sets();
		if ( ! $sets['allowed'] ) {
			return '1=0';
		}
		$statuses = "'" . implode( "','", \Veridis\NewsDesk\Newsroom\WordPressStatus::ALLOWED ) . "'";
		$scope = "{$alias}.post_type = 'post' AND {$alias}.post_status IN ({$statuses})";
		if ( count( $sets['denied'] ) < count( $sets['allowed'] ) ) {
			return $scope . ( $sets['denied'] ? " AND {$alias}.ID NOT IN (" . implode( ',', $sets['denied'] ) . ')' : '' );
		}
		return $scope . " AND {$alias}.ID IN (" . implode( ',', $sets['allowed'] ) . ')';
	}
}
