// What this site's pages may load from elsewhere, besides what the editor's package allows on every site (the
// videos, packages/editor/lib/csp.mjs, which writes the policy into the pages): what each installed app needs
// (src/apps/<app>/csp.json, src/data/apps.json), Google Analytics, Google Ads and Google Tag Manager too, which load
// Google's tag once the visitor has said yes (src/scripts/tracking.ts), and the addresses allowed in the editor after
// the policy stopped them (src/data/csp.json, config.csp: the app "Cookiescanner"'s "Blokeret adresse").
// Read by the build (packages/editor/astro.mjs) and by npm run check:content (appCspProblems), so no TypeScript here.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { activeOf, readAppsFile } from '../lib/appsFile.mjs';
import { allows, sourcesProblems } from '../lib/csp.mjs';

// The site's src/, from its root (the working directory).
const SRC = pathToFileURL(`${process.cwd()}/src/`);

const json = (file) => JSON.parse(readFileSync(new URL(file, SRC), 'utf8'));

const appSources = (app) => {
  const file = new URL(`apps/${app}/csp.json`, SRC);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
};

// The addresses allowed in the editor (config.csp), as an app's csp.json.
const ALLOWED = new URL('data/csp.json', SRC);
const allowedSources = () => (existsSync(ALLOWED) ? JSON.parse(readFileSync(ALLOWED, 'utf8')) : {});

/** What the site's active apps (installed, not turned off) load from elsewhere, and the addresses allowed in the editor.
 * @returns {import('../lib/csp.mjs').Sources[]} */
export function siteSources() {
  return [...activeOf(readAppsFile(readFileSync(new URL('data/apps.json', SRC), 'utf8'))).map(appSources), allowedSources()];
}

/** What is wrong with the addresses allowed in the editor (src/data/csp.json): not JSON, or not written as an app's
 * csp.json must be (npm run check:content). */
export function allowedCspProblems() {
  try {
    return sourcesProblems(allowedSources(), 'src/data/csp.json');
  } catch {
    return ['src/data/csp.json: is not JSON.'];
  }
}

// A line of code that loads from an address (not a link to it): a script's or a frame's src, fetch, import …
const LOADS = /\bsrc\b|\bsrcset\b|\bfetch\(|\bimport\(|\bsendBeacon\(|\bEventSource\(|\bWebSocket\(|\bXMLHttpRequest\b/;
const ADDRESS = /https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
// An app's files that do not run in a browser on the site: its part of the Worker and its step after the build
// (packages/editor/lib/apps.mjs).
const OFF_SITE = new Set(['worker.js', 'build.mjs']);

/** What is wrong with what the apps (all of them, installed or not) say they load from elsewhere: a csp.json not
 * written as it must be, or an address the app's code on the site loads from that its csp.json does not have (npm run
 * check:content). */
export function appCspProblems() {
  const apps = new URL('apps/', SRC);
  if (!existsSync(apps)) return [];
  return readdirSync(apps, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap(({ name: app }) => {
      const dir = `src/apps/${app}`;
      let sources;
      try {
        sources = appSources(app);
      } catch {
        return [`${dir}/csp.json: is not JSON.`];
      }
      const problems = sourcesProblems(sources, `${dir}/csp.json`);
      if (problems.length) return problems;
      const missing = new Set();
      for (const file of readdirSync(new URL(`${app}/`, apps), { recursive: true, encoding: 'utf8' }))
        if (/\.(tsx?|mjs|js|astro)$/.test(file) && !OFF_SITE.has(file))
          for (const line of readFileSync(new URL(`${app}/${file}`, apps), 'utf8').split('\n'))
            if (LOADS.test(line)) for (const [url] of line.matchAll(ADDRESS)) if (!allows(sources, url)) missing.add(new URL(url).origin);
      return [...missing].map(
        (origin) => `${dir}: loads from ${origin}, but csp.json does not list it, so the pages\' Content-Security-Policy blocks it.`,
      );
    });
}
