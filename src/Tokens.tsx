// "Dele" › "Værdier" (#appearance/dele/vaerdier): the theme's design tokens, as the theme in use sets them, to see them in one
// place: the corners, one row for each size the theme uses (the theme's base, base.css and components.css, which every
// theme has, and its UI parts', ui.css: each part's own variable, else the one ui.css gives it instead), named by
// Material 3's corner radius scale where the size is one of its steps, with what has it under; the shadows, one row for
// each of Material 3's elevation levels (ui.css, set by the theme to its own look) with what has it under (the theme's
// panels and blocks and its UI parts at rest, hovered and dragged), and one for each shadow that is none of them; the
// typography: the typeface and Material 3's type scale (ui.css), each step with its size, line height, weight and
// tracking; and the site's colours (colorFields, "Farver") in the mode the editor is in. Each row has a sample drawn
// with the value (LeadingToken), read from the page (getComputedStyle), so a theme's own values show without the editor
// knowing them, and they follow light and dark mode. Nothing here is saved.
import { useEffect, useState, type ReactNode } from 'react';
import { colorFields } from './site';
import Screen from './Screen';
import { Group, LeadingToken, ListItem, type TokenKind } from './ui';
import { locale, t } from './i18n';

const say = t.parts.tokens;
const back = { href: '#appearance/dele', label: t.common.parts.editorParts };

/** A token: its CSS variable, its name here, and for a part's own the token or the value ui.css gives it when the theme
 * does not set it (its `var(--chip-radius, var(--block-control-radius))`). */
type Token = { token: string; label: string; fallback?: string };

const shape: Token[] = [
  { token: '--radius', label: say.shape.radius },
  { token: '--radius-small', label: say.shape.radiusSmall },
  { token: '--block-radius', label: say.shape.blockRadius },
  { token: '--block-radius-small', label: say.shape.blockRadiusSmall },
  { token: '--block-control-radius', label: say.shape.blockControlRadius },
  { token: '--theme-picture-radius', label: say.shape.pictureRadius },
  { token: '--theme-post-picture-radius', label: say.shape.postPictureRadius },
  { token: '--theme-logo-tile-radius', label: say.shape.logoTileRadius },
];

// The UI parts' corners, with what ui.css gives each when the theme does not set it.
const parts: Token[] = [
  { token: '--button-radius', label: say.parts.button, fallback: '--block-control-radius' },
  { token: '--chip-radius', label: say.parts.chip, fallback: '--block-control-radius' },
  { token: '--text-field-radius', label: say.parts.textField, fallback: '--block-control-radius' },
  { token: '--card-radius', label: say.parts.card, fallback: '--block-radius' },
  { token: '--menu-radius', label: say.parts.menu, fallback: '--block-radius-small' },
  { token: '--dialog-radius', label: say.parts.dialog, fallback: '--block-radius' },
  { token: '--bottom-sheet-radius', label: say.parts.bottomSheet, fallback: '--block-radius' },
  { token: '--side-sheet-radius', label: say.parts.sideSheet, fallback: '--block-radius' },
  { token: '--fab-radius', label: say.parts.fab, fallback: '--block-radius-small' },
  { token: '--snackbar-radius', label: say.parts.snackbar, fallback: '1rem' },
  { token: '--search-bar-radius', label: say.parts.searchBar, fallback: '--block-control-radius' },
];

// Material 3's elevation levels (ui.css, which every theme has, set to the theme's own look).
const LEVELS = [0, 1, 2, 3, 4, 5];

// What has a shadow: the theme's panels and blocks, then the UI parts at rest, pointed at and dragged, each with what
// ui.css gives it when the theme does not set it (Material 3's level, the list under "Elevation" in ui.css). Only the
// parts with a variable of their own; the others are always level 0.
const shadows: Token[] = [
  { token: '--shadow', label: say.elevation.shadow },
  { token: '--block-shadow', label: say.elevation.blockShadow },
  { token: '--button-filled-shadow', label: say.partShadows.buttonFilled, fallback: '--elevation-0' },
  { token: '--button-tonal-shadow', label: say.partShadows.buttonTonal, fallback: '--elevation-0' },
  { token: '--button-elevated-shadow', label: say.partShadows.buttonElevated, fallback: '--elevation-1' },
  { token: '--chip-elevated-shadow', label: say.partShadows.chipElevated, fallback: '--elevation-1' },
  { token: '--card-filled-shadow', label: say.partShadows.cardFilled, fallback: '--elevation-0' },
  { token: '--card-outlined-shadow', label: say.partShadows.cardOutlined, fallback: '--elevation-0' },
  { token: '--card-elevated-shadow', label: say.partShadows.cardElevated, fallback: '--elevation-1' },
  { token: '--switch-handle-shadow', label: say.partShadows.switchHandle, fallback: '--elevation-1' },
  { token: '--slider-handle-shadow', label: say.partShadows.sliderHandle, fallback: '--elevation-1' },
  { token: '--menu-shadow', label: say.partShadows.menu, fallback: '--elevation-2' },
  { token: '--tooltip-rich-shadow', label: say.partShadows.tooltipRich, fallback: '--elevation-2' },
  { token: '--dialog-shadow', label: say.partShadows.dialog, fallback: '--elevation-3' },
  { token: '--bottom-sheet-shadow', label: say.partShadows.bottomSheet, fallback: '--elevation-1' },
  { token: '--bottom-sheet-shadow-large', label: say.partShadows.bottomSheetLarge, fallback: '--elevation-3' },
  { token: '--side-sheet-shadow', label: say.partShadows.sideSheet, fallback: '--elevation-1' },
  { token: '--navigation-drawer-shadow', label: say.partShadows.navigationDrawer, fallback: '--elevation-1' },
  { token: '--navigation-bar-shadow', label: say.partShadows.navigationBar, fallback: '--elevation-0' },
  { token: '--navigation-rail-modal-shadow', label: say.partShadows.navigationRailModal, fallback: '--elevation-2' },
  { token: '--top-app-bar-stuck-shadow', label: say.partShadows.topAppBarStuck, fallback: '--elevation-2' },
  { token: '--fab-shadow', label: say.partShadows.fab, fallback: '--elevation-3' },
  { token: '--toolbar-floating-shadow', label: say.partShadows.toolbarFloating, fallback: '--elevation-3' },
  { token: '--search-bar-shadow', label: say.partShadows.searchBar, fallback: '--elevation-0' },
  { token: '--search-view-shadow', label: say.partShadows.searchView, fallback: '--elevation-3' },
  { token: '--snackbar-shadow', label: say.partShadows.snackbar, fallback: '--elevation-3' },
  { token: '--button-toggle-selected-shadow', label: say.partShadows.buttonToggleSelected, fallback: '--elevation-0' },
  // Pointed at (hover) and dragged, as ui.css draws them: their own variable, else the part's at rest, else the level.
  ...[
    ['--button-filled', say.partShadows.buttonFilled, 1],
    ['--button-tonal', say.partShadows.buttonTonal, 1],
    ['--button-elevated', say.partShadows.buttonElevated, 2],
    ['--button-toggle-selected', say.partShadows.buttonToggleSelected, 1],
    ['--chip-elevated', say.partShadows.chipElevated, 2],
    ['--card-filled', say.partShadows.cardFilled, 1],
    ['--card-outlined', say.partShadows.cardOutlined, 1],
    ['--card-elevated', say.partShadows.cardElevated, 2],
    ['--fab', say.partShadows.fab, 4],
  ].map(([part, label, level]) => ({
    token: `${part}-hover-shadow`,
    label: say.partShadows.hovered(label as string),
    fallback: `var(${part}-shadow, var(--elevation-${level}))`,
  })),
  { token: '--chip-selected-hover-shadow', label: say.partShadows.hovered(say.partShadows.chipSelected), fallback: '--elevation-1' },
  { token: '--chip-dragged-shadow', label: say.partShadows.dragged(say.partShadows.chip), fallback: '--elevation-4' },
  { token: '--card-filled-dragged-shadow', label: say.partShadows.dragged(say.partShadows.cardFilled), fallback: '--elevation-3' },
  { token: '--card-outlined-dragged-shadow', label: say.partShadows.dragged(say.partShadows.cardOutlined), fallback: '--elevation-3' },
  { token: '--card-elevated-dragged-shadow', label: say.partShadows.dragged(say.partShadows.cardElevated), fallback: '--elevation-4' },
];

const typeface: Token = { token: '--font-sans', label: say.type.typeface };

/** Material 3's type scale (m3.material.io/styles/typography/type-scale-tokens, ui.css): its five roles, each in three
 * sizes, largest first, each a set of variables (--type-display-large-size, -line-height, -weight, -tracking). */
type Role = keyof typeof say.type.roles;
type Size = keyof typeof say.type.sizes;
const typeScale: { role: Role; size: Size; token: string }[] = (Object.keys(say.type.roles) as Role[]).flatMap((role) =>
  (Object.keys(say.type.sizes) as Size[]).map((size) => ({ role, size, token: `--type-${role}-${size}` })),
);

/** A length in px ("3.5625rem" is "57px" with 16px text, "-0.015625rem" "-0.25px"); anything else as it is. */
function inPixels(value: string, rootSize: number) {
  const length = /^(-?[\d.]+)(rem|px)$/.exec(value);
  return length ? `${+(parseFloat(length[1]) * (length[2] === 'rem' ? rootSize : 1)).toFixed(2)}px` : value || '–';
}

/** What is under a step's name: its variables and their values, in px. */
function typeValues(token: string, style: CSSStyleDeclaration, rootSize: number) {
  const read = (part: string) => style.getPropertyValue(`${token}-${part}`).trim();
  return say.type.values(
    `${token}-*`,
    inPixels(read('size'), rootSize),
    inPixels(read('line-height'), rootSize),
    read('weight') || '–',
    inPixels(read('tracking'), rootSize),
  );
}

const colors: Token[] = colorFields.map((f) => ({ token: `--${f.name}`, label: f.label }));

const groups: { kind: TokenKind; title: string; tokens: Token[] }[] = [{ kind: 'color', title: say.groups.color, tokens: colors }];

/** A count of the times the page's look may have changed (light or dark mode, the colours loaded into <head>), so the
 * values are read again. */
function useLookChanges() {
  const [changes, setChanges] = useState(0);
  useEffect(() => {
    const changed = () => setChanges((n) => n + 1);
    const observer = new MutationObserver(changed);
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    const dark = matchMedia('(prefers-color-scheme: dark)');
    dark.addEventListener('change', changed);
    return () => {
      observer.disconnect();
      dark.removeEventListener('change', changed);
    };
  }, []);
  return changes;
}

/** A value with its size in pixels after it, when it is given in rem ("0.75rem (12px)"). */
function withPixels(value: string, rootSize: number) {
  const rem = /^(-?[\d.]+)rem$/.exec(value);
  return rem ? `${value} (${+(parseFloat(rem[1]) * rootSize).toFixed(2)}px)` : value;
}

/** What is under a token's name: the token and its value; for a part's token the theme does not set, the value it gets
 * instead and where from. */
function described({ token, fallback }: Token, style: CSSStyleDeclaration, rootSize: number) {
  const read = (name: string) => withPixels(style.getPropertyValue(name).trim(), rootSize);
  const own = read(token);
  if (own || !fallback) return say.value(token, own || '–');
  return fallback.startsWith('--') ? say.from(token, read(fallback), fallback) : say.value(token, withPixels(fallback, rootSize));
}

/** Material 3's corner radius scale (m3.material.io/styles/shape/corner-radius-scale): its steps by their size in px. */
const steps: [px: number, name: keyof typeof say.steps][] = [
  [0, 'none'],
  [4, 'extraSmall'],
  [8, 'small'],
  [12, 'medium'],
  [16, 'large'],
  [20, 'largeIncreased'],
  [28, 'extraLarge'],
  [32, 'extraLargeIncreased'],
  [48, 'extraExtraLarge'],
];

/** From this size a corner is full: as round as the part is high (a pill, a circle). */
const FULL = 999;

/** A corner's size in px ("0.75rem" is 12 with 16px text), or undefined when it is not one length (a calc(), four
 * corners). */
function pixels(value: string, rootSize: number) {
  const length = /^(-?[\d.]+)(rem|px)?$/.exec(value);
  if (!length || (!length[2] && parseFloat(length[1]) !== 0)) return undefined;
  return parseFloat(length[1]) * (length[2] === 'rem' ? rootSize : 1);
}

/** A row's name in a list after the first ("Panels, blocks and cards"): its first letter small, unless it is an
 * abbreviation ("FAB"). */
const inList = (label: string, first: boolean) =>
  first || /^\p{Lu}{2}/u.test(label) ? label : label.charAt(0).toLocaleLowerCase(locale) + label.slice(1);

type Corner = { key: string; px?: number; value: string; uses: string[] };

/** The theme's corners, one for each size, smallest first and full last, with the names of what has each. */
function corners(style: CSSStyleDeclaration, rootSize: number): Corner[] {
  const bySize = new Map<string, Corner>();
  for (const x of [...shape, ...parts]) {
    const own = style.getPropertyValue(x.token).trim();
    const value = own || (x.fallback?.startsWith('--') ? style.getPropertyValue(x.fallback).trim() : (x.fallback ?? ''));
    if (!value) continue;
    const measured = pixels(value, rootSize);
    const px = measured === undefined ? undefined : Math.min(measured, FULL);
    const key = px === undefined ? value : String(px);
    const corner = bySize.get(key) ?? { key, px, value: px === undefined ? value : `${px}px`, uses: [] };
    corner.uses.push(x.label);
    bySize.set(key, corner);
  }
  return [...bySize.values()].sort((a, b) => (a.px ?? Infinity) - (b.px ?? Infinity));
}

/** A corner's name: Material's step and its size ("Medium (12px)"), full, or only its size when it is not a step. */
function cornerName({ px, value }: Corner) {
  if (px === undefined) return value;
  if (px >= FULL) return say.steps.full;
  const step = steps.find(([size]) => size === px);
  const size = `${+px.toFixed(2)}px`;
  return step ? say.step(say.steps[step[1]], size) : size;
}

/** A token's value as CSS, with what ui.css gives it when the theme does not set it. */
const cssValue = (x: Token) => (x.fallback ? `var(${x.token}, ${cssOf(x.fallback)})` : `var(${x.token})`);

/** The shadows: a row for each elevation level with what has it, then one for each shadow that is none of them. Each
 * shadow is read as the browser draws it (a probe's box-shadow), so the same shadow written two ways is one; no shadow
 * ("none") is level 0. */
function shadowRows() {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.append(probe);
  const drawn = (css: string) => {
    probe.style.boxShadow = css;
    return getComputedStyle(probe).boxShadow;
  };
  const levels = LEVELS.map((n) => drawn(`var(--elevation-${n})`));
  const none = drawn('none');
  const own = new Map<string, Token[]>();
  const onLevel: Token[][] = LEVELS.map(() => []);
  for (const x of shadows) {
    const value = drawn(cssValue(x));
    const level = value === none ? 0 : levels.indexOf(value);
    if (level >= 0) onLevel[level].push(x);
    else own.set(value, [...(own.get(value) ?? []), x]);
  }
  probe.remove();
  return [
    ...LEVELS.map((n) => ({
      key: `--elevation-${n}`,
      sample: `var(--elevation-${n})`,
      title: say.elevation.level(n),
      uses: onLevel[n].map((x) => x.label),
    })),
    ...[...own].map(([value, tokens]) => ({
      key: value,
      sample: value,
      title: say.elevation.own,
      uses: tokens.map((x) => x.label),
    })),
  ];
}

export default function Tokens() {
  useLookChanges();
  const style = getComputedStyle(document.documentElement);
  const rootSize = parseFloat(style.fontSize) || 16;
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });
  return (
    <Screen title={t.parts.screens.values} back={back}>
      <p className="mb-8 text-muted">{say.intro}</p>
      <Group title={say.groups.shape}>
        {corners(style, rootSize).map((c) => (
          <ListItem
            key={c.key}
            leading={<LeadingToken kind="shape" value={c.value} />}
            headline={cornerName(c)}
            supporting={list.format(c.uses.map((label, i) => inList(label, i === 0)))}
          />
        ))}
      </Group>
      <Group title={say.groups.elevation}>
        {shadowRows().map((r) => (
          <ListItem
            key={r.key}
            leading={<LeadingToken kind="elevation" value={r.sample} />}
            headline={r.title}
            supporting={r.uses.length ? list.format(r.uses.map((label, i) => inList(label, i === 0))) : say.elevation.unused}
          />
        ))}
      </Group>
      <Group title={say.groups.type}>
        <TokenRow kind="font" value={cssValue(typeface)} label={typeface.label}>
          {described(typeface, style, rootSize)}
        </TokenRow>
        {typeScale.map(({ role, size, token }) => (
          <TokenRow
            key={token}
            kind="font"
            value={cssValue(typeface)}
            weight={`var(${token}-weight)`}
            label={say.type.step(say.type.roles[role], say.type.sizes[size])}
          >
            {typeValues(token, style, rootSize)}
          </TokenRow>
        ))}
      </Group>
      {groups.map((g) => (
        <Group key={g.title} title={g.title}>
          {g.tokens.map((x) => (
            <TokenRow key={x.token} kind={g.kind} value={cssValue(x)} label={x.label}>
              {described(x, style, rootSize)}
            </TokenRow>
          ))}
        </Group>
      ))}
    </Screen>
  );
}

/** A token's row: its sample, its name and what is under the name. */
function TokenRow({
  kind,
  value,
  weight,
  label,
  children,
}: {
  kind: TokenKind;
  value: string;
  weight?: string;
  label: string;
  children: ReactNode;
}) {
  return <ListItem leading={<LeadingToken kind={kind} value={value} weight={weight} />} headline={label} supporting={children} />;
}

/** A fallback as CSS: a token by its variable, else the value itself. */
const cssOf = (fallback: string) => (fallback.startsWith('--') ? `var(${fallback})` : fallback);
