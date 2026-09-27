import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

function wordpressI18nMap(): Plugin {
  return {
    name: 'veridis-news-wordpress-i18n-map',
    apply: 'build',
    closeBundle() {
      const manifest = JSON.parse(readFileSync('build/manifest.json', 'utf8')) as Record<string, { file: string }>;
      const appEntry = manifest['src/AdminApp/main.tsx']?.file;
      const editorEntry = manifest['src/EditorApp/main.ts']?.file;
      if (!appEntry) throw new Error('The AdminApp Vite entry is missing from build/manifest.json.');

      const mapEntries: [string, string][] = [];
      const visit = (directory: string, builtFile: string) => {
        for (const name of readdirSync(directory)) {
          const absolute = join(directory, name);
          if (statSync(absolute).isDirectory()) visit(absolute, builtFile);
          else if (/\.tsx?$/.test(name)) mapEntries.push([relative(process.cwd(), absolute).replaceAll('\\', '/'), `build/${builtFile}`]);
        }
      };
      visit('src/AdminApp', appEntry);
      if (editorEntry) {
        visit('src/EditorApp', editorEntry);
      }
      writeFileSync(
        'build/i18n-map.json',
        `${JSON.stringify(Object.fromEntries(mapEntries), null, 2)}\n`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), wordpressI18nMap()],
    resolve: {
      alias: {
        '@wordpress/i18n': fileURLToPath(new URL('./src/AdminApp/wordpress-i18n.ts', import.meta.url)),
      },
    },
    base: './',
    server: {
      host: '127.0.0.1', port: 5173, strictPort: true,
      origin: env.VND_DEV_ORIGIN || 'http://localhost:5173',
      cors: { origin: env.VND_WP_ORIGIN || 'http://veridis.local' },
    },
    build: {
      outDir: 'build', emptyOutDir: true, manifest: 'manifest.json',
      rollupOptions: {
        input: {
          app: 'src/AdminApp/main.tsx',
          editor: 'src/EditorApp/main.ts',
        },
      },
    },
  };
});
