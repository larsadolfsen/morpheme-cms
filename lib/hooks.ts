// The places where an app may change how the site does something of its own, rather than add to it (a block, a kind,
// a list, its code on every page): each a file in the app's folder, hooks/<place>.ts, whose default export the site's
// build runs, while the app is installed, for every page. The site gives it what it needs to know and the tools it may
// use, and keeps what it gives back only when it is right; an app reaches nothing of the site but that. Before an app
// is installed, its page says what it changes ("Permissions", needsOf in src/store.ts, from the files in hooks/).
//   page-colors  the colours of a page (PageColorsHook): given the page's colours so far (the site's, "Colors", or those
//                of an app before it), its pictures and the app's settings, it gives the page other colours, or none.
//                The site runs it in packages/editor/site/pageColors.ts, which a theme calls for every page (Base.astro).
//                Its helper contentColors makes the colours from a picture (the engine runs in the build, lib/contentColors.ts).
// No React, browser or Node here: the editor, the build and the check before it use it.
// ./colors.ts has its extension so Node's test runner can load this file.
import { colorProblems, MODES, type Colors } from './colors.ts';
import type { ColorRoles, ContentBased } from './dynamic-colors';
import { APP_HOOKS } from './appHooks.mjs';

/** The places an app may change the site, by the name of their file in its hooks/ (without .ts). */
export { APP_HOOKS };
export type AppHook = (typeof APP_HOOKS)[number];

/** The places an app changes, from the paths of the files in its folder (hooks/page-colors.ts: 'page-colors'), and
 * the files there that are no such place. */
export function hooksOf(files: string[]): { hooks: AppHook[]; unknown: string[] } {
  const there = files.filter((f) => f.startsWith('hooks/'));
  const name = (f: string) => f.slice('hooks/'.length).replace(/\.ts$/, '');
  return {
    hooks: APP_HOOKS.filter((h) => there.includes(`hooks/${h}.ts`)),
    unknown: there.filter((f) => !f.endsWith('.ts') || !(APP_HOOKS as readonly string[]).includes(name(f))),
  };
}

/** What the site gives an app's hook for a page's colours. */
export type PageColorsPage = {
  /** The page's address on the site ("/om-mig/"). */
  path: string;
  /** The page's colours so far: the site's own, or those an app before it gave. */
  colors: Colors;
  /** The page's pictures, in the order they are on it (its own first, then those in its text and blocks), and last
   * the one it is shared with; their addresses on the site. */
  pictures: string[];
  /** The app's settings, as saved in the editor over those it starts with. */
  settings: Record<string, any>;
  /** The role each of the site's colours takes in a Material 3 scheme (colorRoles), for dynamicColors. */
  roles: ColorRoles;
  /** A picture's pixels as RGBA bytes, made small (at most 128 px), as sourceColorsOf takes them; undefined for one
   * that cannot be read. */
  pixels: (picture: string) => Promise<Uint8ClampedArray | undefined>;
  /** Whether the text in colours can be read on its background in both modes, as the site requires (WCAG AA). */
  readable: (colors: Colors) => boolean;
  /** The colours of the site made from one of the page's pictures, by Material's content-based colour (the engine,
   * lib/contentColors.ts, runs in the site's build, not in the hook): its source colour, then the scheme of the
   * variant and contrast in `choice`, each of the site's colours by its role, in both modes. undefined for a picture
   * that is not one of the page's, cannot be read, has no colour (a grey one), a `choice` that is not a variant and a
   * contrast, or colours that are hard to read. Quick for a photograph too, and made once for each picture and choice. */
  contentColors: (picture: string, choice: ContentBased) => Promise<Colors | undefined>;
};

/** An app's hook for a page's colours (hooks/page-colors.ts): other colours for the page, in both modes, each of the
 * site's by its name; or undefined to leave them. Colours that are not the site's, or hard to read, are not used. */
export type PageColorsHook = (page: PageColorsPage) => Colors | undefined | Promise<Colors | undefined>;
export const definePageColors = (hook: PageColorsHook) => hook;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** What is wrong with the value a page-colors hook gave, a sentence for each, or [] when it is undefined (the page keeps
 * its colours) or Colors: a light and a dark set, each with every colour of the site, by `names`, as a hex colour, and
 * no other name. */
export function pageColorsOutputProblems(value: unknown, names: string[]): string[] {
  if (value === undefined) return [];
  if (!isObject(value)) return ['The hook must give an object with the sets "light" and "dark", or undefined.'];
  const problems: string[] = [];
  for (const mode of MODES) {
    const set = value[mode];
    if (!isObject(set)) problems.push(`The set "${mode}" must be an object of colors.`);
    else for (const name of Object.keys(set)) if (!names.includes(name)) problems.push(`"${mode}.${name}" is not a color of the site.`);
  }
  if (problems.length) return problems;
  return colorProblems(value, names).map((line) => `The color ${line} is missing or is not a hex color like #a3345a.`);
}
