// The icons the site and the editor draw, by Phosphor's names (usedIcons), and the icon packs that draw them (the
// folders, packages/editor/site/iconPacks.mjs): which packs there are (installedPacks), each one's icons (packIcons) and what is
// wrong with one (packProblems). The system's own packs (SYSTEM_PACKS: Material Symbols, Phosphor and Lucide, in
// packages/editor/icons/<pack>/) are written by packages/editor/scripts/icon-packs.mjs (`npm run icons`) from their sets' packages at the versions in
// PACK_SOURCES, by the maps here: Phosphor's name → the set's icon, chosen for what it means where it is used (by its own
// name in the set, else by what it shows: Phosphor's `browser`, a window with a bar at the top, is Material Symbols'
// `web`). An icon a set has none of (a brand's logo; Lucide has none) is Pictogrammers' Material Design Icons'
// (MATERIAL_DESIGN_ICONS), with its licence beside the pack's own. check:content stops at a pack without an icon the
// site or the editor draws (themeProblems and iconPackProblems in packages/editor/site/theme.mjs).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svgParts } from '@interstellarcms/cms/lib/svg.mjs';
import { ICON_PACK_FILE, ICON_PACK_LICENSE, SYSTEM_PACKS, THEME_PACKS_FOLDER, themePackId } from './iconPacks.mjs';

// The site's root (the working directory) and this package's.
const root = pathToFileURL(`${process.cwd()}/`);
const pkg = new URL('../', import.meta.url);

/** Where the system's own packs are, one folder each (this package's icons/), from the site's root. */
export const SYSTEM_PACKS_FOLDER = relative(process.cwd(), fileURLToPath(new URL('icons', pkg)));

/** A pack's folder, from its id, from the site's root: a system pack's in this package, a theme's in its folder. */
export const packFolder = (id) => {
  const [theme, pack] = id.split('/');
  return pack ? `src/themes/${theme}/${THEME_PACKS_FOLDER}/${pack}` : `${SYSTEM_PACKS_FOLDER}/${theme}`;
};
const PHOSPHOR = 'node_modules/@phosphor-icons/core/assets/';
const has = (path) => existsSync(new URL(path, root));

/** The packages the system's packs are written from, at the versions they are (not in package.json, so neither an
 * install nor the site's build fetches them; packages/editor/scripts/icon-packs.mjs fetches them into node_modules/.cache/), and what
 * their packs' manifests say of them. Phosphor's is the site's own dependency (the names, and its React icons), at the
 * version package-lock.json has; check:content stops when it is another. */
export const PACK_SOURCES = {
  'material-symbols': {
    package: '@material-symbols/svg-400@0.48.2',
    name: 'Material Symbols',
    author: 'Google',
    license: 'Apache-2.0',
    url: 'https://fonts.google.com/icons',
  },
  phosphor: {
    package: '@phosphor-icons/core@2.1.1',
    name: 'Phosphor',
    author: 'Phosphor Icons',
    license: 'MIT',
    url: 'https://phosphoricons.com',
  },
  lucide: {
    package: 'lucide-static@1.63.0',
    name: 'Lucide',
    author: 'Lucide Contributors',
    license: 'ISC',
    url: 'https://lucide.dev',
  },
  'material-design-icons': {
    package: '@mdi/svg@7.4.47',
    name: 'Material Design Icons',
    author: 'Pictogrammers',
    license: 'Apache-2.0',
    url: 'https://pictogrammers.com/library/mdi/',
  },
};

/** For each system pack but Phosphor's (whose names they are): Phosphor's name → Material Design Icons' (the package in
 * PACK_SOURCES), for an icon the site or the editor draws that its set has none of. Material Symbols: a brand's logo (the
 * account logged in at GitHub, the SEO choices' Google), the butterfly (the logo screen, an app's icon), and the
 * things it has nothing that shows (binoculars, a hard disk, swatches, a scan frame, the arrows that widen and narrow
 * the Hero). Lucide, which draws no brands: the logos, and the butterfly in outline, as Lucide draws. */
export const MATERIAL_DESIGN_ICONS = {
  'material-symbols': {
    'arrows-in-line-horizontal': 'arrow-collapse-horizontal',
    'arrows-out-line-horizontal': 'arrow-expand-horizontal',
    binoculars: 'binoculars',
    butterfly: 'butterfly',
    'github-logo': 'github',
    'google-logo': 'google',
    'hard-drives': 'harddisk',
    scan: 'scan-helper',
    swatches: 'palette-swatch',
  },
  lucide: {
    butterfly: 'butterfly-outline',
    'github-logo': 'github',
    'google-logo': 'google',
  },
};

/** Phosphor's name → Material Symbols' (Outlined, weight 400; `-fill` the filled one), for every icon the site and the
 * editor draw (usedIcons) but those in MATERIAL_DESIGN_ICONS['material-symbols']. */
export const MATERIAL_SYMBOLS = {
  'address-book': 'contacts',
  'app-window': 'web_asset',
  'arrow-counter-clockwise': 'replay',
  'arrow-down': 'arrow_downward',
  'arrow-left': 'arrow_back',
  'arrow-right': 'arrow_forward',
  'arrow-square-out': 'open_in_new',
  'arrow-u-up-left': 'undo',
  'arrow-u-up-right': 'redo',
  'arrow-up': 'arrow_upward',
  'arrow-up-right': 'arrow_outward',
  'arrows-down-up': 'swap_vert',
  article: 'article',
  bank: 'account_balance',
  bell: 'notifications',
  bicycle: 'pedal_bike',
  'book-open': 'import_contacts',
  'book-open-text': 'menu_book',
  browser: 'web',
  buildings: 'domain',
  bus: 'directions_bus',
  'calendar-blank': 'calendar_today',
  'calendar-check': 'event_available',
  'calendar-x': 'event_busy',
  car: 'directions_car',
  cards: 'cards_stack',
  'caret-down': 'keyboard_arrow_down',
  'caret-left': 'chevron_left',
  'caret-right': 'chevron_right',
  'caret-up': 'keyboard_arrow_up',
  certificate: 'license',
  'chart-line-up': 'monitoring',
  chats: 'forum',
  check: 'check',
  'check-circle': 'check_circle',
  circle: 'circle',
  'circle-half': 'contrast',
  clock: 'schedule',
  'clock-counter-clockwise': 'history',
  code: 'code',
  coffee: 'local_cafe',
  columns: 'view_column_2',
  cookie: 'cookie',
  copy: 'content_copy',
  'credit-card': 'credit_card',
  'currency-circle-dollar': 'paid',
  'cursor-click': 'ads_click',
  database: 'database',
  desktop: 'desktop_windows',
  'device-mobile': 'mobile',
  'door-open': 'door_open',
  'download-simple': 'download',
  'envelope-simple': 'mail',
  eye: 'visibility',
  'eye-slash': 'visibility_off',
  'file-pdf': 'picture_as_pdf',
  'file-text': 'description',
  'file-video': 'video_file',
  'file-zip': 'folder_zip',
  'flower-lotus': 'spa',
  'folder-simple': 'folder',
  funnel: 'filter_alt',
  gauge: 'speed',
  gear: 'settings',
  globe: 'language',
  'graduation-cap': 'school',
  hammer: 'hardware',
  'hand-heart': 'volunteer_activism',
  handshake: 'handshake',
  heart: 'favorite',
  house: 'home',
  'identification-card': 'id_card',
  image: 'image',
  'image-square': 'image',
  info: 'info',
  keyboard: 'keyboard',
  leaf: 'eco',
  lifebuoy: 'support',
  lightbulb: 'lightbulb',
  'link-break': 'link_off',
  'link-simple': 'link',
  list: 'menu',
  'list-bullets': 'format_list_bulleted',
  'list-checks': 'checklist',
  'list-numbers': 'format_list_numbered',
  'magnifying-glass': 'search',
  'map-pin': 'location_on',
  'map-trifold': 'map',
  medal: 'military_tech',
  megaphone: 'campaign',
  minus: 'remove',
  money: 'payments',
  moon: 'dark_mode',
  newspaper: 'newspaper',
  'paint-brush-broad': 'brush',
  'paint-bucket': 'format_color_fill',
  palette: 'palette',
  'paper-plane-tilt': 'send',
  'pencil-simple': 'edit',
  phone: 'call',
  'play-fill': 'play_arrow-fill',
  plus: 'add',
  prohibit: 'block',
  'puzzle-piece': 'extension',
  question: 'help',
  quotes: 'format_quote',
  receipt: 'receipt',
  rows: 'view_agenda',
  shapes: 'shapes',
  'share-network': 'share',
  'shield-check': 'verified_user',
  'sidebar-simple': 'side_navigation',
  'sign-out': 'logout',
  signpost: 'signpost',
  'sliders-horizontal': 'tune',
  smiley: 'mood',
  sparkle: 'star_shine',
  square: 'square',
  'square-half-bottom': 'call_to_action',
  'squares-four': 'grid_view',
  storefront: 'storefront',
  sun: 'light_mode',
  tag: 'sell',
  'text-aa': 'match_case',
  'text-align-left': 'format_align_left',
  'text-b': 'format_bold',
  'text-h-one': 'format_h1',
  'text-h-three': 'format_h3',
  'text-h-two': 'format_h2',
  'text-italic': 'format_italic',
  'text-t': 'title',
  ticket: 'confirmation_number',
  'toggle-right': 'toggle_on',
  train: 'train',
  trash: 'delete',
  'upload-simple': 'upload',
  user: 'person',
  'user-circle': 'account_circle',
  users: 'group',
  'users-three': 'groups',
  'video-camera': 'videocam',
  wallet: 'wallet',
  warning: 'warning',
  'warning-circle': 'error',
  wheelchair: 'accessible',
  wrench: 'build',
  x: 'close',
};

/** Phosphor's name → Lucide's, for every icon the site and the editor draw (usedIcons) but those in
 * MATERIAL_DESIGN_ICONS.lucide. `-fill`: Lucide's outline filled in (Lucide has no filled icons). */
export const LUCIDE = {
  'address-book': 'book-user',
  'app-window': 'app-window',
  'arrow-counter-clockwise': 'rotate-ccw',
  'arrow-down': 'arrow-down',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-square-out': 'external-link',
  'arrow-u-up-left': 'undo-2',
  'arrow-u-up-right': 'redo-2',
  'arrow-up': 'arrow-up',
  'arrow-up-right': 'arrow-up-right',
  'arrows-down-up': 'arrow-down-up',
  'arrows-in-line-horizontal': 'fold-horizontal',
  'arrows-out-line-horizontal': 'unfold-horizontal',
  article: 'file-text',
  bank: 'landmark',
  bell: 'bell',
  bicycle: 'bike',
  binoculars: 'binoculars',
  'book-open': 'book-open',
  'book-open-text': 'book-open-text',
  browser: 'panel-top',
  buildings: 'building-2',
  bus: 'bus',
  'calendar-blank': 'calendar',
  'calendar-check': 'calendar-check',
  'calendar-x': 'calendar-x',
  car: 'car',
  cards: 'gallery-vertical-end',
  'caret-down': 'chevron-down',
  'caret-left': 'chevron-left',
  'caret-right': 'chevron-right',
  'caret-up': 'chevron-up',
  certificate: 'award',
  'chart-line-up': 'chart-line',
  chats: 'messages-square',
  check: 'check',
  'check-circle': 'circle-check',
  circle: 'circle',
  'circle-half': 'contrast',
  clock: 'clock',
  'clock-counter-clockwise': 'history',
  code: 'code',
  coffee: 'coffee',
  columns: 'columns-2',
  cookie: 'cookie',
  copy: 'copy',
  'credit-card': 'credit-card',
  'currency-circle-dollar': 'circle-dollar-sign',
  'cursor-click': 'mouse-pointer-click',
  database: 'database',
  desktop: 'monitor',
  'device-mobile': 'smartphone',
  'door-open': 'door-open',
  'download-simple': 'download',
  'envelope-simple': 'mail',
  eye: 'eye',
  'eye-slash': 'eye-off',
  'file-pdf': 'file-text',
  'file-text': 'file-text',
  'file-video': 'file-video-camera',
  'file-zip': 'file-archive',
  'flower-lotus': 'flower-2',
  'folder-simple': 'folder',
  funnel: 'funnel',
  gauge: 'gauge',
  gear: 'settings',
  globe: 'globe',
  'graduation-cap': 'graduation-cap',
  hammer: 'hammer',
  'hand-heart': 'hand-heart',
  handshake: 'handshake',
  'hard-drives': 'server',
  heart: 'heart',
  house: 'house',
  'identification-card': 'id-card',
  image: 'image',
  'image-square': 'image',
  info: 'info',
  keyboard: 'keyboard',
  leaf: 'leaf',
  lifebuoy: 'life-buoy',
  lightbulb: 'lightbulb',
  'link-break': 'unlink',
  'link-simple': 'link',
  list: 'menu',
  'list-bullets': 'list',
  'list-checks': 'list-checks',
  'list-numbers': 'list-ordered',
  'magnifying-glass': 'search',
  'map-pin': 'map-pin',
  'map-trifold': 'map',
  medal: 'medal',
  megaphone: 'megaphone',
  minus: 'minus',
  money: 'banknote',
  moon: 'moon',
  newspaper: 'newspaper',
  'paint-brush-broad': 'paintbrush',
  'paint-bucket': 'paint-bucket',
  palette: 'palette',
  'paper-plane-tilt': 'send',
  'pencil-simple': 'pencil',
  phone: 'phone',
  'play-fill': 'play-fill',
  plus: 'plus',
  prohibit: 'ban',
  'puzzle-piece': 'puzzle',
  question: 'circle-question-mark',
  quotes: 'quote',
  receipt: 'receipt',
  rows: 'rows-2',
  scan: 'scan',
  shapes: 'shapes',
  'share-network': 'share-2',
  'shield-check': 'shield-check',
  'sidebar-simple': 'panel-left',
  'sign-out': 'log-out',
  signpost: 'signpost',
  'sliders-horizontal': 'sliders-horizontal',
  smiley: 'smile',
  sparkle: 'sparkle',
  square: 'square',
  'square-half-bottom': 'panel-bottom',
  'squares-four': 'layout-grid',
  storefront: 'store',
  sun: 'sun',
  swatches: 'swatch-book',
  tag: 'tag',
  'text-aa': 'case-sensitive',
  'text-align-left': 'text-align-start',
  'text-b': 'bold',
  'text-h-one': 'heading-1',
  'text-h-three': 'heading-3',
  'text-h-two': 'heading-2',
  'text-italic': 'italic',
  'text-t': 'type',
  ticket: 'ticket',
  'toggle-right': 'toggle-right',
  train: 'train-front',
  trash: 'trash-2',
  'upload-simple': 'upload',
  user: 'user',
  'user-circle': 'circle-user',
  users: 'users',
  'users-three': 'users-round',
  'video-camera': 'video',
  wallet: 'wallet',
  warning: 'triangle-alert',
  'warning-circle': 'circle-alert',
  wheelchair: 'accessibility',
  wrench: 'wrench',
  x: 'x',
};

/** Each system pack's map: Phosphor's name → its set's icon (Phosphor's: its own names, no map). */
export const PACK_MAPS = { 'material-symbols': MATERIAL_SYMBOLS, lucide: LUCIDE };

/** The names the system's pack has an icon by in its maps (its set's and Material Design Icons'); all for Phosphor's. */
const mapped = (pack) => (PACK_MAPS[pack] ? [...Object.keys(PACK_MAPS[pack]), ...Object.keys(MATERIAL_DESIGN_ICONS[pack] ?? {})] : null);

/** Whether a name is one the site and the editor draw an icon by: Phosphor's (regular, and the filled ones as
 * `<name>-fill`). A pack's file and a theme's own icon have one of them. */
export const isIconName = (name) =>
  /^[a-z0-9-]+$/.test(name) && (has(`${PHOSPHOR}regular/${name}.svg`) || (name.endsWith('-fill') && has(`${PHOSPHOR}fill/${name}.svg`)));

/** What is wrong with an icon's SVG file (`file` its path, for the message): one <svg> with a viewBox, with nothing in it
 * that runs or loads something from elsewhere. */
export function svgProblems(file, svg) {
  const problems = [];
  const parts = svgParts(svg);
  if (!parts || svg.match(/<svg\b/gi).length > 1 || !/^-?[\d.]+([ ,]+-?[\d.]+){3}$/.test(parts.viewBox?.trim() ?? ''))
    problems.push(`${file}: et ikon er ét <svg> med en viewBox og intet før eller efter.`);
  if (
    /<(script|foreignObject|iframe|object|embed|style)\b|<!(DOCTYPE|ENTITY)|\son[a-z]+\s*=|javascript:/i.test(svg) ||
    /\b(xlink:)?href\s*=\s*["'](?!#)/i.test(svg) ||
    /url\(\s*["']?(?!#)/i.test(svg)
  )
    problems.push(`${file}: et ikon må ikke have scripts, stil, hændelser (on…) eller hente noget udefra, kun tegning.`);
  return problems;
}

const folders = (dir) =>
  has(dir)
    ? readdirSync(new URL(dir, root), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

/** The icon packs there are, by id: the system's (packages/editor/icons/<pack>/) and those the themes installed bring
 * (src/themes/<theme>/icon-packs/<pack>/, as `<theme>/<pack>`), each a folder with its pack.json. */
export function installedPacks() {
  const system = folders(`${SYSTEM_PACKS_FOLDER}/`).filter((p) => has(`${SYSTEM_PACKS_FOLDER}/${p}/${ICON_PACK_FILE}`));
  const themes = folders('src/themes/').flatMap((theme) =>
    folders(`src/themes/${theme}/${THEME_PACKS_FOLDER}/`)
      .filter((p) => has(`src/themes/${theme}/${THEME_PACKS_FOLDER}/${p}/${ICON_PACK_FILE}`))
      .map((p) => themePackId(theme, p)),
  );
  return [...system, ...themes];
}

/** A pack's icons as their files' text, by name (its <name>.svg). */
export function packIcons(id) {
  const dir = `${packFolder(id)}/`;
  const icons = {};
  if (has(dir))
    for (const f of readdirSync(new URL(dir, root)))
      if (f.endsWith('.svg')) icons[f.slice(0, -'.svg'.length)] = readFileSync(new URL(dir + f, root), 'utf8');
  return icons;
}

/** Phosphor's own file of an icon by its name (regular, or `<name>-fill` filled), as its package has it; null for one it
 * does not have. */
export function phosphorFile(name) {
  const file =
    name.endsWith('-fill') && has(`${PHOSPHOR}fill/${name}.svg`) ? `${PHOSPHOR}fill/${name}.svg` : `${PHOSPHOR}regular/${name}.svg`;
  return has(file) ? readFileSync(new URL(file, root), 'utf8') : null;
}

const isText = (x) => typeof x === 'string' && x.trim() !== '';

/** What is wrong with an icon pack (`id`, as installedPacks gives it): its manifest (pack.json: name, author, license;
 * and for each set it takes icons from besides its own, `includes`, its name, author, license, licence file and icons),
 * its licences (LICENSE, and each `includes`' licenseFile), an icon the site or the editor draws (usedIcons) it has no
 * file for, a file that is not an icon by a name the site draws, and each icon's SVG (svgProblems). For a system pack,
 * also that it is written as its maps say (systemPackProblems). */
export function packProblems(id, used = usedIcons()) {
  const dir = packFolder(id);
  const problems = [];
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(new URL(`${dir}/${ICON_PACK_FILE}`, root), 'utf8'));
  } catch (e) {
    return [`${dir}/${ICON_PACK_FILE}: ${e.message}`];
  }
  for (const key of ['name', 'author', 'license'])
    if (!isText(manifest[key]))
      problems.push(`${dir}/${ICON_PACK_FILE}: "${key}" mangler (ikonpakkens navn, hvem der har lavet den, og dens licens).`);
  if (!has(`${dir}/${ICON_PACK_LICENSE}`)) problems.push(`${dir}/${ICON_PACK_LICENSE} mangler: ikonpakkens licens.`);
  const licences = new Set([ICON_PACK_LICENSE]);
  if (manifest.includes !== undefined && !Array.isArray(manifest.includes))
    problems.push(`${dir}/${ICON_PACK_FILE}: "includes" er en liste med de sæt, pakken har ikoner fra ud over sit eget.`);
  for (const x of Array.isArray(manifest.includes) ? manifest.includes : []) {
    const named = isText(x?.name) ? x.name : '?';
    if (!['name', 'author', 'license', 'licenseFile'].every((k) => isText(x?.[k])) || !Array.isArray(x.icons) || !x.icons.every(isText))
      problems.push(`${dir}/${ICON_PACK_FILE}: "includes" (${named}) skal have "name", "author", "license", "licenseFile" og "icons".`);
    else if (!/^LICENSE-[a-z0-9-]+$/.test(x.licenseFile) || !has(`${dir}/${x.licenseFile}`))
      problems.push(`${dir}/${x.licenseFile ?? ICON_PACK_LICENSE}: licensen for ${named} mangler (LICENSE-<sæt> i pakkens mappe).`);
    else licences.add(x.licenseFile);
    for (const name of Array.isArray(x?.icons) ? x.icons : [])
      if (!has(`${dir}/${name}.svg`)) problems.push(`${dir}/${ICON_PACK_FILE}: "includes" (${named}) nævner ${name}, som pakken ikke har.`);
  }
  const files = has(dir) ? readdirSync(new URL(`${dir}/`, root), { withFileTypes: true }) : [];
  for (const entry of files) {
    const file = `${dir}/${entry.name}`;
    if (entry.name === ICON_PACK_FILE || licences.has(entry.name)) continue;
    if (!entry.isFile() || !entry.name.endsWith('.svg')) {
      problems.push(`${file}: en ikonpakke har kun ${ICON_PACK_FILE}, sine licenser og ikoner (${dir}/<navn>.svg).`);
      continue;
    }
    const name = entry.name.slice(0, -'.svg'.length);
    if (!isIconName(name))
      problems.push(`${file}: sitet tegner intet ikon, der hedder "${name}". Et ikon hedder som i Phosphor (fx map-pin, play-fill).`);
    problems.push(...svgProblems(file, readFileSync(new URL(file, root), 'utf8')));
  }
  const missing = [...used].sort().filter((name) => !has(`${dir}/${name}.svg`));
  if (missing.length)
    problems.push(
      `Ikonpakken ${isText(manifest.name) ? manifest.name : id} (${dir}/) har intet ikon for ${missing.join(', ')}: ${
        SYSTEM_PACKS.includes(id)
          ? 'skriv det, der passer, i packages/editor/site/icons.mjs, og kør npm run icons.'
          : 'giv den et ikon ved hvert navn.'
      }`,
    );
  return [...problems, ...(SYSTEM_PACKS.includes(id) ? systemPackProblems(id, used) : [])];
}

/** What is wrong with a system pack beyond what every pack must be (packProblems): an icon the site or the editor draws
 * that its maps have none for (Phosphor's: one its package has none of), one they name that is not written or a file
 * they do not name (`npm run icons` writes it again), and Phosphor's package at another version than its pack's. */
function systemPackProblems(id, used) {
  const dir = packFolder(id);
  const problems = [];
  const names = mapped(id);
  if (names) {
    const map = id === 'material-symbols' ? 'MATERIAL_SYMBOLS' : 'LUCIDE';
    const unnamed = [...used].sort().filter((name) => !names.includes(name));
    if (unnamed.length)
      problems.push(
        `${PACK_SOURCES[id].name} har intet ikon for ${unnamed.join(', ')}: skriv det, der passer, i ${map} i packages/editor/site/icons.mjs (et, ${PACK_SOURCES[id].name} intet har af, i MATERIAL_DESIGN_ICONS), og kør npm run icons.`,
      );
  } else {
    const version = JSON.parse(readFileSync(new URL('node_modules/@phosphor-icons/core/package.json', root), 'utf8')).version;
    if (`@phosphor-icons/core@${version}` !== PACK_SOURCES.phosphor.package)
      problems.push(
        `@phosphor-icons/core er ${version}, men ikonpakken Phosphor er skrevet fra ${PACK_SOURCES.phosphor.package}: ret versionen i PACK_SOURCES i packages/editor/site/icons.mjs, og kør npm run icons.`,
      );
  }
  if (names) {
    const unused = names.filter((name) => !used.has(name)).sort();
    if (unused.length)
      problems.push(
        `packages/editor/site/icons.mjs: ${PACK_SOURCES[id].name}s kort har ${unused.join(', ')}, som sitet og editoren ikke tegner: tag dem ud, og kør npm run icons.`,
      );
  }
  const written = Object.keys(packIcons(id));
  const wanted = names ?? [...used];
  const unwritten = wanted.filter((name) => !written.includes(name)).sort();
  const stray = written.filter((name) => !wanted.includes(name)).sort();
  if (unwritten.length) problems.push(`${dir}/ mangler ${unwritten.join(', ')}: kør npm run icons.`);
  if (stray.length)
    problems.push(`${dir}/: ${stray.join(', ')} bruges ikke (eller står ikke i packages/editor/site/icons.mjs): kør npm run icons.`);
  return problems;
}

/** The Phosphor icons the site and the editor draw, by their file's name: the site's (Svg's import.meta.glob in
 * packages/editor/src/icon.tsx), the React icons imported from @phosphor-icons/react (`CaretRight` → caret-right) and
 * the SVG files imported as text (`…/core/assets/regular/eye.svg` with `?raw`), in packages/editor/ and src/; and the
 * icons of the apps in the app store and what they add (`icon` in store/catalog.json, drawn by AnyIcon in icon.tsx
 * before they are installed). */
export function usedIcons() {
  const used = new Set();
  const has = (name) => existsSync(new URL(`${PHOSPHOR}regular/${name}.svg`, root));
  // The CMS's code (also when it is in node_modules/) and the site's, without the packages inside either.
  const files = [pkg, new URL('src/', root)].flatMap((dir) =>
    readdirSync(fileURLToPath(dir), { recursive: true, withFileTypes: true })
      .filter(
        (e) => e.isFile() && /\.(tsx?|mjs|astro)$/.test(e.name) && !relative(fileURLToPath(dir), e.parentPath).includes('node_modules'),
      )
      .map((e) => join(e.parentPath, e.name)),
  );
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    for (const [, names] of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*'@phosphor-icons\/react'/g))
      for (const part of names.split(',')) {
        const name = part
          .trim()
          .split(/\s+as\s+/)[0]
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
          .toLowerCase();
        if (has(name)) used.add(name);
      }
    for (const [, name] of code.matchAll(/@phosphor-icons\/core\/assets\/(?:regular|fill)\/([a-z0-9-]+)\.svg\?raw/g)) used.add(name);
    for (const [, names] of code.matchAll(/\/node_modules\/@phosphor-icons\/core\/assets\/(?:regular|fill)\/\{([^}]*)\}\.svg/g))
      for (const name of names.split(',')) used.add(name);
  }
  // The store's catalog (until the real store exists, this repository's own: `store` in src/site/config.ts).
  const catalog = new URL('store/catalog.json', root);
  if (existsSync(catalog))
    JSON.parse(readFileSync(catalog, 'utf8'), (key, value) => {
      if (key === 'icon' && typeof value === 'string' && /^[a-z0-9-]+$/.test(value) && has(value)) used.add(value);
      return value;
    });
  return used;
}
