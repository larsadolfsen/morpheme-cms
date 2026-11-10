// The colours of one page, for the theme (Base.astro, which knows no app by name): the site's own (src/data/colors.json,
// "Colors"), changed by the active apps (installed, not turned off) that change a page's colours (hooks/page-colors.ts, PageColorsHook in
// @morphemecms/cms/lib/hooks.ts), in the order of their ids, each given the colours the one before left. An app gets the
// page's address, its pictures, its own settings, the colours' roles, and the pixels of a picture read small, so it
// never reads the site's files itself; what it gives is kept only when it is the site's colours, by their names, and
// readable in both modes (colorPairs); else, and when it fails, the page keeps the colours it had, and the build says so.
// An app with an app.json (contract 4) runs its hook in the build sandbox (lib/sandboxHooks.mjs), with the same input
// and helpers as data, and what goes wrong is a problem in dist/_apps/_problems.json (lib/appProblems.mjs).
// Made while the site is built, so the page needs no script. With them, the app whose colours the page has and the
// picture they came from (the last it read before it gave them), which the page keeps beside its colours (Base.astro)
// for "Colors" › "Pages" in the editor (packages/editor/scripts/page-colors.mjs).
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import colors from '@data/colors.json';
import { colorFields, colorPairs, colorRoles } from '@site/colors';
import { active, settingsOf } from './apps';
import { appIdOf, type AppDefinition } from '@morphemecms/cms/src/apps';
import { colorProblems, lowContrast, MODES, type Colors } from '@morphemecms/cms/lib/colors';
import { completeColors } from '@morphemecms/cms/lib/dynamic-colors';
import { pageColorsOutputProblems, type PageColorsHook } from '@morphemecms/cms/lib/hooks';
import oldHooks from 'virtual:old-page-colors';
import { buildProblems } from '@morphemecms/cms/lib/appProblems.mjs';
import { pageColorsHooks } from '@morphemecms/cms/lib/sandboxHooks.mjs';
import { splitPicture } from '@morphemecms/cms/lib/crop.mjs';

// With those a file written before them does not have made (completeColors).
const site = completeColors(colors as Colors, colorRoles);
const PUBLIC = path.resolve('public');
const names = colorFields.map((f) => f.name);
// Small is enough to find a picture's colours, and quick.
const SIZE = 128;

// Only the apps' index.ts (for their settings) and the hooks of those without an app.json, of the apps installed. A hook of
// a contract 4 app is never imported here: its code is not run outside the sandbox.
const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });

// A picture's pixels, by its address; the same picture is read once in a build.
const read = new Map<string, Promise<Uint8ClampedArray | undefined>>();

/** A picture on the site made small, as RGBA bytes; undefined for one outside public/ or one that cannot be read. */
function pixels(address: string): Promise<Uint8ClampedArray | undefined> {
  if (!read.has(address))
    read.set(
      address,
      (async () => {
        const file = path.join(PUBLIC, decodeURI(splitPicture(address).src));
        if (!file.startsWith(PUBLIC + path.sep)) return undefined;
        try {
          const { data } = await sharp(await fs.readFile(file))
            .resize(SIZE, SIZE, { fit: 'inside' })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          return new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
        } catch {
          return undefined;
        }
      })(),
    );
  return read.get(address)!;
}

const readable = (c: Colors) => MODES.every((mode) => !lowContrast(c[mode], colorPairs).length);

// An app's colours that cannot be used are said once a build, by the app.
const said = new Set<string>();
const say = (id: string, why: string) => {
  if (!said.has(id)) console.warn(`[${id}] hooks/page-colors.ts: ${why}; the pages keep their colors.`);
  said.add(id);
};

/** What is wrong with the colours a sandboxed hook gave: the shape first, then that they can be read; [] when none. */
function sandboxedProblems(value: unknown): string[] {
  const wrong = pageColorsOutputProblems(value, names);
  if (wrong.length || value === undefined) return wrong;
  const { light, dark } = value as Colors;
  return readable({ light, dark }) ? [] : ['The colors are hard to read in light or dark mode.'];
}

// The apps with a hook for a page's colours, in the order of their ids: those without an app.json, as before (loaded
// at the first page), and those with one, run in the sandbox (loaded only when an app has the hook, inside pageColorsHooks).
const sandbox = pageColorsHooks({ root: process.cwd(), active, problems: buildProblems(), check: sandboxedProblems });
let loaded: Promise<{ id: string; hook?: PageColorsHook; settings: Record<string, any>; sandboxed: boolean }[]> | undefined;
const hooksOfApps = () =>
  (loaded ??= (async () => {
    const old = await Promise.all(
      Object.entries(oldHooks)
        .filter(([id]) => active.includes(id))
        .map(async ([id, load]) => ({
          id,
          hook: ((await load()) as { default: PageColorsHook }).default,
          settings: settingsOf(id, Object.entries(appFiles).find(([f]) => appIdOf(f) === id)?.[1].default.settings?.values),
          sandboxed: false,
        })),
    );
    return [...old, ...sandbox.apps.map((app) => ({ ...app, settings: app.settings as Record<string, any>, sandboxed: true }))].sort(
      (a, b) => a.id.localeCompare(b.id),
    );
  })());

/** The page's colours, and where they came from when an app changed them: the app (its id) and the picture they were
 * made from (the last it read before it gave them). */
export type PageColors = { colors: Colors; app?: string; picture?: string };

/** The page's colours: the site's, as the apps installed change them for the page at `path` with `pictures` (their
 * addresses on the site, in the order they are on it, then the one it is shared with). */
export async function pageColors(page: { path: string; pictures: (string | undefined)[] }): Promise<PageColors> {
  const pictures = page.pictures.filter((p): p is string => !!p);
  let found: PageColors = { colors: site };
  for (const { id, hook, settings, sandboxed } of await hooksOfApps()) {
    let made: Colors | undefined;
    // The last picture the app read, the one its colours are from.
    let last: string | undefined;
    const reading = (picture: string) => {
      last = picture;
      return pixels(picture);
    };
    try {
      if (sandboxed) {
        // Only data goes in; the helpers are the only way out. A failed run is a problem, kept in the build's list.
        const input = { path: page.path, colors: found.colors, pictures, settings, roles: colorRoles };
        made = (await sandbox.run(id, page.path, input, { pixels: reading, readable })) as Colors | undefined;
        if (made) {
          found = { colors: { light: pick(made.light), dark: pick(made.dark) }, app: id, picture: last };
        }
        continue;
      }
      made = await hook!({ path: page.path, colors: found.colors, pictures, settings, roles: colorRoles, pixels: reading, readable });
    } catch (e) {
      say(id, `error (${(e as Error).message})`);
      continue;
    }
    if (!made) continue;
    // Only the site's colours, by their names, and readable; nothing else of what it gave.
    const kept = { light: made.light, dark: made.dark };
    if (colorProblems(kept, names).length) say(id, "the colors are not the site's");
    else if (!readable(kept)) say(id, 'the colors are hard to read');
    else found = { colors: { light: pick(kept.light), dark: pick(kept.dark) }, app: id, picture: last };
  }
  return found;
}

const pick = (set: Record<string, string>) => Object.fromEntries(names.map((n) => [n, set[n]]));
