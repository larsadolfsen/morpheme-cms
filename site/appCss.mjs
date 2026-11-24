// The Vite plugin that scopes an app's CSS (lib/appCss.mjs, docs/superpowers/specs/2026-11-20-scoped-app-css-design.md): every .css file under
// src/apps/<id>/ is rewritten before Vite reads it, on the site and in the editor (both build with this plugin). Only an app written to the contract
// that has it (SCOPED_CSS_FROM_API in app.json's `api`) is scoped; an older one keeps its global CSS. Exposes appCss. Depends on lib/appCss.mjs, postcss.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { APP_CSS_MODE, SCOPED_CSS_FROM_API, collectNames, scopeAppCss } from '../lib/appCss.mjs';

const APP_FILE = /^(.*\/src\/apps\/([^/]+))\/.+\.css$/;

/** The custom properties the CMS's own CSS declares (`cms` folders: the theme's styles and the editor's stylesheets), so an app's `--mo-…` name
 * that the CMS declares is never renamed. @param {string[]} folders */
export function cmsDeclared(folders) {
  const names = new Set();
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.css'))
        try {
          postcss.parse(readFileSync(p, 'utf8')).walkDecls(/^--/, (d) => names.add(d.prop));
        } catch {
          /* a file that does not parse is the build's problem, not ours */
        }
    }
  };
  folders.forEach(walk);
  return names;
}

const cssFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? cssFiles(join(dir, f.name)) : f.name.endsWith('.css') ? [join(dir, f.name)] : [],
  );

/** @param {{ mode?: 'scope' | 'prefix', cms?: string[] }} [options] `cms`: the folders whose CSS declares the CMS's tokens (default: this package's theme/ and src/). @returns {import('vite').Plugin} */
export function appCss({
  mode = APP_CSS_MODE,
  cms = [new URL('../theme/', import.meta.url).pathname, new URL('../src/', import.meta.url).pathname],
} = {}) {
  let cmsNames;
  return {
    name: 'app-css',
    enforce: 'pre',
    transform(code, id) {
      const [file, query = ''] = id.split('?');
      const path = file.replaceAll('\\', '/');
      const m = APP_FILE.exec(path);
      if (!m || /(^|&)(url|raw|worker)(&|$)/.test(query)) return null;
      const [, folder, appId] = m;
      try {
        const manifest = JSON.parse(readFileSync(`${folder}/app.json`, 'utf8'));
        if (!(manifest.api >= SCOPED_CSS_FROM_API)) return null;
      } catch {
        return null; // an app with no app.json is older than contract 4
      }
      cmsNames ??= cmsDeclared(cms);
      const names = collectNames(
        cssFiles(folder).map((f) => (f === file ? code : readFileSync(f, 'utf8'))),
        appId,
        cmsNames,
      );
      return { code: scopeAppCss(code, { id: appId, names, mode }), map: null };
    },
  };
}
