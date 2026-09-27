import { existsSync, mkdirSync, readFileSync, rmSync, cpSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT_DIR = resolve(process.cwd());
const PKG_PATH = join(ROOT_DIR, 'package.json');
const DIST_DIR = join(ROOT_DIR, 'dist');
const PLUGIN_SLUG = 'veridis-news-desk';
const STAGING_PARENT = join(DIST_DIR, '.staging');
const STAGING_DIR = join(STAGING_PARENT, PLUGIN_SLUG);

// 1. Read version from package.json
if (!existsSync(PKG_PATH)) {
  console.error('Error: package.json not found at project root.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
const version = pkg.version;
if (!version) {
  console.error('Error: version field missing from package.json.');
  process.exit(1);
}

const ZIP_FILENAME = `${PLUGIN_SLUG}-${version}.zip`;
const ZIP_OUTPUT_PATH = join(DIST_DIR, ZIP_FILENAME);

console.log(`Packaging ${PLUGIN_SLUG} v${version}...`);

// 2. Pre-packaging validation
const requiredSources = [
  'veridis-news-desk.php',
  'uninstall.php',
  'build/manifest.json',
  'src/PHP',
  'languages',
  'assets/fonts/geist/OFL.txt',
];

for (const source of requiredSources) {
  if (!existsSync(join(ROOT_DIR, source))) {
    console.error(`Error: Required source "${source}" does not exist. Run npm run build first.`);
    process.exit(1);
  }
}

// 3. Reset staging and output directories
if (existsSync(STAGING_PARENT)) {
  rmSync(STAGING_PARENT, { recursive: true, force: true });
}
if (existsSync(ZIP_OUTPUT_PATH)) {
  rmSync(ZIP_OUTPUT_PATH, { force: true });
}

mkdirSync(STAGING_DIR, { recursive: true });

// 4. Copy allowlisted runtime files & directories

// Root files
cpSync(join(ROOT_DIR, 'veridis-news-desk.php'), join(STAGING_DIR, 'veridis-news-desk.php'));
cpSync(join(ROOT_DIR, 'uninstall.php'), join(STAGING_DIR, 'uninstall.php'));

if (existsSync(join(ROOT_DIR, 'readme.txt'))) {
  cpSync(join(ROOT_DIR, 'readme.txt'), join(STAGING_DIR, 'readme.txt'));
}

// Font license
mkdirSync(join(STAGING_DIR, 'assets/fonts/geist'), { recursive: true });
cpSync(
  join(ROOT_DIR, 'assets/fonts/geist/OFL.txt'),
  join(STAGING_DIR, 'assets/fonts/geist/OFL.txt')
);

// Languages directory (only include POT catalog template; exclude locale-specific .po, .mo, and JSON translation files)
mkdirSync(join(STAGING_DIR, 'languages'), { recursive: true });
cpSync(join(ROOT_DIR, 'languages'), join(STAGING_DIR, 'languages'), {
  recursive: true,
  filter: (src) => {
    const rel = relative(ROOT_DIR, src).replaceAll('\\', '/');
    if (rel === 'languages') {
      return true;
    }
    return rel.endsWith('.pot');
  },
});

// src/PHP directory (excluding src/PHP/Dev)
cpSync(join(ROOT_DIR, 'src/PHP'), join(STAGING_DIR, 'src/PHP'), {
  recursive: true,
  filter: (src) => {
    const rel = relative(ROOT_DIR, src).replaceAll('\\', '/');
    if (rel === 'src/PHP/Dev' || rel.startsWith('src/PHP/Dev/')) {
      return false;
    }
    return true;
  },
});

// build directory (including manifest.json and compiled assets, excluding build/i18n-map.json)
cpSync(join(ROOT_DIR, 'build'), join(STAGING_DIR, 'build'), {
  recursive: true,
  filter: (src) => {
    const rel = relative(ROOT_DIR, src).replaceAll('\\', '/');
    if (rel === 'build/i18n-map.json') {
      return false;
    }
    return true;
  },
});

// 5. Post-staging verification
const forbiddenPatterns = [
  'node_modules',
  'tests',
  'src/AdminApp',
  'src/EditorApp',
  'src/PHP/Dev',
  'build/i18n-map.json',
  '.git',
  '.github',
  '.i18n-cache',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'babel.i18n.config.cjs',
  'README.md',
  'BREAKING-V0.1.md',
];

for (const pattern of forbiddenPatterns) {
  if (existsSync(join(STAGING_DIR, pattern))) {
    console.error(`Packaging verification failed: Forbidden path "${pattern}" leaked into staging.`);
    rmSync(STAGING_PARENT, { recursive: true, force: true });
    process.exit(1);
  }
}

// Verify that languages staging contains only POT catalog files and no locale artifacts
const languagesStagingDir = join(STAGING_DIR, 'languages');
if (existsSync(languagesStagingDir)) {
  const stagedLangFiles = readdirSync(languagesStagingDir);
  for (const file of stagedLangFiles) {
    if (file.endsWith('.po') || file.endsWith('.mo') || file.endsWith('.json')) {
      console.error(`Packaging verification failed: Locale translation artifact "${file}" leaked into staging languages.`);
      rmSync(STAGING_PARENT, { recursive: true, force: true });
      process.exit(1);
    }
  }
}

// 6. Create production ZIP archive
try {
  execFileSync('zip', ['-r', '-q', ZIP_OUTPUT_PATH, PLUGIN_SLUG], {
    cwd: STAGING_PARENT,
    stdio: 'inherit',
  });
} catch (error) {
  console.error('Error executing system "zip" command:', error.message);
  rmSync(STAGING_PARENT, { recursive: true, force: true });
  process.exit(1);
}

// 7. Cleanup staging directory
rmSync(STAGING_PARENT, { recursive: true, force: true });

const stats = statSync(ZIP_OUTPUT_PATH);
const sizeKb = (stats.size / 1024).toFixed(2);

console.log(`Success! Package created at dist/${ZIP_FILENAME} (${sizeKb} KB)`);
