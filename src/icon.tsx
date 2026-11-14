// Every icon the site draws, on the site and in the editor alike, by its name: Phosphor's (regular, and a filled one as
// `<name>-fill`; a name only, never a glyph unless Phosphor is the icon pack in use: with another pack the virtual sets
// hold the pack's icons alone, so a name neither it nor Material Symbols has is MISSING), which the site's build puts the theme's own in place of (themePlugin, packages/editor/site/theme.mjs), else
// a backup from Material Symbols (Outlined) by its Material name (`drag_indicator`, marked data-icon-fallback), else MISSING.
// Exposes Svg, AnyIcon, Icon, Glyph, SvgFile, MISSING, iconFile, iconNames; uses lib/materialIcon.mjs (the order), materialIcons.ts (lazy set).
//
// The names are Phosphor's, as the content stores them (a card's `icon: certificate`), so a theme without one still draws it.
// Phosphor's here are those the site draws: the blocks' (src/themes/<theme>/blocks/, src/apps/<app>/blocks/), the
// theme's parts' (Icon.astro, MobileMenu.tsx …) and those to pick from (iconNames, and `icons` in collections.ts,
// shown as icons by fields.tsx). A name that is not among them is drawn from Material Symbols when it has one (the
// server render has the whole set at once, virtual:material-symbols-ssr; in the browser it is one lazy chunk, loaded the
// first time one is drawn); only a name Material Symbols lacks too is MISSING, the question mark, marked with
// data-icon-missing (its name), which check:screens finds on the built site's pages and the editor's screens.
import { cloneElement, isValidElement, useEffect, useState, type ReactElement } from 'react';
import { materialName, materialNames, resolveIcon } from '../lib/materialIcon.mjs';
import { svgParts } from '../lib/svg.mjs';
import ssrMaterial from 'virtual:material-symbols-ssr';
import addFile from '@material-symbols/svg-400/outlined/add.svg?raw';
import moreVertFile from '@material-symbols/svg-400/outlined/more_vert.svg?raw';
import closeFile from '@material-symbols/svg-400/outlined/close.svg?raw';
import bodyA1File from './icons/body-a1.svg?raw';
import bodyA2File from './icons/body-a2.svg?raw';
import bodyA3File from './icons/body-a3.svg?raw';
import matchCaseFile from '@material-symbols/svg-400/outlined/match_case.svg?raw';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { allIcons as ssrPhosphor } from 'virtual:all-icons-ssr';

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
// All Phosphor's icons (regular, the theme's in their place) by their file: at once on the server render, else after the lazy chunk.
let phosphorSet: Record<string, string> | undefined = import.meta.env.SSR ? ssrPhosphor : undefined;
let phosphorLoading: Promise<void> | undefined;
const loadPhosphor = () =>
  (phosphorLoading ??= import('./allIcons').then((m) => {
    phosphorSet = m.allIcons;
  }));
const PHOSPHOR_REGULAR = '/node_modules/@phosphor-icons/core/assets/regular/';
const phosphorLookup = () => (phosphorSet ? (name: string) => phosphorSet?.[`${PHOSPHOR_REGULAR}${name}.svg`] : undefined);
/** The names of Phosphor's icons the site's list does not have and Material Symbols has none of by that name: those drawn
 * from Phosphor's own set (resolveIcon). */
const phosphorOnly = (materials: Set<string>) =>
  Object.keys(phosphorSet ?? {})
    .map((path) => path.slice(PHOSPHOR_REGULAR.length, -'.svg'.length))
    .filter((name) => !materials.has(materialName(name) ?? ''));

/** The names of all the icons the site draws by their names but its list: all of Material Symbols' and those of Phosphor's
 * Material has not. A picked one is stored by its name, and the site draws it as the fallback above. Undefined until the lazy set is loaded, which `wanted` asks for (the icon picker's search). */
export function useAllIconNames(wanted: boolean): string[] | undefined {
  const build = () => {
    if (!materialSet || !phosphorSet) return undefined;
    const materials = materialNames(Object.keys(materialSet));
    return [...materials, ...phosphorOnly(new Set(materials))].sort();
  };
  const [names, setNames] = useState<string[] | undefined>(build);
  useEffect(() => {
    if (!wanted || names) return;
    Promise.all([loadMaterial(), loadPhosphor()]).then(() => setNames(build()));
  }, [wanted, names]);
  return names;
}

/** Draws again when the lazy set has loaded, after it is asked for (`wanted`). */
function useMaterialLoaded(wanted: boolean) {
  const [again, redraw] = useState(0);
  useEffect(() => {
    // Material's set first; Phosphor's own only for a name Material has not.
    if (!wanted) return;
    if (!materialSet) loadMaterial().then(() => redraw((n) => n + 1));
    else if (!phosphorSet) loadPhosphor().then(() => redraw((n) => n + 1));
  }, [wanted, again]);
}

const PHOSPHOR = '/node_modules/@phosphor-icons/core/assets/';
const regular = import.meta.glob<string>(
  '/node_modules/@phosphor-icons/core/assets/regular/{arrow-left,arrow-right,arrow-square-out,arrow-up-right,bank,bicycle,book-open,book-open-text,bus,calendar-blank,car,caret-down,caret-left,caret-right,caret-up,certificate,chats,check,clock,coffee,cookie,copy,device-mobile,door-open,download-simple,envelope-simple,eye,eye-slash,facebook-logo,flower-lotus,graduation-cap,hand-heart,handshake,heart,house,info,keyboard,leaf,lifebuoy,lightbulb,link-simple,linkedin-logo,list,magnifying-glass,map-pin,map-trifold,medal,minus,moon,pencil-simple,phone,pinterest-logo,question,rows,sun,ticket,train,trash,user,users,users-three,video-camera,warning-circle,wheelchair,x,x-logo}.svg',
  { query: '?raw', import: 'default', eager: true },
);
// The filled ones ("Video": its play button; the navigation drawer's active item).
const fills = import.meta.glob<string>(
  '/node_modules/@phosphor-icons/core/assets/fill/{browser-fill,buildings-fill,certificate-fill,chart-line-up-fill,chats-fill,envelope-simple-fill,file-text-fill,folder-simple-fill,heart-fill,list-checks-fill,magnifying-glass-fill,megaphone-fill,newspaper-fill,paint-brush-broad-fill,play-fill,puzzle-piece-fill,shield-check-fill,square-half-bottom-fill,squares-four-fill,storefront-fill,tag-fill,toggle-right-fill,trash-fill,user-fill,wrench-fill}.svg',
  { query: '?raw', import: 'default', eager: true },
);

/** The icon drawn for one that is not found (a name the site does not draw, one Material Symbols does not have either): a
 * question mark, the icon pack's as the others. */
export const MISSING = 'question';

/** An icon's SVG file by its name: the theme's, else Phosphor's; undefined for one the site does not draw. */
export function iconFile(name: string, weight?: 'fill'): string | undefined {
  return weight ? fills[`${PHOSPHOR}fill/${name}-${weight}.svg`] : regular[`${PHOSPHOR}regular/${name}.svg`];
}

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
  const found = resolveIcon(name, weight, { list: iconFile, material: materialLookup(), phosphor: phosphorLookup() });
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

/** An icon by its name of all Phosphor's, not only those the site draws (an app's in the app store, store.ts): one the
 * site draws at once, another from all Phosphor's (allIcons.ts, loaded the first time one is drawn), the theme's in
 * their place as Svg's. Then Material Symbols' by its Material name (marked data-icon-fallback). Nothing while it loads, and
 * MISSING for a name neither has. */
export function AnyIcon({ name, size = 20 }: { name: string; size?: number }) {
  // file null: not found; fallback: the file is Material Symbols'.
  const [found, setFound] = useState<{ file: string | null; fallback?: boolean } | undefined>(() => {
    const file = iconFile(name);
    return file ? { file } : undefined;
  });
  useEffect(() => {
    const own = iconFile(name);
    if (own) return setFound({ file: own });
    setFound(undefined);
    let on = true;
    (async () => {
      const phosphor = (await import('./allIcons')).allIcons[`${PHOSPHOR}regular/${name}.svg`];
      if (phosphor) return on && setFound({ file: phosphor });
      if (materialName(name)) await loadMaterial();
      const backup = resolveIcon(name, undefined, { list: () => undefined, material: materialLookup(), phosphor: () => undefined });
      if (on) setFound(backup.file ? { file: backup.file, fallback: true } : { file: null });
    })();
    return () => {
      on = false;
    };
  }, [name]);
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
  const shown = pending ? { viewBox: MATERIAL_VIEWBOX, inner: '' } : (parts ?? svgParts(iconFile(MISSING)));
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
 * made, as the editor gives it (a React icon from @phosphor-icons/react, the theme's in its place: <Plus />). */
export type IconRef = string | ReactElement<{ size?: number; className?: string }>;

/** An IconRef drawn: a name as Svg draws it, an icon made with this size and class. */
export function Glyph({ icon, size = 20, className }: { icon: IconRef; size?: number; className?: string }) {
  if (typeof icon === 'string') return <Svg name={icon} size={size} className={className} />;
  return isValidElement(icon)
    ? cloneElement(icon, { size, className: [icon.props.className, className].filter(Boolean).join(' ') || undefined })
    : null;
}

/** Material's "add" (a plus): the sign for "insert a block" (the text bar's Insert block button). Material Symbols' own file, bundled (the bar is drawn at once,
 * not after the lazy Material set), and shaped as a Phosphor icon so a ToolbarButton takes it. */
export const AddIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => {
  const parts = svgParts(addFile);
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      data-icon="add"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={parts?.viewBox ?? MATERIAL_VIEWBOX}
      dangerouslySetInnerHTML={{ __html: parts?.inner ?? '' }}
    />
  );
}) as unknown as PhosphorIcon;

/** Material's "more_vert" (three dots in a column, m3.material.io Icons "More Vert"): the text bar's overflow button (`⋮`). Material Symbols' own file,
 * bundled like WidgetsIcon (the bar is drawn at once, not after the lazy Material set), and shaped as a Phosphor icon so a ToolbarButton takes it. */
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
}) as unknown as PhosphorIcon;

/** Material's "close" (a cross): the clear button of the text bar's block selection (the count with a cross). Material Symbols' own file, bundled like AddIcon, shaped as a
 * Phosphor icon so a ToolbarButton takes it. */
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
}) as unknown as PhosphorIcon;

/** Material's "match_case" (a capital A and a small a: "Aa"): the icon of the three body styles in the Text style menu, where the labels (Body small, medium,
 * large) tell them apart. Material Symbols' own file, bundled like WidgetsIcon, shaped as a Phosphor icon so a menu row takes it. */
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
}) as unknown as PhosphorIcon;

/** The icons of the three body styles in the Text style menu: the "A" of Aa (Material's match_case) with a number beside it, with the digit the heading icons draw (Phosphor's text-h-one, -two and
 * -three, same size and weight, src/icons/body-a*.svg). The smallest style has the highest number: Body small A3, Body medium A2, Body large
 * A1. Bundled files like AaIcon, so they draw the same in every icon pack and in light and dark (currentColor). */
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
  }) as unknown as PhosphorIcon;
export const BodyA1Icon = bodyA(bodyA1File, 'body_a1');
export const BodyA2Icon = bodyA(bodyA2File, 'body_a2');
export const BodyA3Icon = bodyA(bodyA3File, 'body_a3');

/** The same as Svg (the editor's fields and the site's promotions draw their icons with it). */
export const Icon = Svg;

/** The icons to pick from on the standard blocks (a field with `icons`: Cards); this site's own
 * fields have the same (`icons` in packages/editor/defaults/collections.ts). */
export const iconNames = [
  'certificate',
  'heart',
  'hand-heart',
  'users-three',
  'users',
  'graduation-cap',
  'handshake',
  'book-open',
  'book-open-text',
  'medal',
  'chats',
  'flower-lotus',
  'leaf',
  'lightbulb',
  'train',
  'bus',
  'bicycle',
  'car',
  'door-open',
  'video-camera',
  'lifebuoy',
  'phone',
  'clock',
  'map-pin',
  'coffee',
  'wheelchair',
  'info',
  'envelope-simple',
] as const;

/** The icons to pick from as the options of a field, with their names (t.blocks.icons). */
export const iconOptions = (names: Record<(typeof iconNames)[number], string>) =>
  iconNames.map((value) => ({ label: names[value], value }));
