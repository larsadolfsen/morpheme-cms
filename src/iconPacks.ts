// The site's icon packs, for the editor ("Settings" › "Appearance" › "Icon packs", IconPacks in Library.tsx): the
// system's own (packages/editor/icons/<pack>/: Material Symbols, Phosphor and Lucide) and those the themes installed bring
// (src/themes/<theme>/icon-packs/<pack>/), each by its manifest (pack.json) with a few of its icons to show; and the one
// the site and this editor are built with (packages/editor/site/iconPacks.mjs: the one chosen, src/data/icons.json, else the theme's,
// else the standard theme's). The packs' icons are read as files: the editor draws them as they are, beside the icons it
// draws itself, which are the pack in use's (themePlugin in packages/editor/site/theme.mjs).
import { packInUse, packTheme, themePackId } from '../site/iconPacks.mjs';
import { STANDARD_THEME } from './store';
import { theme, themes } from './themes';

export type IconPack = {
  /** Its id: a system pack's folder (`lucide`), a theme's `<theme>/<folder>` (packages/editor/site/iconPacks.mjs). */
  id: string;
  name: string;
  /** Who made it. */
  author: string;
  /** Its licence, as an SPDX id (`Apache-2.0`), in its folder as LICENSE. */
  license: string;
  version?: string;
  url?: string;
  /** The theme it came with; none for the system's own. */
  theme?: string;
  /** The sets it has icons from besides its own (Material Design Icons' logos), each with its licence in the folder. */
  includes?: { name: string; author: string; license: string; licenseFile: string; icons: string[] }[];
  /** A few of its icons' files, to show what it looks like (SAMPLES). */
  samples: string[];
};

/** The icons each pack shows of itself, by the names the site draws them by. */
const SAMPLES = ['house', 'magnifying-glass', 'calendar-blank', 'envelope-simple', 'heart'];

type Manifest = Omit<IconPack, 'id' | 'theme' | 'samples'>;
// `exhaustive`: Vite skips node_modules in a glob unless told not to, and a site takes this package (and its icons/) from there.
const manifests = import.meta.glob<Manifest>(['@icons/*/pack.json', '/src/themes/*/icon-packs/*/pack.json'], {
  eager: true,
  import: 'default',
  exhaustive: true,
});
const files = import.meta.glob<string>(
  [
    '@icons/*/{house,magnifying-glass,calendar-blank,envelope-simple,heart}.svg',
    '/src/themes/*/icon-packs/*/{house,magnifying-glass,calendar-blank,envelope-simple,heart}.svg',
  ],
  { eager: true, query: '?raw', import: 'default', exhaustive: true },
);
const chosen = import.meta.glob<{ pack?: string }>('/src/data/icons.json', { eager: true, import: 'default' })['/src/data/icons.json'];

/** A pack's id from the path of a file in it: a theme's (src/themes/<theme>/icon-packs/<pack>/) or the system's (the
 * CMS's icons/<pack>/, @icons). */
const idOf = (path: string) => {
  const own = path.match(/\/themes\/([^/]+)\/icon-packs\/([^/]+)\//);
  return own ? themePackId(own[1], own[2]) : path.split('/').at(-2)!;
};
const folderOf = (path: string) => path.slice(0, path.lastIndexOf('/') + 1);

/** The icon packs installed, by name. */
export const iconPacks: IconPack[] = Object.entries(manifests)
  .map(([path, m]) => {
    const id = idOf(path);
    const folder = folderOf(path);
    const pack: IconPack = {
      id,
      name: m.name,
      author: m.author,
      license: m.license,
      samples: SAMPLES.map((name) => files[`${folder}${name}.svg`]).filter(Boolean),
    };
    if (m.version) pack.version = m.version;
    if (m.url) pack.url = m.url;
    if (m.includes?.length) pack.includes = m.includes;
    const from = packTheme(id);
    if (from) pack.theme = from;
    return pack;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const installed = iconPacks.map((p) => p.id);
const standard = themes.find((x) => x.id === STANDARD_THEME);

/** The pack a theme uses while none is chosen, by its id. */
export const packOfTheme = (id: string): string =>
  packInUse({ chosen: undefined, theme: id, icons: themes.find((x) => x.id === id)?.icons, standardIcons: standard?.icons, installed });

/** The pack the site and this editor are built with, by its id. */
export const iconPack: string = packInUse({
  chosen: chosen?.pack,
  theme: theme.id,
  icons: theme.icons,
  standardIcons: standard?.icons,
  installed,
});
