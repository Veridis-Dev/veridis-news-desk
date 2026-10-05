=== Veridis News Desk – Editorial Workflow & Newsroom ===
Contributors: veridisdev
Tags: editorial workflow, newsroom, content planning, editorial calendar, workflow
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A newsroom and editorial workflow for managing stories, assignments, deadlines, sources, follow-ups, and publishing readiness in WordPress.

== Description ==

Veridis News Desk adds a newsroom and editorial workflow layer to WordPress for teams managing stories from idea through review and publishing readiness.

Plan and track stories, assign editors or writers, manage deadlines and priorities, verify sources, record follow-ups, and monitor editorial readiness without replacing the native WordPress editor.

= Built for editorial teams and newsrooms =

Veridis News Desk is designed for:

* Newsrooms coordinating stories across reporters and editors.
* Editorial teams managing assignments, deadlines, sources, and review stages.
* Online publications planning work from the first idea through publishing readiness.
* Multi-author WordPress sites that need a shared view of responsibility and progress.
* Content teams tracking priorities, follow-ups, and article readiness in one place.

= A newsroom workflow around WordPress posts =

Stories remain native WordPress posts, and teams continue writing and editing in Gutenberg. Veridis News Desk adds the planning and coordination layer around that familiar publishing process, helping teams organize editorial work before publication without replacing the WordPress editor.

Editorial assignments are separate from the WordPress author or public byline. An assignee identifies the editor or writer currently responsible for moving a story forward, while the WordPress author identifies post authorship; the two roles remain distinct editorial concepts.

“Ready to publish” is an editorial workflow state. It signals that the newsroom considers a story ready for the next publishing decision, but it does not publish the post or bypass WordPress permissions, scheduling, or review.

= Main editorial capabilities =

* Dashboard: See active stories, deadlines, follow-ups, and items that need editorial attention at a glance.
* Newsroom List: Search, filter, sort, and review story assignments, stages, priorities, and readiness in a focused list.
* Board / Kanban: Move stories through Idea, Writing, Review, and Ready to publish in a visual workflow.
* Story assignment: Give an editor or writer clear responsibility while keeping the assignment distinct from the WordPress author or byline.
* Deadlines and priorities: Set target dates, identify urgent work, and spot overdue stories.
* Editorial stages: Track each story from the initial idea through drafting, review, and publishing readiness.
* Structured source tracking: Record sources and their verification status alongside each story.
* Follow-ups: Keep callbacks, research tasks, updates, and post-publication actions connected to the relevant story.
* Article readiness: Check featured images, excerpts, source information, and photo credits before publication.
* Gutenberg Editor Mode: Review and update editorial details from the native WordPress Block Editor while working on the post.

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
No. It works alongside Gutenberg and standard WordPress publishing. The Newsroom organizes editorial planning and coordination, while the native WordPress editor remains the place where teams write and edit post content.

= Does Ready to publish publish the post? =
No. Ready to publish is an editorial workflow state only. Publishing and scheduling remain controlled by WordPress and the user's existing permissions.

= Is the story assignee the same as the WordPress author? =
No. The assignee identifies who is currently responsible for the editorial work. The WordPress author identifies post authorship and the public byline; the two roles are distinct.

= Does it modify existing posts? =
No. Veridis News Desk does not replace or rewrite your article title or body content. It adds editorial workflow information around your existing WordPress posts.

= What happens to data when the plugin is removed? =
By default, Veridis News Desk preserves all editorial metadata, custom database tables, and settings upon plugin deletion. If you prefer a complete cleanup, you can disable the "Preserve data on uninstall" option in Settings prior to deleting the plugin.

== Screenshots ==

1. Newsroom Dashboard with publishing activity, deadlines, Article Health, and follow-ups at a glance.
2. Newsroom List for reviewing stories, assignments, priorities, deadlines, and editorial readiness.
3. Editorial Board with stories organized across Idea, Writing, Review, and Ready to publish.
4. Story Drawer with editorial details, sources, internal notes, follow-ups, and Article Health.
5. Editor Mode brings assignment, deadline, priority, and workflow controls into the WordPress Block Editor.
6. Follow-ups workspace for tracking callbacks, story developments, deadlines, and editorial revisits.
7. New Story workflow with category, editorial status, assignee, priority, and optional deadline.

== Changelog ==

= 1.0.1 =
* Fixed mobile dashboard story rows collapsing at narrow screen widths.
* Improved responsive layout for story metadata and badges in the WordPress admin.

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
