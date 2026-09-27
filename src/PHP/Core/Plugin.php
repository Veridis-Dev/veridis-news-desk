<?php
namespace Veridis\NewsDesk\Core;

defined( 'ABSPATH' ) || exit;

use Veridis\NewsDesk\Admin\AdminPage;
use Veridis\NewsDesk\Admin\Assets;
use Veridis\NewsDesk\Dev\DemoCommand;
use Veridis\NewsDesk\REST\ArticleController;
use Veridis\NewsDesk\REST\DashboardController;
use Veridis\NewsDesk\REST\NewsroomController;

final class Plugin {
	public function boot(): void {
		$page = new AdminPage();
		add_action( 'admin_menu', array( $page, 'register' ) );
		add_action( 'admin_enqueue_scripts', array( new Assets( $page ), 'enqueue' ) );
		add_action( 'rest_api_init', array( new DashboardController(), 'register' ) );
		add_action( 'rest_api_init', array( new NewsroomController(), 'register' ) );
		add_action( 'rest_api_init', array( new ArticleController(), 'register' ) );
		add_action( 'rest_api_init', array( new \Veridis\NewsDesk\REST\BreakingController(), 'register' ) );
		add_action( 'rest_api_init', array( new \Veridis\NewsDesk\REST\FollowUpController(), 'register' ) );
		add_action( 'rest_api_init', array( new \Veridis\NewsDesk\REST\SettingsController(), 'register' ) );
		\Veridis\NewsDesk\FollowUps\FollowUpInstaller::maybe_install();
		( new \Veridis\NewsDesk\Admin\EditorMode() )->register();
		require_once VERIDIS_NEWS_DESK_PATH . 'src/PHP/Canonical/api.php';
		( new \Veridis\NewsDesk\Canonical\CanonicalBootstrap() )->register();
		if ( defined( 'WP_CLI' ) && WP_CLI && class_exists( DemoCommand::class ) ) {
			\WP_CLI::add_command( 'veridis-news', new DemoCommand() );
		}
	}
}
