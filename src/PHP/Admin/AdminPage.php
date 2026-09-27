<?php
namespace Veridis\NewsDesk\Admin;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Core\Access;

final class AdminPage {
	private $hook = '';

	public function register(): void {
		$this->hook = add_menu_page(
			__( 'Veridis News Desk', 'veridis-news-desk' ),
			__( 'Veridis News', 'veridis-news-desk' ),
			Access::CAPABILITY,
			'veridis-news-desk',
			array( $this, 'render' ),
			'dashicons-media-document',
			26
		);
	}

	public function hook(): string {
		return (string) $this->hook;
	}

	public function render(): void {
		if ( ! Access::allowed() ) {
			wp_die( esc_html__( 'You do not have access to News Desk.', 'veridis-news-desk' ) );
		}
		?>
		<div id="veridis-news-desk-root" class="vnd-app"></div>
		<?php
	}
}
