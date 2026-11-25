// Every icon the site draws, on the site and in the editor alike, by its Material Symbols name (`location_on`; the filled one is `weight="fill"`,
// `<name>-fill` in a pack): the theme's own (src/themes/<theme>/icons/) or the icon pack in use's file of that name (virtual:theme-icons, themePlugin in
// packages/editor/site/theme.mjs), else Material Symbols' own (Outlined; marked data-icon-fallback), else MISSING (`help`). A brand's logo is the brand
// pack's, whichever pack the site picks. Phosphor and Lucide are not in the package: a name stored the Phosphor way is rewritten by the update
// (lib/migrate-icons.mjs). Exposes Svg, AnyIcon, Icon, Glyph, SvgFile, MISSING, iconFile, drawsFilled, iconNames; uses lib/materialIcon.mjs (the order), materialIcons.ts (lazy set).
//
// Material Symbols is in the server render at once (virtual:material-symbols-ssr); in the browser it is one lazy chunk, loaded the
// first time one is drawn that the pack has none of; only a name Material Symbols lacks too is MISSING, the question mark, marked with
// data-icon-missing (its name), which check:screens finds on the built site's pages and the editor's screens.
import { cloneElement, isValidElement, useEffect, useState, type ComponentType, type ReactElement, type SVGProps } from 'react';
import { materialName, materialNames, resolveIcon } from '../lib/materialIcon.mjs';
import { themeIcons } from 'virtual:theme-icons';
import { brandOf, type BRANDS } from '../lib/brandLogos.mjs';
import { svgParts } from '../lib/svg.mjs';
import ssrMaterial from 'virtual:material-symbols-ssr';
import moreVertFile from '@material-symbols/svg-400/outlined/more_vert.svg?raw';
import closeFile from '@material-symbols/svg-400/outlined/close.svg?raw';
import bodyA1File from './icons/body-a1.svg?raw';
import bodyA2File from './icons/body-a2.svg?raw';
import bodyA3File from './icons/body-a3.svg?raw';
import addBlockFile from './icons/add-block.svg?raw';
import blockSettingsFile from './icons/block-settings.svg?raw';
import matchCaseFile from '@material-symbols/svg-400/outlined/match_case.svg?raw';
import helpFile from '@material-symbols/svg-400/outlined/help.svg?raw';
import facebookBrand from '../site/brand/facebook.svg?raw';
import xBrand from '../site/brand/x.svg?raw';
import linkedinBrand from '../site/brand/linkedin.svg?raw';
import pinterestBrand from '../site/brand/pinterest.svg?raw';
import githubBrand from '../site/brand/github.svg?raw';
import googleBrand from '../site/brand/google.svg?raw';

/** What a weight is, as the icon components take it (`fill` is the only one drawn). */
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

/** The brand pack's files (site/brand/, lib/brandLogos.mjs): drawn at once, whichever icon pack the site picks, and never replaced by a theme's or a pack's icon or a Material one. */
const BRAND_FILES: Record<(typeof BRANDS)[number], string> = {
  facebook: facebookBrand,
  x: xBrand,
  linkedin: linkedinBrand,
  pinterest: pinterestBrand,
  github: githubBrand,
  google: googleBrand,
};

const MATERIAL = '/node_modules/@material-symbols/svg-400/outlined/';
/** Material Symbols' viewBox, every file's. */
const MATERIAL_VIEWBOX = '0 -960 960 960';
// Material Symbols' files by their path: at once on the server render, else after the lazy chunk is loaded.
let materialSet: Record<string, string> | undefined = import.meta.env.SSR ? ssrMaterial : undefined;
let materialLoading: Promise<void> | undefined;
const loadMaterial = () =>
  (materialLoading ??= import('./materialIcons').then((m) => {
    materialSet = m.materialIcons;
  }));
/** A Material Symbols file by `<name>` or `<name>-fill` (a Material name); undefined until the set is loaded. */
const materialLookup = () => (materialSet ? (key: string) => materialSet?.[`${MATERIAL}${key}.svg`] : undefined);
/** The names of all of Material Symbols' icons, to pick from. A picked one is stored by its name, and the site draws it as the fallback above. Undefined until the lazy set is loaded, which `wanted` asks for (the icon picker's search). */
export function useAllIconNames(wanted: boolean): string[] | undefined {
  const build = () => (materialSet ? materialNames(Object.keys(materialSet)) : undefined);
  const [names, setNames] = useState<string[] | undefined>(build);
  useEffect(() => {
    if (!wanted || names) return;
    loadMaterial().then(() => setNames(build()));
  }, [wanted, names]);
  return names;
}

/** Draws again when the lazy set has loaded, after it is asked for (`wanted`). */
function useMaterialLoaded(wanted: boolean) {
  const [again, redraw] = useState(0);
  useEffect(() => {
    if (wanted && !materialSet) loadMaterial().then(() => redraw((n) => n + 1));
  }, [wanted, again]);
}

/** The icons the site draws filled where a toggle is on (a drawer's active item, "Video"'s play button): Material names. A pack that has `<name>-fill` also draws it. */
const FILLED = new Set(
  'web,apartment,workspace_premium,trending_up,forum,mail,description,folder,favorite,checklist,search,campaign,newspaper,brush,play_arrow,extension,verified_user,splitscreen,grid_view,storefront,sell,toggle_on,delete,person,build'.split(
    ',',
  ),
);

/** The icon drawn for one that is not found (a name the site does not draw, one Material Symbols does not have either): a
 * question mark, Material's `help`. */
export const MISSING = 'help';

/** An icon's SVG file by its name: the theme's or the icon pack's; undefined for one they do not have (Material Symbols' own is drawn then). */
export function iconFile(name: string, weight?: 'fill'): string | undefined {
  return weight ? themeIcons[`${name}-fill`] : themeIcons[name];
}

/** Whether an icon has a filled look the site draws (ToggleIcon in theme/ui/Button.tsx). */
export const drawsFilled = (name: string) => FILLED.has(name) || !!iconFile(name, 'fill');

/** An icon by name as the site and the editor draw it (the theme's View.tsx and its parts, Icon.astro, the editor's
 * fields): the bare <svg> in its file's viewBox, at the size given, in the text's colour, hidden from screen readers
 * (or named by `label`). A filled one the site does not draw is the regular one; an icon it does not draw is Material
 * Symbols' by its Material name (marked data-icon-fallback), and MISSING when it has none. */
export function Svg({
  name,
  size = 20,
  weight,
  className,
  label,
  iconColor,
}: {
  name: string;
  size?: number;
  weight?: 'fill';
  className?: string;
  label?: string;
  /** A color role of the site (src/iconColor.ts): `data-icon-color`, drawn by the theme. */
  iconColor?: string;
}) {
  const brand = brandOf(name);
  const found = brand ? { file: BRAND_FILES[brand] } : resolveIcon(name, weight, { list: iconFile, material: materialLookup() });
  useMaterialLoaded(!!found.pending);
  return (
    <Drawn
      file={found.file}
      fallback={found.fallback}
      pending={found.pending}
      missing={found.file || found.pending ? undefined : name}
      size={size}
      className={className}
      label={label}
      iconColor={iconColor}
    />
  );
}

/** An icon by its Material name, not only those the site draws (an app's in the app store, store.ts): the theme's or the pack's at once, else Material
 * Symbols' (the lazy set, loaded the first time one is drawn; marked data-icon-fallback). Nothing while it loads, and MISSING for a name neither has. */
export function AnyIcon({ name, size = 20 }: { name: string; size?: number }) {
  const brand = brandOf(name);
  // file null: not found; fallback: the file is Material Symbols'.
  const [found, setFound] = useState<{ file: string | null; fallback?: boolean } | undefined>(() => {
    if (brand) return { file: BRAND_FILES[brand] };
    const file = iconFile(name);
    return file ? { file } : undefined;
  });
  useEffect(() => {
    if (brand) return setFound({ file: BRAND_FILES[brand] });
    const own = iconFile(name);
    if (own) return setFound({ file: own });
    setFound(undefined);
    let on = true;
    (async () => {
      if (materialName(name)) await loadMaterial();
      const backup = resolveIcon(name, undefined, { list: () => undefined, material: materialLookup() });
      if (on) setFound(backup.file ? { file: backup.file, fallback: true } : { file: null });
    })();
    return () => {
      on = false;
    };
  }, [name, brand]);
  if (found === undefined) return null;
  return (
    <Drawn
      file={found.file ?? undefined}
      fallback={found.fallback ? name : undefined}
      missing={found.file ? undefined : name}
      size={size}
    />
  );
}

/** An icon's SVG file drawn as it is, as Svg draws one, not the theme's in its place: an icon pack's own, to show what the
 * pack looks like (IconSwatches in ui.tsx, "Icon packs"). */
export function SvgFile({ file, size = 20 }: { file: string; size?: number }) {
  return <Drawn file={file} size={size} />;
}

/** An SVG file drawn; MISSING in its place when there is none, or it is not an SVG (`missing`: the name asked for).
 * `fallback`: the name asked for, when the file is Material Symbols' (data-icon-fallback). `pending`: a Material icon
 * not loaded yet: the empty <svg> (the server render's own content stays while the page hydrates). */
function Drawn({
  file,
  fallback,
  pending,
  missing,
  size,
  className,
  label,
  iconColor,
}: {
  file: string | undefined;
  fallback?: string;
  pending?: boolean;
  missing?: string;
  size: number;
  className?: string;
  label?: string;
  iconColor?: string;
}) {
  const parts = svgParts(file);
  const shown = pending ? { viewBox: MATERIAL_VIEWBOX, inner: '' } : (parts ?? svgParts(helpFile));
  if (!shown) return null;
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...(parts || pending ? {} : { 'data-icon-missing': missing ?? '' })}
      {...(parts && fallback !== undefined ? { 'data-icon-fallback': fallback } : {})}
      {...(iconColor ? { 'data-icon-color': iconColor } : {})}
      suppressHydrationWarning={pending}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={shown.viewBox}
      dangerouslySetInnerHTML={{ __html: shown.inner }}
    />
  );
}

/** An icon as the theme's UI parts take it (packages/editor/theme/ui/): its name, as the site gives it, or an icon already
 * made, as the editor gives it (an icon component such as `materialIcon('add')`: <Plus />). */
export type IconRef = string | ReactElement<{ size?: number; className?: string }>;

/** An IconRef drawn: a name as Svg draws it, an icon made with this size and class. */
export function Glyph({ icon, size = 20, className }: { icon: IconRef; size?: number; className?: string }) {
  if (typeof icon === 'string') return <Svg name={icon} size={size} className={className} />;
  return isValidElement(icon)
    ? cloneElement(icon, { size, className: [icon.props.className, className].filter(Boolean).join(' ') || undefined })
    : null;
}

/** Material's "more_vert" (three dots in a column, m3.material.io Icons "More Vert"): the text bar's overflow button (`⋮`). Material Symbols' own file,
 * bundled like WidgetsIcon (the bar is drawn at once, not after the lazy Material set), and shaped as an icon component so a ToolbarButton takes it. */
export const MoreVertIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => {
  const parts = svgParts(moreVertFile);
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      data-icon="more_vert"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={parts?.viewBox ?? MATERIAL_VIEWBOX}
      dangerouslySetInnerHTML={{ __html: parts?.inner ?? '' }}
    />
  );
}) as unknown as IconComponent;

/** Preview (a page's text bar and its `⋮`) and View on site, by name through the icon pack: Material Symbols' `devices` and `open_in_new` (a pack's own if it has them), the same as the command palette draws. Shaped as an icon component so a
 * ToolbarButton and a MenuItem take them. */
export const PreviewIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => (
  <Svg name="devices" size={Number(size)} className={className} />
)) as unknown as IconComponent;
export const ViewOnSiteIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => (
  <Svg name="open_in_new" size={Number(size)} className={className} />
)) as unknown as IconComponent;

/** Material's "close" (a cross): the clear button of the text bar's block selection (the count with a cross). Material Symbols' own file, bundled like MoreVertIcon, shaped as a
 * icon component so a ToolbarButton takes it. */
export const CloseIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => {
  const parts = svgParts(closeFile);
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      data-icon="close"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={parts?.viewBox ?? MATERIAL_VIEWBOX}
      dangerouslySetInnerHTML={{ __html: parts?.inner ?? '' }}
    />
  );
}) as unknown as IconComponent;

/** Material's "match_case" (a capital A and a small a: "Aa"): the icon of the three body styles in the Text style menu, where the labels (Body small, medium,
 * large) tell them apart. Material Symbols' own file, bundled like WidgetsIcon, shaped as an icon component so a menu row takes it. */
export const AaIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => {
  const parts = svgParts(matchCaseFile);
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      data-icon="match_case"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={parts?.viewBox ?? MATERIAL_VIEWBOX}
      dangerouslySetInnerHTML={{ __html: parts?.inner ?? '' }}
    />
  );
}) as unknown as IconComponent;

/** The icons of the three body styles in the Text style menu: a squared, bold A with a number beside it, drawn on Material Symbols' 24 grid exactly as format_h2 and
 * format_h3 are (same cap height and baseline, 60-unit stroke, square corners, the digits copied from format_h1, -h2 and -h3), so the five read as one
 * set (src/icons/body-a*.svg). The menu lists the largest first, as the headings: Body large A1, Body medium A2, Body small A3. Bundled files like AaIcon, so they draw
 * the same in every icon pack and in light and dark (currentColor). */
const bodyA = (file: string, name: string) =>
  (({ size = 20, className }: { size?: number | string; className?: string }) => {
    const parts = svgParts(file);
    return (
      <svg
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        data-icon={name}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={parts?.viewBox ?? MATERIAL_VIEWBOX}
        dangerouslySetInnerHTML={{ __html: parts?.inner ?? '' }}
      />
    );
  }) as unknown as IconComponent;
export const BodyA1Icon = bodyA(bodyA1File, 'body_a1');
export const BodyA2Icon = bodyA(bodyA2File, 'body_a2');
export const BodyA3Icon = bodyA(bodyA3File, 'body_a3');

/** The two block icons, one family built on Material Symbols' `widgets` (outlined, 400, @material-symbols/svg-400 0.48.2) on the 24 grid (src/icons/add-block.svg and
 * block-settings.svg). Both keep widgets' top-left square, its diamond and its bottom-left square exactly and put a mark where its bottom-right square was:
 * AddBlockIcon the plus copied from `dashboard_customize` (same place and size); BlockSettingsIcon a small cog, the inner cog of `settings_applications`
 * scaled into the plus's 330-unit cell (same size and position as the plus, stroke about 48 units). AddBlockIcon is "insert/add a block" (the text bar's Insert
 * block); BlockSettingsIcon is "this block's settings" (the bar's gear, the block row's Settings). A plain plus or cog still means add or settings of
 * anything else. Bundled files, so they draw the same in every icon pack and in light and dark (currentColor). */
export const AddBlockIcon = bodyA(addBlockFile, 'add_block');
export const BlockSettingsIcon = bodyA(blockSettingsFile, 'block_settings');

/** An icon as a component, for the places that take one (a table of icons by id, a prop `icon: IconComponent`): the props an icon takes (`size`, `className`,
 * `weight`; the SVG's own, as aria-hidden, go to the SVG). */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; weight?: IconWeight }>;

const made = new Map<string, IconComponent>();
/** A Material Symbols icon by its Material name as a component (`materialIcon('settings')`), drawn by `Icon`; the same name gives the same component, so it can be a
 * module constant or a key. `fill`: the filled icon (a component's `weight="fill"` also asks for it). */
export function materialIcon(name: string, fill?: 'fill'): IconComponent {
  const key = `${name}:${fill ?? ''}`;
  let component = made.get(key);
  if (!component) {
    component = (({ size = 20, className, weight }: { size?: number | string; className?: string; weight?: IconWeight }) => (
      <Svg name={name} size={Number(size)} className={className} weight={weight === 'fill' ? 'fill' : fill} />
    )) as IconComponent;
    made.set(key, component);
  }
  return component;
}

/** A brand's logo from the brand pack as a component (`brandIcon('google')`), for the places that take one: the same under every icon pack. */
export const brandIcon = (brand: (typeof BRANDS)[number]): IconComponent => materialIcon(`${brand}-logo`);

/** The same as Svg (the editor's fields and the site's promotions draw their icons with it). */
export const Icon = Svg;

/** The icons to pick from on the standard blocks (a field with `icons`: Cards); this site's own
 * fields have the same (`icons` in packages/editor/defaults/collections.ts). */
export const iconNames = [
  'workspace_premium',
  'favorite',
  'volunteer_activism',
  'groups',
  'group',
  'school',
  'handshake',
  'menu_book',
  'auto_stories',
  'military_tech',
  'forum',
  'spa',
  'eco',
  'lightbulb',
  'train',
  'directions_bus',
  'pedal_bike',
  'directions_car',
  'door_open',
  'videocam',
  'support',
  'call',
  'schedule',
  'location_on',
  'coffee',
  'accessible',
  'info',
  'mail',
] as const;

/** The icons to pick from as the options of a field, with their names (t.blocks.icons). */
export const iconOptions = (names: Record<(typeof iconNames)[number], string>) =>
  iconNames.map((value) => ({ label: names[value], value }));
