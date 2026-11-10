// Reads and checks an app's app.json: the app describes itself as data, and core and the store run nothing of it.
// Exposes READ_SCOPES, manifestProblems, readManifest and cookiesFor. Uses appHooks.mjs and cookieCategories.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { APP_HOOKS } from './appHooks.mjs';
import { isCookieCategory } from './cookieCategories.mjs';

/** @typedef {'pages' | 'pages.text' | 'cookies' | 'apps' | 'csp.allowed'} ReadScope
 * @typedef {import('./cookieCategories.mjs').CookieCategory} CookieCategory
 * @typedef {{ name: string, provider: string, purpose: string, duration: string, category: CookieCategory, when?: { setting: string } }} AppCookieDecl
 * @typedef {{ api: 4, label: string, publisher: string, license: string, thirdParty?: { name: string, license: string, url: string }[],
 *   icon: string, hint: string, description?: string, category?: string, keywords?: string[], version: string,
 *   releaseNotes?: Record<string, string>, screenshots?: { file: string, label: string }[],
 *   settings?: { fields: { name: string, [key: string]: unknown }[], values: Record<string, unknown>, example?: Record<string, unknown> },
 *   lists?: unknown[], kinds?: Record<string, unknown>, cookies?: AppCookieDecl[], csp?: Record<string, string[]>,
 *   reads?: ReadScope[], hooks?: (typeof import('./appHooks.mjs').APP_HOOKS)[number][], afterBuild?: boolean }} AppManifest */

/** What an app may read of the site's data. @type {readonly ReadScope[]} */
export const READ_SCOPES = Object.freeze(['pages', 'pages.text', 'cookies', 'apps', 'csp.allowed']);

const KEYS = [
  'api',
  'label',
  'publisher',
  'license',
  'thirdParty',
  'icon',
  'hint',
  'description',
  'category',
  'keywords',
  'version',
  'releaseNotes',
  'screenshots',
  'settings',
  'lists',
  'kinds',
  'cookies',
  'csp',
  'reads',
  'hooks',
  'afterBuild',
];
const REQUIRED = ['api', 'label', 'publisher', 'license', 'icon', 'hint', 'version'];
const STRINGS = ['label', 'publisher', 'license', 'icon', 'hint', 'description', 'category'];
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;

/** @param {unknown} v @returns {v is Record<string, unknown>} */
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** @param {unknown} v @returns {v is string} */
const isText = (v) => typeof v === 'string' && v.trim() !== '';
/** @param {unknown} v @returns {v is string[]} */
const isTexts = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
/** @param {unknown} v @returns {v is Record<string, string>} */
const isTextMap = (v) => isObject(v) && Object.values(v).every((x) => typeof x === 'string');

/** The problems of an app.json, each one English sentence naming the key; none when it is valid.
 * @param {unknown} manifest The parsed app.json.
 * @param {string[]} files The paths of the files in the app's folder, relative, with `/`.
 * @returns {string[]} */
export function manifestProblems(manifest, files) {
  if (!isObject(manifest)) return ['app.json must be a JSON object.'];
  /** @type {string[]} */
  const problems = [];
  for (const key of Object.keys(manifest)) if (!KEYS.includes(key)) problems.push(`The key "${key}" is not known.`);
  for (const key of REQUIRED) if (!(key in manifest)) problems.push(`The key "${key}" is missing.`);

  if ('api' in manifest && manifest.api !== 4) problems.push('The key "api" must be 4.');
  for (const key of STRINGS) {
    if (key in manifest && !isText(manifest[key])) problems.push(`The key "${key}" must be a non-empty string.`);
  }
  if ('version' in manifest && !(typeof manifest.version === 'string' && SEMVER.test(manifest.version))) {
    problems.push('The key "version" must be a semantic version such as "1.0.0".');
  }
  if ('keywords' in manifest && !isTexts(manifest.keywords)) problems.push('The key "keywords" must be a list of strings.');
  if ('releaseNotes' in manifest && !isTextMap(manifest.releaseNotes)) {
    problems.push('The key "releaseNotes" must map versions to strings.');
  }
  if ('thirdParty' in manifest) {
    const list = manifest.thirdParty;
    const ok = Array.isArray(list) && list.every((x) => isObject(x) && isText(x.name) && isText(x.license) && isText(x.url));
    if (!ok) problems.push('The key "thirdParty" must be a list of objects with the strings name, license and url.');
  }
  if ('screenshots' in manifest) {
    const list = manifest.screenshots;
    if (!(Array.isArray(list) && list.every((x) => isObject(x) && isText(x.file) && typeof x.label === 'string'))) {
      problems.push('The key "screenshots" must be a list of objects with the strings file and label.');
    }
  }
  if ('lists' in manifest && !Array.isArray(manifest.lists)) problems.push('The key "lists" must be a list.');
  if ('kinds' in manifest && !isObject(manifest.kinds)) problems.push('The key "kinds" must be an object.');
  if ('csp' in manifest) {
    const csp = manifest.csp;
    if (!(isObject(csp) && Object.values(csp).every(isTexts))) {
      problems.push('The key "csp" must map each directive to a list of strings.');
    }
  }
  if ('reads' in manifest) {
    const reads = manifest.reads;
    if (!Array.isArray(reads)) problems.push('The key "reads" must be a list of read scopes.');
    else {
      const unknown = reads.filter((r) => !READ_SCOPES.includes(r));
      if (unknown.length) problems.push(`The key "reads" has unknown scopes: ${unknown.map(String).join(', ')}.`);
    }
  }

  /** @type {Set<string> | null} The names of the settings fields, when settings are valid. */
  let fieldNames = null;
  if ('settings' in manifest) {
    const settings = manifest.settings;
    const extra = isObject(settings) ? Object.keys(settings).filter((k) => !['fields', 'values', 'example'].includes(k)) : [];
    const ok =
      isObject(settings) &&
      Array.isArray(settings.fields) &&
      settings.fields.every((f) => isObject(f) && isText(f.name) && isText(f.type)) &&
      isObject(settings.values) &&
      (!('example' in settings) || isObject(settings.example)) &&
      extra.length === 0;
    if (!ok)
      problems.push('The key "settings" must be an object with a list "fields", an object "values" and optionally an object "example".');
    else fieldNames = new Set(settings.fields.map((f) => f.name));
  }

  if ('cookies' in manifest) {
    const cookies = manifest.cookies;
    if (!Array.isArray(cookies)) problems.push('The key "cookies" must be a list.');
    else {
      const seen = new Set();
      cookies.forEach((c, i) => {
        const at = `The key "cookies" entry ${i + 1}`;
        if (!isObject(c)) return problems.push(`${at} must be an object.`);
        for (const key of ['name', 'provider', 'purpose', 'duration']) {
          if (!isText(c[key])) problems.push(`${at} must have a non-empty string "${key}".`);
        }
        if (!isCookieCategory(c.category)) problems.push(`${at} must have a "category" that is one of the cookie categories.`);
        if (typeof c.name === 'string') {
          if (seen.has(c.name)) problems.push(`The key "cookies" has the name "${c.name}" more than once.`);
          seen.add(c.name);
        }
        if ('when' in c) {
          const when = c.when;
          if (!(isObject(when) && isText(when.setting) && Object.keys(when).length === 1)) {
            problems.push(`${at} must have a "when" of the form { "setting": "<field name>" }.`);
          } else if (!fieldNames?.has(when.setting)) {
            problems.push(`${at} has a "when" that names the setting "${when.setting}", which is not a field in "settings".`);
          }
        }
      });
    }
  }

  /** @type {string[]} */
  const known = [];
  if ('hooks' in manifest) {
    const hooks = manifest.hooks;
    if (!isTexts(hooks)) problems.push('The key "hooks" must be a list of strings.');
    else
      for (const hook of hooks) {
        if (!APP_HOOKS.includes(/** @type {any} */ (hook))) problems.push(`The key "hooks" has the unknown hook "${hook}".`);
        else if (!files.includes(`hooks/${hook}.ts`))
          problems.push(`The key "hooks" lists "${hook}", but the file hooks/${hook}.ts is missing.`);
        else known.push(hook);
      }
  }
  const listed = Array.isArray(manifest.hooks) ? manifest.hooks : [];
  for (const file of files.filter((f) => f.startsWith('hooks/'))) {
    const name = file.slice('hooks/'.length).replace(/\.ts$/, '');
    if (!file.endsWith('.ts') || !APP_HOOKS.includes(/** @type {any} */ (name))) {
      problems.push(`The file ${file} is not a known hook.`);
    } else if (!listed.includes(name)) problems.push(`The file ${file} exists, but the key "hooks" does not list "${name}".`);
  }

  if ('afterBuild' in manifest && typeof manifest.afterBuild !== 'boolean') problems.push('The key "afterBuild" must be true or false.');
  else {
    const has = files.includes('after-build.ts');
    if (manifest.afterBuild === true && !has) problems.push('The key "afterBuild" is true, but the file after-build.ts is missing.');
    if (manifest.afterBuild !== true && has) problems.push('The file after-build.ts exists, but the key "afterBuild" is not true.');
  }
  return problems;
}

/** The files in a folder, recursively, as relative paths with `/`. @param {string} dir @param {string} [prefix] @returns {string[]} */
function filesIn(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix + entry.name;
    return entry.isDirectory() ? filesIn(path.join(dir, entry.name), `${rel}/`) : [rel];
  });
}

/** Reads and checks the app.json of an app's folder. `manifest` is null without an app.json, and also when the file
 * has problems, so no caller runs an invalid app.
 * @param {string} dir @returns {{ manifest: AppManifest | null, problems: string[] }} */
export function readManifest(dir) {
  const file = path.join(dir, 'app.json');
  if (!fs.existsSync(file)) return { manifest: null, problems: [] };
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return { manifest: null, problems: [`app.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}.`] };
  }
  const problems = manifestProblems(parsed, filesIn(dir));
  return problems.length ? { manifest: null, problems } : { manifest: parsed, problems };
}

/** The cookies an app sets with its settings as they are: those with a `when` only while that setting has a value.
 * @param {AppManifest} manifest @param {Record<string, unknown>} values @returns {AppCookieDecl[]} */
export function cookiesFor(manifest, values) {
  const filled = (/** @type {unknown} */ v) =>
    !(v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0));
  return (manifest.cookies ?? []).filter((c) => !c.when || filled(values?.[c.when.setting]));
}
