# Veridis News Desk

A WordPress newsroom workflow plugin for editorial teams.

> **Free = Manage stories.** A dedicated, clutter-free newsroom workspace inside WordPress admin to coordinate article ideas, assign responsibilities, track deadlines, and monitor story readiness.

## Overview

News Desk adds a structured editorial workflow inside WordPress admin (`wp-admin`) while preserving core WordPress standards:
- Stories remain native WordPress posts (`post`).
- Native article permalinks, categories, tags, and media attachments remain untouched.
- Native publishing roles and permissions remain fully authoritative.

Editorial workflow metadata (assignments, editorial statuses, internal deadlines, task priorities, sources, and readiness checks) is cleanly layered around normal WordPress posts without altering frontend rendering or locking content into proprietary post formats.

## Features

Public Free 1.0 capabilities:

- **Dashboard**: High-level newsroom overview with real-time story statistics, urgent deadlines, and direct entry points to active work.
- **Newsroom List**: Dense, paginated editorial article table with search, multifaceted filtering (editorial status, WordPress status, author, assignee, category, and health), and multi-column sorting.
- **Newsroom Board / Kanban**: Visual status columns representing editorial stages with drag-and-drop card movement and quick actions.
- **New Story**: Streamlined modal to create early-stage story drafts without leaving the newsroom desk.
- **Story Drawer**: Accessible slide-out panel for fast inspection, assignee management, editorial details, structured notes, and metadata editing.
- **Editorial Workflow**: Four distinct workflow stages: `Idea → Writing → Review → Ready to publish`.
- **Decoupled Roles**: The responsible workflow editor (`Assigned`) is managed separately from the public WordPress author (`byline`).
- **Deadlines & Priorities**: Editorial target dates with date-time picking, quick presets, and clear priority badges (`Standard`, `High`, `Urgent`).
- **Article Health**: Advisory pre-flight checklist evaluating story completeness before publication.
- **Structured Sources**: Track story sources, verification states (`Unverified`, `Contacted`, `Waiting`, `Confirmed`), and internal background notes.
- **Follow-ups**: Integrated callback and task tracker attached to stories to ensure post-publication updates, corrections, and editorial check-ins are never forgotten.
- **Editor Mode**: Seamless block editor sidebar integration allowing journalists to manage editorial metadata directly within the WordPress block editor.
- **Unsaved Changes Protection**: Guard dialogs preventing accidental loss of drafts, notes, or modified editorial metadata.
- **URL State Persistence**: Filters, layouts, searches, and drawer selections persist in the URL for bookmarking, sharing, and native browser navigation.
- **Settings**: Centralized control over plugin data retention and privacy behaviors.
- **Help**: In-app guide and direct access to product documentation, support, and release notes.

## Editorial workflow

The editorial workflow organizes story progression across four standard stages:

1. **Idea**: Early pitch or concept. Stories in this stage may remain `Unassigned`.
2. **Writing**: Active drafting. Moving to Writing requires an assigned editor or writer.
3. **Review**: Editorial review, fact-checking, and copy-editing. Requires an assignee.
4. **Ready to publish**: Editorial sign-off. The article is approved by the editorial desk.

> **Important**: `Ready to publish` is an editorial milestone, not an automated publishing trigger. WordPress still controls actual publishing permissions and scheduling according to native user capabilities.

## Article Health

Article Health is an advisory readiness checklist evaluating four fundamental story components:
- **Featured Image**: Verification that a post thumbnail is set.
- **Excerpt**: Confirmation that an article summary or excerpt is provided.
- **Source**: Record of primary editorial source attribution.
- **Photo Credit**: Credit information for attached imagery.

Article Health assists newsrooms in maintaining publication standards. It is strictly advisory and does not gate or block WordPress publishing actions.

## Requirements

- **WordPress**: 6.5 or higher
- **PHP**: 7.4 or higher
- **Compatibility**: Tested through WordPress 7.1.x (verified on WordPress 7.1.2)
- **Browser**: Modern evergreen browser with ES module and native `<dialog>` support

## Installation

1. Upload the `veridis-news-desk` plugin directory to your WordPress `wp-content/plugins/` directory, or upload the release ZIP in **Plugins → Add New → Upload Plugin**.
2. Activate **Veridis News Desk** in **Plugins → Installed Plugins**.
3. Open **News Desk** from the WordPress admin sidebar.

## Data model

News Desk respects your WordPress database architecture:
- Stories remain standard WordPress `post` records.
- Editorial metadata (editorial status, assignee ID, internal deadline, priority, sources, notes) is stored in standard WordPress post meta using `_veridis_*` keys.
- Plugin configurations are stored in WordPress options (`veridis_news_desk_*`).
- Editorial Follow-ups utilize a dedicated table (`{$wpdb->prefix}veridis_news_followups`) for efficient task indexing and querying.

## Permissions

News Desk integrates directly into the WordPress role and capability model:
- Access to the newsroom desk requires the native `edit_others_posts` capability (typically granted to Editors and Administrators).
- Modifying plugin settings requires the `manage_options` capability (Administrators).
- News Desk never bypasses WordPress authorization or grants publishing capabilities beyond a user's native role.

## Data preservation

- **Deactivation**: Deactivating the plugin is completely non-destructive and leaves all data untouched.
- **Uninstall**: By default, deleting the plugin preserves all editorial metadata, follow-ups, and settings in the database to prevent accidental data loss.
- **Data Cleanup**: To permanently wipe News Desk metadata, follow-ups, and options when uninstalling, disable the preservation option in **News Desk → Settings** prior to deleting the plugin.
- Native WordPress posts, users, categories, tags, and media are never deleted under any circumstances.

## Development and Source Code

Veridis News Desk development source code is publicly accessible on GitHub:
[https://github.com/Veridis-Dev/veridis-news-desk](https://github.com/Veridis-Dev/veridis-news-desk)

Human-readable React, TypeScript, and CSS source files are located in `src/AdminApp/` and `src/EditorApp/`. Production bundles are compiled with Vite:
- `src/AdminApp/main.tsx` -> `build/assets/app-*.js` and `build/assets/app-*.css` (Newsroom React application)
- `src/EditorApp/main.ts` -> `build/assets/editor-*.js` and `build/assets/editor-*.css` (Block Editor sidebar)
- `build/manifest.json` maps hashed Vite asset filenames for WordPress runtime script enqueuing in `Assets.php` and `EditorMode.php`.

Prerequisites: Node.js (>=22.12.0) and npm.

### Setup and Build

```sh
# Install exact dependencies
npm ci

# Typecheck TypeScript source
npm run typecheck

# Build production assets (Vite)
npm run build

# Run unit tests
npm test
```

### Local Dev Server

1. Copy `.env.example` to `.env.local` and define `VND_WP_ORIGIN` matching your local WordPress site URL.
2. In your local `wp-config.php`, configure development constants:
   ```php
   define( 'WP_ENVIRONMENT_TYPE', 'local' );
   define( 'VERIDIS_NEWS_DESK_DEV_SERVER', 'http://localhost:5173' );
   ```
3. Run `npm run dev` to start the Vite HMR server, then access News Desk within your local WordPress admin.

## Documentation and support

- [Product page](https://veridis.dev/products/news-desk/)
- [Documentation](https://veridis.dev/products/news-desk/docs/)
- [Support](https://veridis.dev/products/news-desk/support/)
- [Changelog](https://veridis.dev/products/news-desk/changelog/)

## License

Veridis News Desk is licensed under the [GNU General Public License v2.0 or later](https://www.gnu.org/licenses/gpl-2.0.html).

Bundled Geist fonts are licensed under the [SIL Open Font License 1.1](assets/fonts/geist/OFL.txt).
