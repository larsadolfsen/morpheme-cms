#!/usr/bin/env node
// The CMS's commands for a site, run from the site's root (its package.json's scripts): `morpheme <command> [args]`.
// Each runs this package's scripts (scripts/) in turn, on the site in the working directory, and stops at the first that
// fails.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const COMMANDS = {
  /** Before the site is built or served: the images' smaller sizes and the videos' stills. */
  images: ['responsive-images', 'video-thumbnails'],
  /** After the site is built: what the Worker and the editor read from dist/. */
  'after-build': ['scheduled-list', 'link-counts', 'page-colors'],
  /** The Cloudflare build command: the content lane or the full lane, then the build. */
  'ci-build': ['ci-build'],
  'check:content': ['check-content'],
  /** Rewrites pages and posts that use blocks from before to the form the editor writes (idempotent; --check only lists). */
  migrate: ['migrate'],
  'check:editor': ['editor-roundtrip'],
  'check:worker': [
    'check-worker',
    'check-consent',
    'check-dashboard',
    'check-settings',
    'check-cms-update',
    'check-release-post',
    'check-store',
    'check-store-connection',
  ],
  'check:screens': ['editor-screens'],
  'check:preview': ['check-preview'],
  'check:themes': ['check-themes'],
  'check:contrast': ['check-contrast'],
  'check:demo': ['check-demo'],
  'compare-html': ['compare-html'],
  'app-workers': ['app-workers'],
  'app-screenshots': ['app-screenshots'],
  'theme-screenshots': ['theme-screenshots'],
  'editor-icons': ['editor-icons'],
  /** In a new site, once: lays i18n/<code>/ over the site, sets its locale and deletes i18n/. */
  locale: ['locale'],
};

// Node warns that node:sqlite is experimental, which the consent log's check uses as D1.
const QUIET = new Set(['check-consent', 'check-store-connection']);

const [command, ...args] = process.argv.slice(2);
if (!COMMANDS[command]) {
  console.error(`Brug: morpheme <kommando> […], hvor kommandoen er en af: ${Object.keys(COMMANDS).join(', ')}.`);
  process.exit(1);
}
for (const script of COMMANDS[command]) {
  const file = fileURLToPath(new URL(`../scripts/${script}.mjs`, import.meta.url));
  const { status } = spawnSync(process.execPath, [...(QUIET.has(script) ? ['--no-warnings'] : []), file, ...args], { stdio: 'inherit' });
  if (status !== 0) process.exit(status ?? 1);
}
