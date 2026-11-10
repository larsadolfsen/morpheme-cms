// The site's themes, for the editor: the one the site and the editor are built with (src/data/theme.json;
// packages/editor/site/theme.mjs), by "Temaer" on "Udseende", and those installed in src/themes/, each a folder with its
// theme.json, shown under "Temaer" with a page each to swap to it from (Themes and ThemePage in Library.tsx). Only
// their theme.json, the pictures of the site in them (screenshots/, packages/editor/scripts/theme-screenshots.mjs) and, for one installed
// from the store (packages/editor/src/store.ts), where it came from (store.json) are read: their code is not loaded.
import chosen from '@data/theme.json';
import { STANDARD_THEME, type StoreRecord } from './store';
import type { ThirdParty } from './licenseData';
import type { Category } from '../lib/storeCategories.mjs';

export type ThemeInfo = {
  /** Its folder in src/themes/, as saved in src/data/theme.json. */
  id: string;
  name: string;
  version: string;
  /** Who made it. */
  author: string;
  /** Its picture, an address on the site. */
  icon: string;
  /** Its own licence ("UNLICENSED" when all rights are reserved) and the third-party work it brings (fonts, code,
   * pictures), on its page and under "Licenser" (@morphemecms/cms/lib/licenses.mjs). */
  license: string;
  thirdParty: ThirdParty[];
  /** Its main category in the store ("category" in its theme.json: one of CATEGORIES in lib/storeCategories.mjs, for a
   * theme `appearance`) and its subcategory of it ("subcategory": one SUBCATEGORIES lists for it; none yet). */
  category?: Category;
  subcategory?: string;
  /** The icon pack it uses while none is chosen ("icons" in its theme.json: a system pack, or one of its own by its
   * folder; packOfTheme in icons.ts gives its id). */
  icons?: string;
  /** How it moves while the owner has chosen none ("motion" in its theme.json: a scheme of lib/motion.ts). */
  motion?: string;
  /** The page templates it offers, the first the default ("templates" in its theme.json: ids of lib/page-template.mjs). */
  templates?: string[];
  /** What it looks like, in a sentence or two, by the editor's language ("da-DK"), on its page. */
  description?: Record<string, string>;
  /** What it gives the site, a few short points by the editor's language, on its page. */
  highlights?: Record<string, string[]>;
  /** Pictures of the site in it (src/themes/<theme>/screenshots/<n>-<key>.jpg), in their order: what each shows (its
   * name in the editor, t.library.themeShots) and its address. */
  screenshots: { key: string; src: string }[];
  /** Whether it is offered in the store (`"store": true` in its theme.json, npm run store:release), and where it came from
   * when it was installed from it (its store.json). */
  inStore?: boolean;
  store?: StoreRecord;
};

// The standard theme's files (the package's theme/, @saturn) as if they were in src/themes/<its id>/, beside the others'.
const asStandard = <T>(found: Record<string, T>) =>
  Object.fromEntries(Object.entries(found).map(([path, v]) => [`/src/themes/${STANDARD_THEME}/${path.split('/theme/').pop()}`, v]));
type Manifest = Omit<ThemeInfo, 'id' | 'screenshots' | 'inStore' | 'store'> & { store?: boolean };
const manifests = {
  ...asStandard(import.meta.glob<Manifest>('@saturn/theme.json', { eager: true, import: 'default' })),
  ...import.meta.glob<Manifest>('/src/themes/*/theme.json', { eager: true, import: 'default' }),
};
const records = import.meta.glob<StoreRecord>('/src/themes/*/store.json', { eager: true, import: 'default' });
const pictures = {
  ...asStandard(import.meta.glob<string>('@saturn/screenshots/*.jpg', { eager: true, query: '?url', import: 'default' })),
  ...import.meta.glob<string>('/src/themes/*/screenshots/*.jpg', { eager: true, query: '?url', import: 'default' }),
};
const idOf = (path: string) => path.split('/')[3];

/** A theme's pictures, by the number in their names. */
const screenshotsOf = (id: string) =>
  Object.entries(pictures)
    .filter(([path]) => idOf(path) === id)
    .map(([path, src]) => ({
      name: path
        .split('/')
        .pop()!
        .replace(/\.jpg$/, ''),
      src,
    }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))
    .map(({ name, src }) => ({ key: name.replace(/^\d+-/, ''), src }));

/** The themes installed, by name. */
export const themes: ThemeInfo[] = Object.entries(manifests)
  .map(([path, m]) => ({
    id: idOf(path),
    name: m.name,
    version: m.version,
    author: m.author,
    icon: m.icon,
    license: m.license,
    thirdParty: m.thirdParty,
    ...(m.category ? { category: m.category } : {}),
    ...(m.subcategory ? { subcategory: m.subcategory } : {}),
    ...(m.icons ? { icons: m.icons } : {}),
    ...(m.motion ? { motion: m.motion } : {}),
    ...(m.templates ? { templates: m.templates } : {}),
    description: m.description,
    highlights: m.highlights,
    screenshots: screenshotsOf(idOf(path)),
    ...(m.store ? { inStore: true } : {}),
    ...(records[`/src/themes/${idOf(path)}/store.json`] ? { store: records[`/src/themes/${idOf(path)}/store.json`] } : {}),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** The theme the site and this editor are built with (the build stops when it is not installed). */
export const theme: ThemeInfo = themes.find((x) => x.id === chosen.theme)!;
