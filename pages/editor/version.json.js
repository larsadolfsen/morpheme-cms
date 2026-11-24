// /editor/version.json: the commit the site was built from, and when (builtAt; the site is online a
// moment after, shown on the editor's start screen). After a save, the editor asks for this
// until it is the saved commit (or a later one), and then says that the site has been updated.
// Cloudflare's builds set WORKERS_CI_COMMIT_SHA; a build elsewhere asks git. `cms` is the installed @morphemecms/cms version (ci-build takes the
// full lane when a build has another); `contracts` the theme and app contracts that CMS reads and `installs` the store items this build replaced that the site's git does not have yet (build-installs.json); the next build's install step (scripts/build-install.mjs) runs when the contracts change or installs are waiting; `editor` is the
// fingerprint of the editor's code (packages/editor/site/editor-version.mjs): an open editor with another one
// reloads itself. `paidBuilds` (src/data/build.json, packages/editor/lib/build-settings.mjs) is how long the editor waits for
// a build before it says it failed: 20 minutes on the free plan, 10 on Workers Paid.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { editorVersion } from '@morphemecms/cms/site/editor-version.mjs';
import pkg from '../../package.json';
import { APP_APIS, THEME_API } from '../../lib/contracts.mjs';
import { BUILD_SETTINGS_PATH, readBuildSettings } from '../../lib/build-settings.mjs';

// From where the build runs, as packages/editor/site/images.mjs (this file is bundled elsewhere first).
const SETTINGS = path.resolve(BUILD_SETTINGS_PATH);

function paidBuilds() {
  try {
    return readBuildSettings(JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))).paidBuilds;
  } catch {
    return readBuildSettings(undefined).paidBuilds;
  }
}

// The store items this build replaced (scripts/build-install.mjs), as { kind, id, version }.
function installs() {
  try {
    const file = JSON.parse(fs.readFileSync(path.resolve('.morpheme/build-installs.json'), 'utf8'));
    return file.installs.map(({ kind, id, version }) => ({ kind, id, version }));
  } catch {
    return [];
  }
}

function head() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function GET() {
  return new Response(
    JSON.stringify({
      commit: process.env.WORKERS_CI_COMMIT_SHA || head(),
      editor: editorVersion(),
      cms: pkg.version,
      contracts: { theme: THEME_API, apps: [...APP_APIS] },
      installs: installs(),
      builtAt: new Date().toISOString(),
      paidBuilds: paidBuilds(),
    }),
  );
}
