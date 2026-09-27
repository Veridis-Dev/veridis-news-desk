=== Veridis News Desk ===
Contributors: veridisdev
Tags: newsroom, editorial workflow, publishing, journalism, editorial calendar
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A Veridis newsroom application inside WordPress admin.

== Description ==

Veridis News Desk provides an integrated newsroom and editorial workflow management layer directly inside WordPress administration.

Current capabilities include:

* Newsroom Overview: Centralized dashboard for monitoring publications, workflow stages, and editorial activity.
* Editorial Statuses: Dedicated stages (Idea, Writing, Review, Ready) mapped seamlessly to WordPress post statuses.
* Assignees & Deadlines: Assign writers and editors, set publication deadlines, and track overdue items.
* Editorial Priorities: Highlight story importance from low to urgent.
* Editorial Board: Visual board workflow for active story management across editorial columns.
* Article Health: Automated checks for editorial readiness, metadata completion, source attribution, and photo credits.
* Follow-ups Management: Track post-publication follow-up tasks, updates, and research leads.
* Editor Mode Integration: Seamless sidebar integration inside the WordPress Block Editor with unsaved-change protection.
* Canonical Article Model: Modern data layer and REST API for consistent editorial metadata retrieval and updates.

= Documentation & Resources =

* Product Overview: https://veridis.dev/products/news-desk/
* Documentation: https://veridis.dev/products/news-desk/docs/
* Support: https://veridis.dev/products/news-desk/support/
* Changelog: https://veridis.dev/products/news-desk/changelog/

= Source Code & Build Instructions =

Veridis News Desk includes compiled and minified JavaScript and CSS bundles in `build/assets/`. The corresponding human-readable React, TypeScript, and CSS source code is publicly accessible at:
https://github.com/Veridis-Dev/veridis-news-desk

Production asset mapping:
* `src/AdminApp/main.tsx` -> `build/assets/app-*.js` and `build/assets/app-*.css` (Newsroom React workspace)
* `src/EditorApp/main.ts` -> `build/assets/editor-*.js` and `build/assets/editor-*.css` (Block Editor sidebar)
* `build/manifest.json` maps hashed Vite asset filenames for WordPress runtime loading

Building from source requires Node.js (>=22.12.0) and npm:

1. Clone repository: git clone https://github.com/Veridis-Dev/veridis-news-desk.git
2. Install dependencies: npm ci
3. Generate production bundles: npm run build

== Installation ==

1. Upload the `veridis-news-desk` folder to the `/wp-content/plugins/` directory, or install the ZIP file via WordPress Admin Plugins -> Add New -> Upload Plugin.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Access the newsroom interface via the 'Veridis News' menu item in the WordPress admin sidebar.

== Frequently Asked Questions ==

= Does Veridis News Desk replace the WordPress editor? =
No. It integrates alongside standard WordPress editing workflows, providing a dedicated Newsroom dashboard and an optional Editor Mode sidebar within the Block Editor.

= Does it modify existing posts? =
No. Veridis News Desk does not replace or rewrite your article title or body content. It stores editorial workflow metadata alongside WordPress posts, while features such as Follow-ups and settings use their own plugin-managed storage.

= What happens to data when the plugin is removed? =
By default, Veridis News Desk preserves all editorial metadata, custom database tables, and settings upon plugin deletion. If you prefer a complete cleanup, you can disable the "Preserve data on uninstall" option in Settings prior to deleting the plugin.

== Changelog ==

= 1.0.0 =
* Added a newsroom Dashboard with publication totals, urgent work, deadline watch, Article Health, and Follow-ups at a glance.
* Added Newsroom List and Board views with search, filters, sorting, pagination, and compact story metadata.
* Added editorial statuses, assignees, priorities, deadlines, and clear overdue and due-today views.
* Added an explicit assignment workflow: ideas may remain unassigned, while active editorial work requires a responsible user.
* Separated the public WordPress author from the current workflow assignee; the first assignee establishes the byline and later reassignment preserves it.
* Added a Story Drawer for reviewing and editing editorial details, sources, Follow-ups, and Article Health actions.
* Added Article Health checks for featured images, excerpts, sources, and photo credits, with workflow-aware fixes.
* Added Follow-ups for tracking callbacks, updates, deadlines, status, and responsibility for each story.
* Added a focused Editor Mode with editorial controls, save protection, and a reliable return to the previous Newsroom context.
* Improved first-run and filtered empty states with clear paths to create the first story.
* Added English and Romanian interface localization through the WordPress user locale.
* Integrated access and assignee eligibility with standard WordPress roles and capabilities.
* Improved narrower-width Board navigation, metadata labels, validation timing, subdirectory URL handling, and other release-candidate interface details.

= 0.9.0 =
* Canonical article model foundation.
* Settings and data-retention controls.
* Newsroom, editorial workflow, board, Follow-ups, Article Health, and Editor Mode foundations.
