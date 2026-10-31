// Every icon the site draws, on the site and in the editor alike, by its name: Phosphor's (regular, and a filled one as
// `<name>-fill`), which the site's build puts the theme's own in place of (its icons/<name>.svg, else the icon pack in
// use's, packages/editor/site/iconPacks.mjs: themePlugin in packages/editor/site/theme.mjs, which answers the imports below with them). The names are Phosphor's, as
// the content stores them (a card's `icon: certificate`), so a theme without one still draws it.
// Phosphor's here are those the site draws: the blocks' (src/themes/<theme>/blocks/, src/apps/<app>/blocks/), the
// theme's parts' (Icon.astro, MobileMenu.tsx …) and those to pick from (iconNames, and `icons` in collections.ts,
// shown as icons by fields.tsx). A name that is not among them is drawn as MISSING, the question mark, marked with
// data-icon-missing (its name), which check:screens finds on the built site's pages and the editor's screens.
import { cloneElement, isValidElement, useEffect, useState, type ComponentType, type ReactElement } from 'react';
import { svgParts } from '../lib/svg.mjs';

const PHOSPHOR = '../node_modules/@phosphor-icons/core/assets/';
const regular = import.meta.glob<string>(
  '../node_modules/@phosphor-icons/core/assets/regular/{arrow-left,arrow-right,arrow-square-out,arrow-up-right,bank,bicycle,book-open,book-open-text,bus,calendar-blank,car,caret-down,caret-left,caret-right,certificate,chats,check,clock,coffee,cookie,copy,device-mobile,door-open,download-simple,envelope-simple,eye,eye-slash,flower-lotus,graduation-cap,hand-heart,handshake,heart,house,info,keyboard,leaf,lifebuoy,lightbulb,list,magnifying-glass,map-pin,map-trifold,medal,minus,moon,pencil-simple,phone,question,sun,ticket,train,trash,user,users,users-three,video-camera,warning-circle,wheelchair,x}.svg',
  { query: '?raw', import: 'default', eager: true },
);
// The filled ones ("Video": its play button).
const fills = import.meta.glob<string>('../node_modules/@phosphor-icons/core/assets/fill/{play-fill}.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The icon drawn for one that is not found (a name the site does not draw, one Phosphor does not have): a question
 * mark, the icon pack's as the others. */
export const MISSING = 'question';

/** An icon's SVG file by its name: the theme's, else Phosphor's; undefined for one the site does not draw. */
export function iconFile(name: string, weight?: 'fill'): string | undefined {
  return weight ? fills[`${PHOSPHOR}fill/${name}-${weight}.svg`] : regular[`${PHOSPHOR}regular/${name}.svg`];
}

/** An icon by name as the site and the editor draw it (the theme's View.tsx and its parts, Icon.astro, the editor's
 * fields): the bare <svg> in its file's viewBox, at the size given, in the text's colour, hidden from screen readers
 * (or named by `label`). A filled one the site does not draw is the regular one, and an icon it does not draw MISSING. */
export function Svg({
  name,
  size = 20,
  weight,
  className,
  label,
}: {
  name: string;
  size?: number;
  weight?: 'fill';
  className?: string;
  label?: string;
}) {
  const file = iconFile(name, weight) ?? iconFile(name);
  return <Drawn file={file} missing={file ? undefined : name} size={size} className={className} label={label} />;
}

/** An icon by its name of all Phosphor's, not only those the site draws (an app's in the app store, store.ts): one the
 * site draws at once, another from all Phosphor's (allIcons.ts, loaded the first time one is drawn), the theme's in
 * their place as Svg's. Nothing while it loads, and MISSING for a name Phosphor does not have. */
export function AnyIcon({ name, size = 20 }: { name: string; size?: number }) {
  // null: not found.
  const [file, setFile] = useState<string | null | undefined>(() => iconFile(name));
  useEffect(() => {
    if (iconFile(name)) return setFile(iconFile(name));
    setFile(undefined);
    let on = true;
    import('./allIcons').then((m) => on && setFile(m.allIcons[`${PHOSPHOR}regular/${name}.svg`] ?? null));
    return () => {
      on = false;
    };
  }, [name]);
  if (file === undefined) return null;
  return <Drawn file={file ?? undefined} missing={file ? undefined : name} size={size} />;
}

/** An icon's SVG file drawn as it is, as Svg draws one, not the theme's in its place: an icon pack's own, to show what the
 * pack looks like (IconSwatches in ui.tsx, "Ikonpakker"). */
export function SvgFile({ file, size = 20 }: { file: string; size?: number }) {
  return <Drawn file={file} size={size} />;
}

/** An SVG file drawn; MISSING in its place when there is none, or it is not an SVG (`missing`: the name asked for). */
function Drawn({
  file,
  missing,
  size,
  className,
  label,
}: {
  file: string | undefined;
  missing?: string;
  size: number;
  className?: string;
  label?: string;
}) {
  const parts = svgParts(file);
  const shown = parts ?? svgParts(iconFile(MISSING));
  if (!shown) return null;
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...(parts ? {} : { 'data-icon-missing': missing ?? '' })}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={shown.viewBox}
      dangerouslySetInnerHTML={{ __html: shown.inner }}
    />
  );
}

/** An icon as the theme's UI parts take it (packages/editor/theme/ui/): its name, as the site gives it, or an icon already
 * made, as the editor gives it (a React icon from @phosphor-icons/react, the theme's in its place: <Plus />, or an icon component: Plus). */
export type IconRef = string | ReactElement<{ size?: number; className?: string }> | ComponentType<{ size?: number; className?: string }>;

/** An IconRef drawn: a name as Svg draws it, an icon component invoked, or an icon element cloned with this size and class. */
export function Glyph({ icon, size = 20, className }: { icon: IconRef; size?: number; className?: string }) {
  if (typeof icon === 'string') return <Svg name={icon} size={size} className={className} />;
  if (typeof icon === 'function') {
    const IconComp = icon;
    return <IconComp size={size} className={className} />;
  }
  return isValidElement(icon)
    ? cloneElement(icon, { size, className: [icon.props.className, className].filter(Boolean).join(' ') || undefined })
    : null;
}

/** The same as Svg (the editor's fields and the site's promotions draw their icons with it). */
export const Icon = Svg;

/** The icons to pick from on the standard blocks (a field with `icons`: Kort); this site's own
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
