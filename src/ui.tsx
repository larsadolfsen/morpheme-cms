// The editor's parts: every button, field, switch, chip and row a screen is made of, each with one
// look, set here. A screen uses these and never writes the classes of a button or a field itself
// (CLAUDE.md), so the editor looks the same everywhere and a change here changes it everywhere. They
// are all shown, in every state, on the screen #appearance/parts (Parts.tsx). The screen itself, with its top bar,
// is Screen.tsx.
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type DialogHTMLAttributes,
  type DOMAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type FocusEvent,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  ArrowsDownUp,
  CaretDown,
  CaretRight,
  CaretUp,
  Check,
  CheckCircle,
  Funnel,
  LockSimple,
  LockSimpleOpen,
  PencilSimple,
  Plus,
  Sidebar,
  SidebarSimple,
  X,
  type Icon,
} from '@phosphor-icons/react';
import {
  SiteBadge,
  SiteBottomSheetHeader,
  siteBottomSheetContainerClass,
  siteBottomSheetFitClass,
  siteBottomSheetFullClass,
  SiteButton,
  SiteCard,
  siteCardClass,
  siteListClass,
  siteListClasses,
  SiteListItem,
  SiteListItemLeadingIcon,
  SiteMenu,
  SiteMenuItem,
  sitePlaceMenu,
  siteMenuItemClass,
  SiteCarousel,
  SiteCheckbox,
  SiteChip,
  SiteChipSet,
  SiteDivider,
  SiteDatePicker,
  SiteDialog,
  siteDialogModalClass,
  SiteFab,
  SiteFabMenu,
  SiteIconButton,
  SiteLoadingIndicator,
  SiteSearchBar,
  SiteNavigationDrawer,
  SiteNavigationRail,
  SiteNavigationRailItem,
  SiteNavigationDrawerBack,
  SiteNavigationDrawerItem,
  SiteNavigationDrawerRow,
  SiteNavigationDrawerSection,
  SiteNavigationDrawerSubitem,
  SiteNavigationDrawerToggle,
  siteNavigationDrawerDialogClass,
  siteFocusNavigationDrawerItem,
  SiteSegmentedButton,
  SiteSideSheet,
  SiteTab,
  SiteTabs,
  SiteSlider,
  SiteSettingRow,
  SiteSwitch,
  SiteTextField,
  SiteToolbar,
  SiteTopAppBar,
  SiteTextFieldButton,
  SiteTimePicker,
  dayPeriods,
  setUpFabMenu,
  siteRipples,
} from './themeUi';
import { locale, t } from './i18n';
import { InEditor, type ButtonKind, type IconButtonKind } from './standard/view';
import { SvgFile } from './icon';
import { countries, countryName, dialCodes, flagOf, regionOf } from './countries';
import { byText } from './schema';
import { contrast } from '../lib/colors';
import { motionTiming } from '../lib/motion';
import { atLeast, type Breakpoint } from '../lib/breakpoints.mjs';
import { swipeCloses } from '../lib/drawer-swipe.mjs';
import { menuLayout } from '../lib/menu-layout.mjs';

// The parts Material 3 has (a button, an icon button, a chip, a carousel …) are the theme's UI parts
// (packages/editor/theme/ui/, through themeUi.ts), the same the site draws, in the theme's design (its ui.css and
// styles/global.css): here only what the editor gives them (its icons, what a tap does). The editor's own parts (the
// SEO rating, the colour field, the form's layout …) take the theme's design from its variables (--block-radius,
// --block-radius-small, --block-shadow and the site's colours).

// ---------------------------------------------------------------------------------------------------
// Buttons

/** The theme's button (Material 3's buttons): filled, the one thing to do; tonal, an important step that is not the
 * main one; elevated, one on a coloured background; outlined, another choice beside it ("Annuller" too); text, a small
 * step on the side (Fjern, Tilføj). medium (the default): the width of its text on every screen (Gem ændringer); small: in a line of text or by a field (Skift billede, Tilføj tag). */
export type { ButtonKind };
export type ButtonSize = 'medium' | 'small';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  kind?: ButtonKind;
  size?: ButtonSize;
  /** Before the text. */
  icon?: Icon;
  /** Its action runs: disabled, and after a moment a loading indicator. */
  busy?: boolean;
  type?: 'button' | 'submit';
};

export function Button({ icon: Glyph, className, children, ...rest }: ButtonProps) {
  return (
    <SiteButton icon={Glyph && <Glyph />} className={className} {...rest}>
      {children}
    </SiteButton>
  );
}

/** A link that looks like a Button: to another screen, or a file to open or download. */
export function LinkButton({
  icon: Glyph,
  className,
  href = '',
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & { kind?: ButtonKind; size?: ButtonSize; icon?: Icon }) {
  return (
    <SiteButton href={href} icon={Glyph && <Glyph />} className={className} {...rest}>
      {children}
    </SiteButton>
  );
}

/** The theme's icon button: standard (grey: every icon button, the screen's own actions too) or filled (confirms: a
 * tick); `selected`: marked, while what it does applies (a filter, the open one); `badge`: how many are new (a
 * number), or that something is (true), which `label` says too, as the label is the button's name. */
type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  icon: Icon;
  /** What it does: its name for screen readers and its tooltip. */
  label: string;
  kind?: IconButtonKind;
  selected?: boolean;
  badge?: number | boolean;
  /** Its action runs: disabled, and after a moment a loading indicator. */
  busy?: boolean;
  type?: 'button' | 'submit';
};

export function IconButton({ icon: Glyph, label, ...rest }: IconButtonProps) {
  const tooltip = useTooltip(label, rest);
  return (
    <>
      <SiteIconButton icon={<Glyph />} label={label} {...rest} {...tooltip.on} />
      {tooltip.tip}
    </>
  );
}

/** A link that looks like an IconButton (+ on a list, Se på sitet, the account). */
export function IconLink({
  icon: Glyph,
  label,
  href = '',
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & {
  icon: Icon;
  label: string;
  kind?: IconButtonKind;
  selected?: boolean;
  badge?: number | boolean;
}) {
  const tooltip = useTooltip(label, rest);
  return (
    <>
      <SiteIconButton icon={<Glyph />} label={label} href={href} {...rest} {...tooltip.on} />
      {tooltip.tip}
    </>
  );
}

/** A tool in the text's toolbar (MarkdownEditor.tsx): the theme's icon button a little smaller (its --icon-button-size),
 * so the toolbar fits on a phone, and it keeps the cursor in the text while it is tapped. The only other size. With
 * `menu` it opens a Menu under it (the kinds of text, when the toolbar is too short): the theme's text button with the
 * icon and a small arrow after it. With `expanded` it shows or hides more of the toolbar (`controls`: the id of what it
 * shows). */
export function ToolbarButton({
  icon: Glyph,
  label,
  selected,
  menu,
  expanded,
  controls,
  onClick,
}: {
  icon: Icon;
  label: string;
  /** Marked while it applies where the cursor is (bold); undefined for a tool that is not on or off. */
  selected?: boolean;
  /** It opens a Menu: whether the menu is open. */
  menu?: boolean;
  /** It shows or hides more of the toolbar: whether that is shown. */
  expanded?: boolean;
  controls?: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const tooltip = useTooltip(label);
  const own = {
    'aria-pressed': selected,
    'aria-expanded': menu ?? expanded,
    'aria-controls': controls,
    onMouseDown: (e: MouseEvent) => e.preventDefault(),
    onClick,
    ...tooltip.on,
  };
  return (
    <>
      {menu === undefined ? (
        <SiteIconButton icon={<Glyph />} label={label} selected={selected} style={toolbarSize} {...own} />
      ) : (
        <SiteButton
          kind="text"
          size="xsmall"
          icon={<Glyph />}
          trailingIcon={<CaretDown />}
          aria-label={label}
          aria-haspopup="menu"
          {...own}
        >
          {null}
        </SiteButton>
      )}
      {tooltip.tip}
    </>
  );
}

/** The theme's toolbar (Material 3's, docked) with the text's tools (MarkdownEditor.tsx), close round them, without the
 * line a docked one has over it; `className` places it. */
export function Toolbar({
  ref,
  label,
  className,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SiteToolbar ref={ref} label={label} kind="docked" className={className} style={closeToolbar}>
      {children}
    </SiteToolbar>
  );
}

// The text's toolbar: the room round its tools and no line over it.
const closeToolbar = {
  '--toolbar-gap': '0.125rem',
  '--toolbar-docked-padding-block': '0.375rem',
  '--toolbar-docked-padding-inline': '0.375rem',
  '--toolbar-docked-line-width': '0',
} as CSSProperties;

// A tool's size in the text's toolbar.
const toolbarSize = { '--icon-button-size': '2.5rem' } as CSSProperties;

// ---------------------------------------------------------------------------------------------------
// Tooltips
// The handlers of an element that has a tooltip, which it may have itself too (they are both called).
type TooltipHandlers = Pick<
  DOMAttributes<HTMLElement>,
  'onPointerEnter' | 'onPointerLeave' | 'onPointerDown' | 'onFocus' | 'onBlur' | 'onKeyDown'
>;

/** Where a tooltip goes: under what it is about, in the middle, or over it when there is no room under it;
 * always inside the window. */
function placeTip(tip: HTMLElement, anchor: Element) {
  const at = anchor.getBoundingClientRect();
  const gap = 4;
  const below = at.bottom + gap + tip.offsetHeight <= innerHeight - 8;
  tip.style.top = `${below ? at.bottom + gap : at.top - gap - tip.offsetHeight}px`;
  tip.style.left = `${Math.max(8, Math.min(at.left + at.width / 2 - tip.offsetWidth / 2, innerWidth - tip.offsetWidth - 8))}px`;
}

/** An element's name as a tooltip (`on`: its handlers, `tip`: beside it): the theme's plain tooltip (.tooltip-plain in
 * its ui.css), shown after a moment under the mouse, and at once when the element gets the focus from the keyboard;
 * gone when the mouse leaves, on a tap, on Escape and when it loses the focus. Not on a phone, where the element's name
 * is read out instead. It is a popover (.editor-tooltip in editor.css), so it stands over everything, also a sheet, and
 * is not cut off by a list's frame. `own`: the element's own handlers, called too. It is not read out, as it says the
 * element's name. */
function useTooltip(text: string, own: TooltipHandlers = {}) {
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (anchor: Element) => {
    const el = tip.current;
    if (!el?.showPopover || !anchor.isConnected) return;
    try {
      if (!el.matches(':popover-open')) el.showPopover();
      placeTip(el, anchor);
    } catch {}
  };
  const hide = () => {
    clearTimeout(timer.current);
    const el = tip.current;
    try {
      if (el?.matches(':popover-open')) el.hidePopover();
    } catch {}
  };
  const on: TooltipHandlers = {
    onPointerEnter: (e) => {
      own.onPointerEnter?.(e);
      if (e.pointerType === 'touch') return;
      const anchor = e.currentTarget;
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => show(anchor), 500);
    },
    onPointerLeave: (e) => {
      own.onPointerLeave?.(e);
      hide();
    },
    onPointerDown: (e) => {
      own.onPointerDown?.(e);
      hide();
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      own.onFocus?.(e);
      if (e.currentTarget.matches(':focus-visible')) show(e.currentTarget);
    },
    onBlur: (e) => {
      own.onBlur?.(e);
      hide();
    },
    onKeyDown: (e) => {
      own.onKeyDown?.(e);
      if (e.key === 'Escape') hide();
    },
  };
  return {
    on,
    tip: (
      <span ref={tip} popover="manual" aria-hidden className="tooltip-plain editor-tooltip">
        {text}
      </span>
    ),
  };
}

// ---------------------------------------------------------------------------------------------------
// Fields

/** What a field says in itself, as the theme's text field does: its name on its edge (`label`; without it, it is named
 * by its form's Label or by `aria-label`), what it does under it (`hint`), what is wrong instead (`problem`, the field
 * marked; aria-invalid marks it without saying why) and how much it should have at most (`limit`: 12/60, marked past
 * it). */
export type InField = { label?: string; hint?: ReactNode; problem?: string; limit?: number };

const error = (problem: string | undefined, invalid: unknown) => problem || (invalid ? true : undefined);

/** The theme's text field, with what it says in itself (InField). `className` goes on the field around the <input> (its
 * width, its place). */
export function TextField({
  label,
  hint,
  problem,
  limit,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & InField & { ref?: Ref<HTMLInputElement> }) {
  return <SiteTextField label={label} supporting={hint} error={error(problem, rest['aria-invalid'])} limit={limit} {...rest} />;
}

/** The theme's text field of several lines (`rows` high), as TextField. */
export function TextArea({ label, hint, problem, limit, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & InField) {
  return <SiteTextField multiline label={label} supporting={hint} error={error(problem, rest['aria-invalid'])} limit={limit} {...rest} />;
}

/** The theme's date picker (Material 3's): a field to type a date in, with the calendar that picks it, with what it
 * says in itself (InField: under it the date's format when it has no hint) and its texts in the editor's language.
 * `value`: the day, as it is saved (2026-11-02), or '' for none. */
export function DatePicker({
  id,
  label = '',
  hint,
  problem,
  value,
  onChange,
}: InField & { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <SiteDatePicker
      id={id}
      name={id}
      label={label}
      supporting={hint}
      error={problem}
      value={value}
      texts={{ locale, ...t.common.datePicker }}
      onChange={(day: string) => onChange(day)}
    />
  );
}

/** The theme's time picker (Material 3's): a field to type a time in, with the clock that picks it, as DatePicker.
 * `value`: the time (12:00), or '' for none. */
export function TimePicker({
  id,
  label = '',
  hint,
  problem,
  value,
  onChange,
}: InField & { id: string; value: string; onChange: (value: string) => void }) {
  const [am, pm] = dayPeriods(locale);
  const { time, ...texts } = t.common.timePicker;
  return (
    <SiteTimePicker
      id={id}
      name={id}
      label={label || time}
      supporting={hint}
      error={problem}
      value={value}
      timeFormat={hour12 ? '12h' : '24h'}
      texts={{ locale, am, pm, ...texts }}
      onChange={onChange}
    />
  );
}

// Whether the editor's language writes the time with AM and PM.
const hour12 = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12 ?? false;

/** A date and a time ("2026-03-01T12:00", as it is saved): the theme's DatePicker with the field's name, and its
 * TimePicker beside it. A day without a time is at midnight; without a day it is none (''). */
export function DateTimeField({
  id,
  value,
  onChange,
  ...field
}: InField & { id: string; value: string; onChange: (value: string) => void }) {
  const [day = '', time = ''] = value.split('T');
  const join = (d: string, h: string) => (d ? `${d}T${h || '00:00'}` : '');
  return (
    <div className="grid gap-3 medium:grid-cols-[1fr_auto]">
      <DatePicker id={id} {...field} value={day} onChange={(d) => onChange(join(d, time))} />
      <TimePicker id={`${id}-time`} value={time.slice(0, 5)} onChange={(h) => onChange(join(day, h))} />
    </div>
  );
}

/** A field that is tapped to choose (Select, PagePicker, a phone number's country code): the theme's TextFieldButton,
 * a button in the text field, or with `href` a link (to a page with the choices), showing what is chosen (`children`)
 * with what it says in itself (InField) and an arrow at its end (`arrow`: CaretDown, the default, opens a sheet;
 * CaretRight leads to a page); `size="small"`: a small box without the name, for a row's choice (MenuRow). */
export function ChoiceField({
  href,
  arrow: Arrow = CaretDown,
  size,
  label,
  hint,
  problem,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & InField & { href?: string; arrow?: Icon; size?: 'small' }) {
  return (
    <SiteTextFieldButton label={label} supporting={hint} error={problem} size={size} href={href} trailingIcon={<Arrow />} {...rest}>
      {children}
    </SiteTextFieldButton>
  );
}

// A colour as it is typed: with or without #, three or six hex digits; as #rrggbb, or '' when it is none.
function colorOf(typed: string): string {
  const hex = typed.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`;
  return '';
}

// A colour as its hue (0-360), saturation and brightness (0-1), as the colour sheet picks it.
type Hsv = { h: number; s: number; v: number };

function hsvOf(color: string): Hsv {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = !d ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: max ? d / max : 0, v: max };
}

function hexOf({ h, s, v }: Hsv): string {
  const part = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${part(5)}${part(3)}${part(1)}`;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));
// The edge of a swatch: grey, so a light and a dark colour both show on a light and a dark sheet.
const swatchEdge = 'border border-[rgb(128_128_128/0.45)]';
const percent = (n: number) => `${Math.round(n * 100)} %`;

/** The colour as text, to type or paste (with or without #, also three digits). What is typed is taken
 * as soon as it is a colour; one that is not says so under the field when it is left. */
function ColorText({ id, value, label, onChange }: { id: string; value: string; label?: string; onChange: (value: string) => void }) {
  const [typed, setTyped] = useState(value);
  const [wrong, setWrong] = useState(false);
  // A new colour from outside (the sheet, "Brug standardfarverne") replaces what was typed.
  useEffect(() => {
    if (colorOf(typed) !== value) setTyped(value);
    setWrong(false);
  }, [value]);
  return (
    <SiteTextField
      id={id}
      aria-label={label}
      className="min-w-0 flex-1 font-mono"
      error={wrong ? t.common.notAColor : undefined}
      value={typed}
      spellCheck={false}
      autoCapitalize="off"
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        setTyped(e.target.value);
        const color = colorOf(e.target.value);
        if (color) {
          setWrong(false);
          if (color !== value) onChange(color);
        }
      }}
      onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && e.preventDefault()}
      onBlur={() => {
        const color = colorOf(typed);
        if (color) setTyped(color);
        setWrong(!color);
      }}
    />
  );
}

// Where a finger or the mouse is on an element, from 0 to 1 across and down, while it is held down.
function drag(onMove: (x: number, y: number) => void) {
  const at = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    onMove(clamp((e.clientX - box.left) / box.width), clamp((e.clientY - box.top) / box.height));
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      at(e);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e),
  };
}

// A field to drag in (the colour sheet's shades and hues, the colour wheel), and the round thumb on it.
const ring = 'touch-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none';
const thumb =
  'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]';

/** What is in the sheet a colour is picked in (ColorField): a field with its shades (saturation across,
 * brightness up) and a bar with the hues, both to drag in or move with the arrow keys; what it was and
 * what it becomes side by side, with the colour as text; and the colours to pick from (`swatches`, the
 * site's). "Brug farven" takes it, "Brug og lås" (with `onLock`) takes it and locks it, "Annuller" and the cross
 * leave it as it was. Made again each time the sheet opens, so it starts from the colour the field has. */
function ColorSheet({
  id,
  title,
  value,
  swatches,
  onChange,
  onLock,
  onClose,
}: {
  id: string;
  title: string;
  value: string;
  swatches?: string[];
  onChange: (value: string) => void;
  /** "Brug og lås" as well: takes the colour and locks it (a base colour of the generator, ColorTiles). */
  onLock?: (value: string) => void;
  onClose: () => void;
}) {
  const s = t.common.colorSheet;
  const [hsv, setHsv] = useState(() => hsvOf(value));
  const color = hexOf(hsv);
  // A colour typed or tapped: the hue is kept when it has none (grey, white, black).
  const take = (c: string) => {
    const next = hsvOf(c);
    setHsv((old) => ({ ...next, h: next.s && next.v ? next.h : old.h }));
  };
  const keys = (e: KeyboardEvent, move: Partial<Record<string, (c: Hsv) => Hsv>>) => {
    const step = move[e.key];
    if (!step) return;
    e.preventDefault();
    setHsv(step);
  };
  return (
    <>
      <SheetTitle title={title} onClose={onClose} />
      <SheetBody>
        <div
          role="slider"
          tabIndex={0}
          aria-label={s.shade}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.s * 100)}
          aria-valuetext={s.shadeValue(percent(hsv.s), percent(hsv.v))}
          className={`relative h-48 rounded-(--block-radius) ${ring}`}
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
          {...drag((x, y) => setHsv((c) => ({ ...c, s: x, v: 1 - y })))}
          onKeyDown={(e) =>
            keys(e, {
              ArrowLeft: (c) => ({ ...c, s: clamp(c.s - 0.02) }),
              ArrowRight: (c) => ({ ...c, s: clamp(c.s + 0.02) }),
              ArrowDown: (c) => ({ ...c, v: clamp(c.v - 0.02) }),
              ArrowUp: (c) => ({ ...c, v: clamp(c.v + 0.02) }),
            })
          }
        >
          <span className={`${thumb} size-7`} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: color }} />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label={s.hue}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          className={`relative mx-4 h-8 rounded-full ${ring}`}
          style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          {...drag((x) => setHsv((c) => ({ ...c, h: x * 360 })))}
          onKeyDown={(e) =>
            keys(e, {
              ArrowLeft: (c) => ({ ...c, h: Math.max(0, c.h - 4) }),
              ArrowDown: (c) => ({ ...c, h: Math.max(0, c.h - 4) }),
              ArrowRight: (c) => ({ ...c, h: Math.min(360, c.h + 4) }),
              ArrowUp: (c) => ({ ...c, h: Math.min(360, c.h + 4) }),
            })
          }
        >
          <span className={`${thumb} top-1/2 size-8`} style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
        </div>
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-24 shrink-0 overflow-hidden rounded-(--block-radius-small) ${swatchEdge}`}>
            <span role="img" aria-label={s.before} title={s.before} className="flex-1" style={{ background: value }} />
            <span role="img" aria-label={s.after} title={s.after} className="flex-1" style={{ background: color }} />
          </div>
          <ColorText id={`${id}-sheet`} label={s.code} value={color} onChange={take} />
        </div>
        {!!swatches?.length && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">{s.swatches}</h3>
            <div role="group" aria-label={s.swatches} className="grid grid-cols-6 gap-2">
              {swatches.map((c) => (
                <ChoiceTile key={c} selected={c === color} label={c} onClick={() => take(c)}>
                  <span className={`size-7 rounded-full ${swatchEdge}`} style={{ background: c }} />
                </ChoiceTile>
              ))}
            </div>
          </div>
        )}
      </SheetBody>
      <SheetActions
        onCancel={onClose}
        onDone={() => {
          if (color !== value) onChange(color);
          onClose();
        }}
        done={s.use}
        start={
          onLock && (
            <Button
              kind="outlined"
              onClick={() => {
                onLock(color);
                onClose();
              }}
            >
              {s.useAndLock}
            </Button>
          )
        }
      />
    </>
  );
}

/** A colour (#rrggbb): a round swatch that opens the colour sheet (ColorSheet), with the colours to pick
 * from in it (`swatches`), and the colour as text beside it, to type or paste. */
export function ColorField({
  id,
  value,
  label,
  swatches,
  onChange,
}: {
  id: string;
  value: string;
  /** The colour's name: the sheet's title, and the swatch's label for screen readers. */
  label: string;
  /** Colours to pick from in the sheet (the site's other colours). */
  swatches?: string[];
  onChange: (value: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Counts the times the sheet is opened, so it starts again each time.
  const [opened, setOpened] = useState(0);
  const close = () => dialog.current?.close();
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t.common.pickColor(label)}
        title={t.common.pickColor(label)}
        className={`size-11 shrink-0 rounded-full ${swatchEdge} transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none`}
        style={{ background: value }}
        onClick={() => {
          setOpened((n) => n + 1);
          dialog.current?.showModal();
          // The sheet has the focus, not its first button (CLAUDE.md).
          dialog.current?.focus();
        }}
      />
      <ColorText id={id} value={value} onChange={onChange} />
      <BottomSheet
        ref={dialog}
        tabIndex={-1}
        aria-label={label}
        onClick={(e) => e.target === dialog.current && close()}
        className="focus:outline-none"
      >
        {opened > 0 && (
          <ColorSheet key={opened} id={id} title={label} value={value} swatches={swatches} onChange={onChange} onClose={close} />
        )}
      </BottomSheet>
    </div>
  );
}

/** A field's name above it, and what to write under the name (muted). Without `htmlFor` (a list, a
 * name over more than one field) the name is a text, not a label. */
export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="mb-1 block font-medium">
          {children}
        </label>
      ) : (
        <p className="mb-1 font-medium">{children}</p>
      )}
      {hint && <span className="mb-2 block text-sm text-muted">{hint}</span>}
    </>
  );
}

/** Small muted text under a field or a part: what it does, what happens. */
export function SupportingText({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <span id={id} className={`block text-sm text-muted ${className}`}>
      {children}
    </span>
  );
}

/** The close button in the top end corner of a card that can be closed (a Notice, the start screen's "Continue" card): the
 * card must be `relative`. */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return <IconButton icon={X} label={t.common.close} onClick={onClick} className="absolute end-1 top-1" />;
}

/** A message at the top of a screen about what it shows (an earlier version of a page): the theme's filled card with a
 * title, a text, and what can be done about it (a small button). With `onClose` it can be closed: the close button in
 * its top end corner (what was updated since the last visit, on the start screen). */
export function Notice({
  title,
  children,
  action,
  onClose,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <SiteCard kind="filled" role="status" className={onClose ? 'relative space-y-2 pe-14' : 'space-y-2'}>
      <p className="font-medium text-accent">{title}</p>
      <div className="text-sm">{children}</div>
      {action}
      {onClose && <CloseButton onClick={onClose} />}
    </SiteCard>
  );
}

/** The search over a list: the theme's search bar, searching in place (SearchBar in its Search.tsx). */
export function SearchBar({
  value,
  onChange,
  label,
  className = '',
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  /** What is searched, for screen readers ("Søg i billederne"). */
  label: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <SiteSearchBar
      label={label}
      placeholder={t.common.search}
      className={`min-w-0 ${className}`}
      ref={inputRef}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  );
}

/** The search over a list with the icon buttons beside it, always in this order: `sort` (the arrows), `filter` (the
 * funnel), `date` (the calendar), `seo` (Google) and `view` (the menu or the list), each only when given. Every search
 * with buttons beside it is this, so the buttons stand in the same order on every screen; `className` places the row. */
export function SearchRow({
  sort,
  filter,
  date,
  seo,
  view,
  className = '',
  ...search
}: Omit<Parameters<typeof SearchBar>[0], 'className'> & {
  sort?: ReactNode;
  filter?: ReactNode;
  date?: ReactNode;
  seo?: ReactNode;
  view?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <SearchBar {...search} className="flex-1" />
      {[sort, filter, date, seo, view].map(
        (tool, i) =>
          tool && (
            <span key={i} className="shrink-0">
              {tool}
            </span>
          ),
      )}
    </div>
  );
}

/** The theme's slider, with its name over it (the zoom when cropping a picture): a value between `min` and `max`. */
export function Slider(props: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  disabled?: boolean;
  className?: string;
  onChange: (value: number) => void;
}) {
  return <SiteSlider {...props} />;
}

// ---------------------------------------------------------------------------------------------------
// The fields of a form

// Every type of field in a form, a setting or a sheet with fields (fields.tsx) is drawn of these, so
// they look the same everywhere.

/** A field in a form: its name (Label) and what to write under it, the field (TextField, TextArea,
 * Select …), what is wrong with what was typed, and with `count` how many characters it has of the most
 * it should have (in the accent colour when there are more). */
export function FormField({
  label,
  htmlFor,
  hint,
  problem,
  count,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  /** What is wrong, under the field; `id` is the field's aria-describedby. */
  problem?: { id: string; text: string };
  count?: { length: number; max: number };
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {problem && (
        <p id={problem.id} className="mt-1 text-sm text-accent">
          {problem.text}.
        </p>
      )}
      {count && (
        <p className={`mt-1 text-right text-xs ${count.length > count.max ? 'text-accent' : 'text-muted'}`}>
          {count.length} / {count.max}
        </p>
      )}
    </div>
  );
}

/** Yes or no with a tick, its name after it and what it does under the name. Something that is turned
 * on and off (Vis/Skjul) is a SwitchRow instead. */
export function Checkbox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SiteCheckbox
      label={label}
      supporting={hint}
      checked={checked}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
    />
  );
}

/** Fields that belong together, on the theme's outlined card with their name over them (a group of fields). */
export function FieldGroup({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={`${siteCardClass('outlined')} space-y-5`}>
      <h3 id={id} className="font-semibold">
        {label}
      </h3>
      {hint && <SupportingText>{hint}</SupportingText>}
      {children}
    </div>
  );
}

/** What a field holds, shown but not changed here: with its icon (the kind of an entry, chosen when it
 * was made), or `muted` (what is made elsewhere, as a page's address from its title). */
export function ShownValue({ id, icon, muted, children }: { id?: string; icon?: Icon; muted?: boolean; children: ReactNode }) {
  return (
    <p id={id} className={`flex items-center gap-3 ${muted ? 'text-muted' : ''}`}>
      {icon && <LeadingIcon icon={icon} />}
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}

/** One of many icons: the chosen one with its name, and a button that unfolds them all in a grid to tap
 * (ChoiceTile, the chosen one marked); a tap picks one and folds them again. The choice with the value
 * '' is no icon (a cross). `icon` draws an icon by its value. */
export function IconPicker({
  id,
  label,
  value,
  options,
  icon,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  icon: (value: string, size: number) => ReactElement;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const own = useId();
  const grid = `${id ?? own}-icons`;
  const chosen = options.find((o) => o.value === value);
  return (
    <div id={id}>
      <div className="flex items-center gap-3">
        {value && <LeadingIcon>{icon(value, 24)}</LeadingIcon>}
        <span className="min-w-0 flex-1 truncate">{chosen ? chosen.label : t.forms.noIconYet}</span>
        <Button kind="outlined" size="small" aria-expanded={open} aria-controls={grid} onClick={() => setOpen(!open)}>
          {open ? t.forms.hideIcons : value ? t.forms.changeIcon : t.forms.pickIcon}
        </Button>
      </div>
      {open && (
        <div
          id={grid}
          role="group"
          aria-label={label}
          className="editor-reveal mt-3 grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2"
        >
          {options.map((o) => (
            <ChoiceTile
              key={o.value || 'none'}
              selected={o.value === value}
              label={o.label}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.value ? icon(o.value, 24) : <X size={20} className="text-muted" />}
            </ChoiceTile>
          ))}
        </div>
      )}
    </div>
  );
}

/** A picture: a small one of it (`src`), the button that picks one, from Filer or a new one, or another,
 * and with `onRemove` (when it may be left out) the button that takes it away. */
export function ImagePick({ id, src, onPick, onRemove }: { id?: string; src?: string; onPick: () => void; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-4">
      {src && <img src={src} alt="" className="size-20 shrink-0 rounded-(--block-radius) object-cover" />}
      <Button id={id} kind="outlined" size="small" onClick={onPick}>
        {src ? t.forms.changeImage : t.forms.pickImage}
      </Button>
      {src && onRemove && (
        <Button kind="text" size="small" onClick={onRemove}>
          {t.common.remove}
        </Button>
      )}
    </div>
  );
}

/** A list of items (the theme's segmented list, listClass), each a FoldItem that folds out to its fields
 * (the questions of a block). */
export function FoldList({ ref, children }: { ref?: Ref<HTMLUListElement>; children: ReactNode }) {
  return (
    <ul ref={ref} className={listClass}>
      {children}
    </ul>
  );
}

/** An item of a FoldList: its title, which folds it out and in, the buttons at its right (`tools`: the
 * arrows, Fjern), and its fields while it is open. */
export function FoldItem({
  title,
  open,
  onToggle,
  tools,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  tools?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ListItem
      onClick={onToggle}
      aria-expanded={open}
      leading={<CaretRight size={14} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />}
      headline={title}
      truncate
      actions={tools && <span className="flex shrink-0 pr-1.5">{tools}</span>}
    >
      {open && <div className="editor-reveal space-y-4 px-4 pt-1 pb-4">{children}</div>}
    </ListItem>
  );
}

/** The statuses of a page or post (`status`, packages/editor/lib/status.mjs), in the order of the choices over a list. */
export type PageState = 'published' | 'draft' | 'unlisted' | 'scheduled';
const PAGE_STATES: PageState[] = ['published', 'draft', 'unlisted', 'scheduled'];

/** A choice in a sheet that can be sorted and filtered (usePickTools): a page or post may have its status, whether the
 * menu links to it and its date. */
export type Pickable = { value: string; label: string; state?: PageState; inMenu?: boolean; date?: string };

type PickSort = 'newest' | 'oldest' | 'az' | 'za';
type InMenu = '' | 'in' | 'out';

/** The order and the filters of a sheet of choices (PagePicker, MultiChoice), as over the lists: the arrows with A–Å and
 * Å–A (and newest and oldest first, when the choices have a date: the posts first newest), kept in this browser by
 * `keep` (the list they come from); and the funnel with their status and whether the menu links to them, each only when
 * the choices differ in it, a filter picked as a chip that removes it. `sort` and `filter` go beside the search (SearchRow), `chips` under it,
 * and `arrange` orders and filters choices. */
export function usePickTools(all: Pickable[], keep: string) {
  const dated = all.some((o) => o.date);
  const sorts: PickSort[] = dated ? ['newest', 'oldest', 'az', 'za'] : ['az', 'za'];
  const sortKey = `editor-sort-valg-${keep}`;
  const [savedSort, setSort] = useState<PickSort | null>(() => {
    try {
      return localStorage.getItem(sortKey) as PickSort | null;
    } catch {
      return null;
    }
  });
  const sort = savedSort && sorts.includes(savedSort) ? savedSort : sorts[0];
  const [picked, setState] = useKept<PageState | ''>(`valg-${keep}-status`, '');
  const [inMenu, setInMenu] = useKept<InMenu>(`valg-${keep}-menu`, '');
  // A filter only when the choices differ in it; the one picked is forgotten when it is no longer there to pick.
  const states = PAGE_STATES.filter((s) => all.some((o) => (o.state ?? 'published') === s));
  const state = states.length > 1 && states.includes(picked as PageState) ? picked : '';
  const menus = all.some((o) => o.inMenu) && all.some((o) => o.inMenu === false);
  const menu = menus ? inMenu : '';
  const filters = [
    states.length > 1 && {
      title: t.library.statusFilter,
      value: state,
      options: [{ value: '', label: t.library.statusShown.all }, ...states.map((s) => ({ value: s, label: t.library.statusShown[s] }))],
      onChange: (v: string) => setState(v as PageState | ''),
    },
    menus && {
      title: t.forms.menuFilter,
      value: menu,
      options: (['', 'in', 'out'] as const).map((m) => ({ value: m, label: t.forms.menuShown[m || 'all'] })),
      onChange: (v: string) => setInMenu(v as InMenu),
    },
  ].filter((f) => !!f);
  const chosen = [
    state && { key: 'state', label: t.library.statusShown[state], clear: () => setState('') },
    menu && { key: 'menu', label: t.forms.menuShown[menu], clear: () => setInMenu('') },
  ].filter((c) => !!c);

  function pickSort(next: PickSort) {
    setSort(next);
    try {
      localStorage.setItem(sortKey, next);
    } catch {}
  }

  const byDate = (a: Pickable, b: Pickable) => (b.date ?? '').localeCompare(a.date ?? '');
  const compare: Record<PickSort, (a: Pickable, b: Pickable) => number> = {
    newest: (a, b) => byDate(a, b) || byText(a.label, b.label),
    oldest: (a, b) => byDate(b, a) || byText(a.label, b.label),
    az: (a, b) => byText(a.label, b.label),
    za: (a, b) => byText(b.label, a.label),
  };

  return {
    /** Whether a filter is picked. */
    filtered: chosen.length > 0,
    sort: (
      <Choice
        title={t.library.sort}
        icon={ArrowsDownUp}
        value={sort}
        options={sorts.map((s) => ({ value: s, label: t.library.sorts[s] }))}
        onChange={pickSort}
      />
    ),
    filter: filters.length > 0 && <Filters title={t.library.filter} selected={chosen.length > 0} groups={filters} />,
    chips: chosen.length > 0 && (
      <div className="mx-5 mb-2 flex shrink-0 flex-wrap gap-2">
        {chosen.map((c) => (
          <InputChip key={c.key} removeLabel={t.library.removeFilter(c.label)} onRemove={c.clear}>
            {c.label}
          </InputChip>
        ))}
      </div>
    ),
    arrange: <T extends Pickable>(options: T[]) =>
      options
        .filter((o) => (!state || (o.state ?? 'published') === state) && (!menu || !!o.inMenu === (menu === 'in')))
        .sort(compare[sort]),
  };
}

/** Several picked from a list (a post's tags): the picked ones as chips, a tap on one takes it away, and
 * a last button (`add`, "Tilføj tag") that opens a sheet with all the choices, where a tap picks one or
 * takes it away again; the sheet stays open, so more can be picked. With many choices a search over
 * them, their order and filters (usePickTools); `max`: at most so many; `footer`: at the bottom of the sheet (SheetLink), given what closes it.
 * A picked value that is not among the choices is still shown, so it is not lost. */
export function MultiChoice({
  label,
  options,
  value,
  add,
  max,
  keep,
  footer,
  onChange,
}: {
  label: string;
  options: Pickable[];
  value: string[];
  add?: string;
  max?: number;
  /** Where the choices come from (a relation: "pages"), for the order kept in this browser (usePickTools). */
  keep?: string;
  footer?: (close: () => void) => ReactNode;
  onChange: (value: string[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const many = options.length > 12;
  const tools = usePickTools(many ? options : [], keep ?? label);
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? t.forms.missing(v);
  const full = max != null && value.length >= max;
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const found = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const shown = many ? tools.arrange(found) : found;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <InputChip key={v} removeLabel={t.forms.removeOne(labelOf(v))} onRemove={() => toggle(v)}>
            {labelOf(v)}
          </InputChip>
        ))}
        {!full && (
          <Button
            kind="outlined"
            size="small"
            icon={Plus}
            aria-haspopup="dialog"
            onClick={() => {
              setQuery('');
              dialog.current?.showModal();
            }}
          >
            {add ?? t.forms.add}
          </Button>
        )}
      </div>
      <BottomSheet ref={dialog} aria-label={label} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <SheetTitle title={label} onClose={() => dialog.current?.close()} />
        {/* With many choices: the search, the order and the filters (usePickTools). */}
        {many && (
          <>
            <SearchRow
              value={query}
              onChange={setQuery}
              label={t.common.searchIn(label)}
              sort={tools.sort}
              filter={tools.filter}
              className="mx-5 mb-2 shrink-0"
            />
            {tools.chips}
          </>
        )}
        <SheetList>
          {shown.map((o) => {
            const picked = value.includes(o.value);
            return (
              <li key={o.value}>
                <Option selected={picked} disabled={!picked && full} onClick={() => toggle(o.value)}>
                  {o.label}
                </Option>
              </li>
            );
          })}
          {!shown.length && <EmptyNote item>{t.forms.noneFound}</EmptyNote>}
        </SheetList>
        {footer?.(() => dialog.current?.close())}
      </BottomSheet>
    </>
  );
}

/** A link to another screen, with an arrow after it (under a field's name: where it is edited). */
export function ArrowLink({
  href,
  onClick,
  className = 'text-accent',
  children,
}: {
  href: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={`inline-flex items-center gap-1 font-medium hover:underline ${className}`} onClick={onClick}>
      {children}
      <ArrowRight size={14} />
    </a>
  );
}

// ---------------------------------------------------------------------------------------------------
// Switches

/** The theme's switch (Material 3's) on its own, at the end of a row that names it (a block's row on its app's page,
 * AppList.tsx): its name (`label`) only for screen readers, what it is (`texts`: Til, Fra) before it. */
export function Switch({
  selected,
  label,
  texts,
  disabled,
  onChange,
}: {
  selected: boolean;
  label: string;
  texts: [string, string];
  /** It cannot be changed now (a block in use under "Blokindstillinger"). */
  disabled?: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <SiteSwitch
      label={label}
      hideLabel
      checked={selected}
      states={texts}
      disabled={disabled}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
    />
  );
}

/** The theme's switch with its name before it, on one line: the only way the editor shows one, with what it does under
 * the name (`hint`) and what it is (`texts`: Til, Fra) before the switch. Never in a frame or a card: no border,
 * background or ring around the name and the switch (CLAUDE.md). The only switch without it: at the end of a block's
 * row on its app's page (Switch, AppList.tsx). */
export function SwitchRow({ label, hint, selected, texts, disabled, onChange }: Parameters<typeof Switch>[0] & { hint?: ReactNode }) {
  return (
    <SiteSwitch
      label={label}
      supporting={hint}
      checked={selected}
      states={texts}
      disabled={disabled}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
    />
  );
}

// ---------------------------------------------------------------------------------------------------
// Chips

/** The theme's input chip: what is chosen (a tag, a filter), removed with its cross. */
export function InputChip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return <SiteChip kind="input" label={children} removeLabel={removeLabel} onRemove={onRemove} />;
}

/** Words typed as chips (the keywords of a page): a word becomes a chip with Enter, a comma or when the field is left,
 * and the chip's cross removes it. The word being typed is in `onChange` already, last, so it is saved too. With `one`,
 * only one word, and the field is gone while it has it (its chip is removed to type another). */
export function ChipField({
  id,
  value,
  one,
  onChange,
}: {
  id?: string;
  value: string[];
  one?: boolean;
  onChange: (value: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  // The word being typed is the last of `value` while it is there; changed from outside (a version restored), it is not.
  const typing = draft.trim() !== '' && value.at(-1) === draft.trim();
  const chips = typing ? value.slice(0, -1) : value;
  const known = (word: string, among: string[]) => among.some((w) => w.toLowerCase() === word.toLowerCase());
  // Typed text: the words before a comma become chips, what is after it is still being typed.
  const type = (typed: string) => {
    const parts = typed.split(',');
    const rest = parts.pop()!;
    const words = [...chips];
    for (const w of parts.map((p) => p.trim()).filter(Boolean)) if (!known(w, words) && !(one && words.length)) words.push(w);
    const last = rest.trim() && !(one && words.length) ? [rest.trim()] : [];
    setDraft(last.length ? rest : '');
    onChange([...words, ...last]);
  };
  // Enter, or the field is left: the word typed becomes a chip, unless it is one already.
  const done = () => {
    setDraft('');
    if (typing && known(draft.trim(), chips)) onChange(chips);
  };
  const remove = (word: string) => {
    onChange([...chips.filter((w) => w !== word), ...(typing ? [draft.trim()] : [])]);
    if (one) requestAnimationFrame(() => input.current?.focus());
  };
  const field = !(one && chips.length) && (
    <TextField
      ref={input}
      id={id}
      value={typing ? draft : ''}
      enterKeyHint="done"
      onChange={(e) => type(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          done();
        }
      }}
      onBlur={done}
    />
  );
  return (
    <div className="space-y-2">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((w) => (
            <InputChip key={w} removeLabel={t.forms.removeOne(w)} onRemove={() => remove(w)}>
              {w}
            </InputChip>
          ))}
        </div>
      )}
      {field}
    </div>
  );
}

/** The theme's chip set: chips side by side in a group with its name (`label`), on as many lines as they need, or with
 * `scroll` on one line that scrolls sideways (the harmonies under "Farver" › "Generator"). */
export function ChipSet({ label, scroll = false, children }: { label: string; scroll?: boolean; children: ReactNode }) {
  return (
    <SiteChipSet layout={scroll ? 'scroll' : 'wrap'} label={label}>
      {children}
    </SiteChipSet>
  );
}

/** The theme's filter chip: one of a few choices side by side (a picture's format), the chosen one marked. Many choices
 * go in a sheet instead (Choice). */
export function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <SiteChip kind="filter" label={children} selected={selected} onClick={onClick} />;
}

/** One of many icons to tap, in a grid (an icon field): the theme's outlined, square icon button as wide as its column,
 * the chosen one on (a toggle). `label` names it for screen readers and as its tooltip. */
export function ChoiceTile({
  selected,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  children: ReactElement<{ size?: number; className?: string }>;
}) {
  return (
    <SiteIconButton
      icon={children}
      label={label}
      title={label}
      kind="outlined"
      shape="square"
      selected={selected}
      className="aspect-square h-auto w-full"
      onClick={onClick}
    />
  );
}

/** The theme's segmented button: two or three choices of a setting side by side (Konto › Udseende), each with its name
 * and an icon, the chosen one marked. */
export function SegmentedButton<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  /** What is chosen, for screen readers. */
  label: string;
  value: T;
  options: { value: T; label: string; icon?: Icon }[];
  /** It cannot be changed now (the place of R2 caching's bucket while it is on): grey, and it stays. */
  disabled?: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <SiteSegmentedButton
      label={label}
      segments={options.map(({ value: v, label: name, icon: Glyph }) => ({
        label: name,
        icon: Glyph && <Glyph />,
        value: v,
        selected: v === value,
        disabled,
        onClick: () => onChange(v),
      }))}
    />
  );
}

// ---------------------------------------------------------------------------------------------------
// Rows

/** The classes of the rows under a row in a list (a submenu): the theme's list, indented along a line, the text a little
 * lighter. */
export const subListClass = `${siteListClass} ml-5 border-l border-line`;

/** What a row looks like besides the theme's list item: `accent`, a row that does something (Log ud), in the accent
 * colour; `delete`, the row that deletes what a screen shows, alone in a Group at the bottom, in the middle in the error
 * colour; `muted`, grey (what cannot be opened: a page that is gone); `sub`, a row under a row (a submenu), its text a
 * little lighter. */
export type RowTone = 'accent' | 'delete' | 'muted' | 'sub';
const toneClass: Record<RowTone, string> = {
  accent: 'text-accent',
  delete: 'justify-center text-center font-medium text-(--error)',
  muted: 'text-muted',
  sub: 'text-ink/80',
};

/** A row in a list (Group, listClass): the theme's list item (Material 3's ListItem), with the editor's icons. A link
 * (`href`), a button (`onClick`) or only shown; its icon before it (`icon`, a Phosphor icon or one drawn; `iconSelected`:
 * in the selected colour, the open one) or anything there (`leading`: LeadingImage, LeadingToken), its name
 * (`headline`) and what is under it (`supporting`; `truncate`: each on one line, cut off), how many at the right
 * (`count`), the arrow of a row that opens something (`arrow`, or another icon: what a tap does) or anything there
 * (`trailing`), the buttons beside it (`actions`: the arrows, Fjern, a switch) and what is in its <li> after it
 * (`children`: a sheet it opens, a text it folds out); `tone`: RowTone. `selectable`: on a phone a long press selects it
 * (`onSelectedChange`), and while its list is `selecting` a tap does; selected, a tick is its icon (the theme's
 * ListItem). The rest (aria-…, ref, style, onClick on a link) on the row. */
export function ListItem({
  icon: shownIcon,
  iconSelected: shownSelected,
  arrow,
  count,
  tone,
  className,
  ...item
}: {
  icon?: Icon | ReactElement<{ size?: number; className?: string }>;
  iconSelected?: boolean;
  leading?: ReactNode;
  headline: ReactNode;
  supporting?: ReactNode;
  truncate?: boolean;
  count?: ReactNode;
  arrow?: boolean | Icon;
  trailing?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  selectable?: boolean;
  selecting?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  tone?: RowTone;
  className?: string;
} & Record<string, unknown>) {
  const ticked = !!item.selectable && !!item.selected;
  let icon = ticked ? CheckCircle : shownIcon;
  let iconSelected = shownSelected;
  const Arrow = arrow === true ? CaretRight : arrow || null;
  // A LeadingIcon made beforehand (an app's icon in a list) is the item's leading icon.
  const made =
    isValidElement(item.leading) && item.leading.type === LeadingIcon
      ? (item.leading.props as { icon?: Icon; selected?: boolean; children?: ReactNode })
      : null;
  if (made) {
    icon = made.icon ?? ((made.children || <span className="block size-6" />) as ReactElement<{ size?: number }>);
    iconSelected = made.selected;
    item.leading = undefined;
  }
  const Lead = icon && !isValidElement(icon) ? (icon as Icon) : null;
  // Nothing (false, '', null) is no part: `count={n > 0 && n}`.
  const some = (v: ReactNode) => (v === false || v === '' || v == null ? undefined : v);
  return (
    <SiteListItem
      {...item}
      leading={some(item.leading)}
      supporting={some(item.supporting)}
      trailing={some(item.trailing)}
      actions={some(item.actions)}
      // The tick of a selected item says nothing more than the item's own selected state.
      leadingIcon={Lead ? <Lead aria-hidden={ticked ? true : undefined} /> : (icon as ReactElement | undefined)}
      leadingIconSelected={iconSelected}
      trailingSupporting={some(count)}
      trailingIcon={Arrow ? <Arrow /> : undefined}
      className={[tone && toneClass[tone], className].filter(Boolean).join(' ') || undefined}
    />
  );
}

/** At the right of a row: the theme's text button with how many rows are under it and the arrow that shows or hides
 * them (the pages under a page). `label` names it for screen readers (with the row's name), `title` is its tooltip. */
export function UnfoldButton({
  open,
  count,
  label,
  title,
  className = '',
  onClick,
}: {
  open: boolean;
  count: number;
  label: string;
  title: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <SiteButton
      kind="text"
      size="small"
      trailingIcon={open ? <CaretUp /> : <CaretDown />}
      aria-expanded={open}
      aria-label={label}
      title={title}
      className={`shrink-0 ${className}`}
      onClick={onClick}
    >
      {count}
    </SiteButton>
  );
}

/** The classes of a choice in a sheet's list (Option), for one with more in it (an icon, a hint): the theme's menu
 * item (Material 3's), the chosen one marked by its aria-pressed, aria-selected or aria-checked. */
export const optionClass = () => `${siteMenuItemClass} group disabled:opacity-50`;

/** A choice in a sheet's list (the theme's menu item): the chosen one marked, with a tick. */
export function Option({
  selected = false,
  disabled,
  onClick,
  children,
  role,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  role?: string;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-selected={role === 'option' ? selected : undefined}
      disabled={disabled}
      className={optionClass()}
      onClick={onClick}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <Check size={20} className="shrink-0" />}
    </button>
  );
}

// ---------------------------------------------------------------------------------------------------
// The menu

/** A menu under the button that opened it (`anchor`; null while it is closed): the theme's menu with its choices
 * (MenuItem) over the screen, placed as the theme places one (sitePlaceMenu: under the button, over it when there is no
 * room under it), and again when the page scrolls or the window changes; on a phone in a sheet from the bottom with
 * `label` as its title (useAtLeast('medium')), so a long one is not too long for the screen. A choice closes it, and so do a tap
 * outside it, Esc, and the button going out of sight (the sheet: its cross and a swipe down). The button says it opens
 * one (aria-haspopup="menu", aria-expanded). `attached`: the dropdown of a field (ChoiceMenu: Material 3's exposed
 * dropdown menu), the `anchor` being the field's box: the menu is at least as wide as it, the focus goes into it (on the
 * chosen one), the arrow keys, Home and End move between the choices, and a choice, Esc and Tab close it, the first two
 * giving the focus back to the field. */
export function Menu({
  anchor,
  label,
  attached,
  keyboard,
  onClose,
  children,
}: {
  anchor: HTMLElement | null;
  /** What the choices are, for screen readers, and the sheet's title on a phone. */
  label: string;
  attached?: boolean;
  /** With `attached`: it was opened with the keyboard, so a choice has the focus (and its ring); else the menu has it. */
  keyboard?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const menu = useRef<HTMLUListElement>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const wide = useAtLeast('medium');
  useEffect(() => {
    if (wide) return;
    const el = sheet.current;
    // No choice has the focus to begin with (the sheet has it, as in ask.tsx), so none looks picked.
    if (anchor && !el?.open) {
      el?.showModal();
      el?.focus();
    }
    if (!anchor && el?.open) el.close();
  }, [anchor, wide]);
  // Before it is painted, so it is never seen anywhere else than at its button.
  useLayoutEffect(() => {
    if (!anchor || !wide) return;
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as globalThis.KeyboardEvent).key !== 'Escape') return;
      // A tap on the button itself is its own: it closes the menu.
      if (e.type === 'pointerdown' && (menu.current?.contains(e.target as Node) || anchor.contains(e.target as Node))) return;
      if (e.type === 'keydown' && attached) {
        // Esc closes only the menu (not the sheet or dialog the field is in), and the field has the focus again.
        e.preventDefault();
        e.stopPropagation();
        anchor.querySelector<HTMLElement>('button')?.focus();
      }
      onClose();
    };
    // Where the button is now; closed when it is no longer shown (the row over a selection, gone with the selection).
    const place = () => {
      if (!anchor.isConnected || !anchor.getClientRects().length) return onClose();
      if (!menu.current) return;
      if (attached) {
        const { width } = anchor.getBoundingClientRect();
        Object.assign(menu.current.style, {
          width: 'max-content',
          minWidth: `${width}px`,
          maxWidth: `max(${width}px, var(--menu-width, 18rem))`,
        });
      }
      sitePlaceMenu(menu.current, anchor);
      if (attached) {
        // Wider than the field: it grows from the field's end edge, inside the screen.
        const box = anchor.getBoundingClientRect();
        const { offsetWidth } = menu.current;
        if (offsetWidth > box.width) menu.current.style.left = `${Math.max(8, box.right - offsetWidth)}px`;
      }
    };
    place();
    if (attached) {
      const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
      const first = items.find((i) => i.getAttribute('aria-checked') === 'true') ?? items[0];
      // With the mouse the menu itself has the focus (arrow keys work, no ring on a choice).
      (keyboard ? first : menu.current)?.focus({ preventScroll: true });
    }
    for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, close, true);
    addEventListener('scroll', place, { capture: true, passive: true });
    addEventListener('resize', place, { passive: true });
    return () => {
      for (const type of ['pointerdown', 'keydown']) document.removeEventListener(type, close, true);
      removeEventListener('scroll', place, { capture: true });
      removeEventListener('resize', place);
    };
  }, [anchor, wide, attached, keyboard]);
  if (!wide)
    return (
      <BottomSheet
        ref={sheet}
        tabIndex={-1}
        aria-label={label}
        onClick={(e) => (e.target === sheet.current || (e.target as Element).closest('[role^="menuitem"]')) && sheet.current?.close()}
        onClose={(e) => e.target === e.currentTarget && onClose()}
        className="focus:outline-none"
      >
        <SheetTitle title={label} onClose={() => sheet.current?.close()} />
        <SheetList div>
          <SiteMenu role="menu" aria-label={label} className="w-full max-w-none">
            {children}
          </SiteMenu>
        </SheetList>
      </BottomSheet>
    );
  if (!anchor) return null;
  return (
    <SiteMenu
      ref={menu}
      role="menu"
      aria-label={label}
      className="fixed z-30 focus:outline-none"
      tabIndex={attached ? -1 : undefined}
      onClick={(e: MouseEvent) => {
        if (!(e.target as Element).closest('[role^="menuitem"]')) return;
        if (attached) anchor.querySelector<HTMLElement>('button')?.focus();
        onClose();
      }}
      onKeyDown={attached ? (e: KeyboardEvent<HTMLElement>) => (e.key === 'Tab' ? onClose() : moveInMenu(e)) : undefined}
    >
      {children}
    </SiteMenu>
  );
}

// The keys of an attached menu: the arrow keys (round), Home and End go between its choices.
function moveInMenu(e: KeyboardEvent<HTMLElement>) {
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)')];
  const at = items.indexOf(document.activeElement as HTMLElement);
  const to = { ArrowDown: at + 1, ArrowUp: at < 0 ? items.length - 1 : at - 1, Home: 0, End: items.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  items[(to + items.length) % items.length]?.focus();
}

/** A choice in a Menu: the theme's menu item, with its icon before it; `selected`: the one that is chosen now, marked
 * (the kind of text where the cursor is). A tap on it keeps the cursor where it is in a text. */
export function MenuItem({
  icon: Glyph,
  selected,
  onClick,
  children,
}: {
  icon?: Icon;
  /** Undefined for a choice that does something, not one of some to choose between. */
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <SiteMenuItem icon={Glyph && <Glyph />} selected={selected} onMouseDown={(e: MouseEvent) => e.preventDefault()} onClick={onClick}>
      {children}
    </SiteMenuItem>
  );
}

/** A setting on one line with its choice at the right: the name (`label`) and what it does under it (`hint`) at the left,
 * and at the right the chosen one (`value`, shown with its label from `options`) in a small outlined box (Select's
 * field, small), which opens the choices under it (on a phone in a sheet titled with the name), the chosen one checked.
 * The same row as SwitchRow (the theme's SettingRow, no frame around it), but for a setting with a few choices, not
 * on/off. `disabled`: it cannot be changed now (the box is grey). */
export function MenuRow<T extends string>({
  label,
  hint,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <SiteSettingRow label={label} supporting={hint}>
      <ChoiceMenu size="small" aria-label={label} title={label} value={value} options={options} disabled={disabled} onChange={onChange} />
    </SiteSettingRow>
  );
}

/** The fields of a sheet, between SheetTitle and SheetActions, scrolled when there are many. */
export function SheetBody({ onSubmit, children }: { onSubmit?: (e: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  const className = 'min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-2 pb-4';
  return onSubmit ? (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  ) : (
    <div className={className}>{children}</div>
  );
}

/** The choices of a sheet (Option), scrolled when there are many: a list, or with `div` groups of them
 * (SheetGroupTitle). */
export function SheetList({ div, children }: { div?: boolean; children: ReactNode }) {
  const className = 'min-h-0 flex-1 overflow-y-auto px-2 pb-4';
  return div ? <div className={className}>{children}</div> : <ul className={className}>{children}</ul>;
}

/** The small heading over some of the choices in a sheet (Faste sider, Sider). */
export function SheetGroupTitle({ children }: { children: ReactNode }) {
  return <h3 className="px-3 pt-4 pb-1 text-sm font-medium text-muted">{children}</h3>;
}

/** A link at the bottom of a sheet, under its choices and the theme's divider, to make something new elsewhere (Opret
 * et tag): the theme's text button with a +. */
export function SheetLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0">
      <SiteDivider />
      <div className="px-2 py-2">
        <SiteButton kind="text" href={href} icon={<Plus />} onClick={onClick}>
          {children}
        </SiteButton>
      </div>
    </div>
  );
}

/** The bottom of a sheet with fields, under the theme's divider: "Annuller" and the main button on the right,
 * something else (Slet) on the left. */
export function SheetActions({
  onCancel,
  onDone,
  done,
  disabled,
  start,
}: {
  onCancel: () => void;
  onDone: () => void;
  /** The main button's text (Gem, Indsæt). */
  done: string;
  disabled?: boolean;
  start?: ReactNode;
}) {
  return (
    <div className="shrink-0">
      <SiteDivider />
      <div className="flex items-center gap-2 px-5 py-3">
        {start}
        <Button kind="outlined" className="ml-auto" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button disabled={disabled} onClick={onDone}>
          {done}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------
// The preview of a block

/** How a block looks on the site, with what is in it now, in a dashed frame: it can be used as on
 * the site (a text unfolds, a slider slides), but a link in it goes nowhere, so the editor stays open.
 * (The card of a block in the text is not this: a tap there opens its menu.) */
export function Preview({ children }: { children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={t.common.preview}
      className="site-block-preview not-prose border-[1.5px] border-dashed border-line p-2"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest('a[href]')) e.preventDefault();
      }}
    >
      <InEditor>{children}</InEditor>
    </div>
  );
}

/** A little page in a set of the site's colours (by their names, as "Farver" has them), whatever mode the editor is in:
 * a heading, text, a link, a surface with text, a tinted box, a box in each of the secondary and tertiary colours and a button, so it shows how readable they are together.
 * The colours are CSS variables on it, which the classes take, and the theme's filled button (ui.css) in them. "Farver"
 * (Colors.tsx) and the variants of a colour app. */
export function ColorsPreview({ colors, title }: { colors: Record<string, string>; title: string }) {
  const p = t.colors.preview;
  const vars = {
    ...Object.fromEntries(Object.entries(colors).map(([name, value]) => [`--${name}`, value])),
    '--button-filled-surface': 'var(--accent)',
    '--button-filled-hover': 'var(--accent-hover)',
    '--button-filled-text': 'var(--on-accent)',
  } as CSSProperties;
  return (
    <div style={vars} aria-label={title} role="img" className="space-y-3 rounded-2xl border border-line bg-bg p-4 text-ink">
      <p className="text-lg font-medium tracking-tight">{p.heading}</p>
      <p className="text-sm text-muted">{p.text}</p>
      <p>
        <span className="link">{p.link}</span>
      </p>
      <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
        <p className="text-sm">{p.card}</p>
        <p className="rounded-lg bg-tint px-3 py-2 text-sm font-medium text-accent">{p.box}</p>
      </div>
      {/* The secondary and tertiary colours, which a harmony on the colour wheel places. */}
      <div className="grid grid-cols-2 gap-2 text-sm font-medium">
        <p className="rounded-lg bg-secondary-container px-3 py-2 text-on-secondary-container">{p.secondary}</p>
        <p className="rounded-lg bg-tertiary-container px-3 py-2 text-on-tertiary-container">{p.tertiary}</p>
      </div>
      <span className="button button-filled button-small">{p.button}</span>
    </div>
  );
}

/** A few colours side by side in small circles, read out together as `label` (a variant's colours, ChoiceRow). */
export function ColorSwatches({ colors, label }: { colors: string[]; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex shrink-0 gap-1.5">
      {colors.map((color, i) => (
        <span key={i} className="size-6 rounded-full border border-line" style={{ background: color }} />
      ))}
    </span>
  );
}

/** A base colour in ColorTiles: the colour, its name, what its pen does (`onChange`, with `lock` when "Brug og lås"
 * took it; `disabled`: the pen is grey and cannot be used), and, for the one that can be locked, whether it is
 * (`locked`) and what its lock does (`onLock`). */
export type ColorTile = {
  color: string;
  name: string;
  disabled?: boolean;
  locked?: boolean;
  onChange?: (color: string, lock: boolean) => void;
  onLock?: (locked: boolean) => void;
};

/** A few colours side by side, each a tile filled with it, with its name and its colour as text in black or white,
 * whichever is easier to read on it (the generator's three base colours under "Farver"), and the theme's icon buttons
 * in the same colour: a pen that opens the colour sheet (ColorSheet, without colours to pick from), and on one that
 * can be locked a lock, on while it is locked, and "Brug og lås" in its sheet. `label` names them together. */
export function ColorTiles({ colors, label }: { colors: ColorTile[]; label: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The tile whose sheet is open, and the times it was opened, so it starts again each time.
  const [editing, setEditing] = useState<{ tile: number; opened: number }>({ tile: 0, opened: 0 });
  const close = () => dialog.current?.close();
  const tile = colors[editing.tile];
  return (
    <>
      <ul
        aria-label={label}
        className={`grid overflow-hidden rounded-(--block-radius) ${swatchEdge}`}
        style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0, 1fr))` }}
      >
        {colors.map(({ color, name, disabled, locked, onChange, onLock }, i) => {
          const text = contrast(color, '#000000') >= contrast(color, '#ffffff') ? '#000000' : '#ffffff';
          // The icon buttons in the tile's text colour, on and off.
          const vars = {
            background: color,
            color: text,
            '--icon-button-standard-text': text,
            '--icon-button-standard-selected-text': text,
          } as CSSProperties;
          return (
            <li key={name} className="flex min-w-0 flex-col gap-1 p-3" style={vars}>
              <span className="block text-sm font-medium break-words">{name}</span>
              <span className="block truncate font-mono text-sm uppercase">{color}</span>
              <span className="mt-auto -ml-2 flex">
                {onChange && (
                  <IconButton
                    icon={PencilSimple}
                    label={t.common.pickColor(name)}
                    aria-haspopup="dialog"
                    disabled={disabled}
                    onClick={() => {
                      setEditing((e) => ({ tile: i, opened: e.opened + 1 }));
                      dialog.current?.showModal();
                      // The sheet has the focus, not its first button (CLAUDE.md).
                      dialog.current?.focus();
                    }}
                  />
                )}
                {onLock && (
                  <IconButton
                    icon={locked ? LockSimple : LockSimpleOpen}
                    label={t.common.lockColor(name)}
                    selected={!!locked}
                    onClick={() => onLock(!locked)}
                  />
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <BottomSheet
        ref={dialog}
        tabIndex={-1}
        aria-label={tile?.name}
        onClick={(e) => e.target === dialog.current && close()}
        className="focus:outline-none"
      >
        {editing.opened > 0 && tile?.onChange && (
          <ColorSheet
            key={editing.opened}
            id={`color-tile-${editing.tile}`}
            title={tile.name}
            value={tile.color}
            onChange={(c) => tile.onChange?.(c, false)}
            onLock={tile.onLock && ((c) => tile.onChange?.(c, true))}
            onClose={close}
          />
        )}
      </BottomSheet>
    </>
  );
}

/** A colour wheel (the generator under "Farver"): every hue round the edge at its most colourful (`edge`, from the top
 * clockwise), grey in the middle (`middle`), and dots on it (`dots`, x and y from -1 to 1 from the middle, y down), a
 * locked one with a lock in it. The first is the one chosen, to drag, tap or move with the arrow keys (round the wheel,
 * and out and in); the others follow it. `disabled`: it cannot be moved (the source colour is locked). `label` names it
 * for screen readers, `valueText` says what is chosen. */
export function ColorWheel({
  edge,
  middle,
  dots,
  label,
  valueText,
  disabled = false,
  onMove,
}: {
  edge: string[];
  middle: string;
  dots: { x: number; y: number; color: string; locked?: boolean }[];
  label: string;
  valueText: string;
  disabled?: boolean;
  onMove: (x: number, y: number) => void;
}) {
  const [first] = dots;
  const angle = Math.atan2(first.x, -first.y);
  const keys = (e: KeyboardEvent) => {
    const step = ({ ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] } as Record<string, number[]>)[e.key];
    if (!step || disabled) return;
    e.preventDefault();
    const a = angle + (step[0] * Math.PI) / 180;
    const r = clamp(Math.hypot(first.x, first.y) + step[1]);
    onMove(r * Math.sin(a), -r * Math.cos(a));
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(((angle * 180) / Math.PI + 360) % 360)}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      className={`relative aspect-square w-full max-w-72 rounded-full ${swatchEdge} ${ring}`}
      style={{ background: `radial-gradient(closest-side, ${middle}, transparent), conic-gradient(${[...edge, edge[0]].join(', ')})` }}
      {...(disabled ? {} : drag((x, y) => onMove(x * 2 - 1, y * 2 - 1)))}
      onKeyDown={keys}
    >
      {/* The chosen dot last, so it is on top. */}
      {dots
        .map((dot, i) => (
          <span
            key={i}
            className={`${thumb} flex items-center justify-center ${i ? 'size-6' : 'size-9'}`}
            style={{
              left: `${(dot.x + 1) * 50}%`,
              top: `${(dot.y + 1) * 50}%`,
              background: dot.color,
              color: contrast(dot.color, '#000000') >= contrast(dot.color, '#ffffff') ? '#000000' : '#ffffff',
            }}
          >
            {dot.locked && <LockSimple size={i ? 12 : 16} aria-hidden="true" />}
          </span>
        ))
        .reverse()}
    </div>
  );
}

/** A few icons side by side, each an SVG file as it is, read out together as `label` (an icon pack's, ChoiceRow on
 * "Ikonpakker"): in the row's colour, as its own icons. */
export function IconSwatches({ icons, label }: { icons: string[]; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex shrink-0 gap-2">
      {icons.map((file, i) => (
        <SvgFile key={i} file={file} />
      ))}
    </span>
  );
}

/** A row in a Group that is one of several choices on a screen of their own ("Ikonpakker"): the theme's list item
 * (ListItem) as a button, its name (`headline`) and what is under it (`supporting`), what it gives at the right (`trailing`: IconSwatches,
 * ColorSwatches), and the chosen one marked as a choice in a sheet is (Option): aria-pressed, in the accent colour, with
 * a tick. */
export function ChoiceRow({
  selected,
  headline,
  supporting,
  trailing,
  onClick,
}: {
  selected: boolean;
  headline: ReactNode;
  supporting?: ReactNode;
  trailing?: ReactNode;
  onClick: () => void;
}) {
  return (
    <ListItem
      onClick={onClick}
      aria-pressed={selected}
      tone={selected ? 'accent' : undefined}
      headline={headline}
      supporting={supporting}
      trailing={
        <span className="flex items-center gap-3">
          {trailing}
          <Check size={20} className={`shrink-0 ${selected ? 'text-accent' : 'invisible'}`} />
        </span>
      }
    />
  );
}

// ---------------------------------------------------------------------------------------------------
// Lists of rows

/** The classes of a list of rows (in Group, and alone in a sheet: where a picture is used): the theme's segmented list
 * (Material 3 Expressive's), each row on its own surface. */
export const listClass = siteListClasses('segmented');

/** The classes of a list without surfaces (the theme's standard list): a row or two that stand on the page, AccountRow. */
export const plainListClass = siteListClasses('standard');

/** The small heading over a Group, and over what stands as one (the themes on Konto): in Material 3's title small, as
 * written (not in capitals, Material 2's subheader), muted as a group's heading in a sheet (SheetGroupTitle). */
export function GroupTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 px-4 text-sm font-medium tracking-[0.00625rem] text-muted">{children}</h2>;
}

/** The theme's ripple on every part the editor draws that is pressed (its buttons, rows, chips …), as on the site:
 * started once, when the editor opens. */
export const startRipples = siteRipples;

/** Something on its way that takes a moment (Gemmer, Henter versionerne): the theme's loading indicator (Material 3's),
 * as big as the text, before what it is. */
export function LoadingIndicator({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <SiteLoadingIndicator label="" aria-hidden style={inText} />
      {children}
    </span>
  );
}

// The theme's loading indicator as big as the text it is before, in its colour (on a filled button too).
const inText = {
  '--loading-indicator-size': '1.25em',
  '--loading-indicator-shape-size': '1.125em',
  '--loading-indicator-colour': 'currentColor',
} as CSSProperties;

/** What a list or a screen says when it has nothing to show (Ingen …), or while it is fetched (`busy`,
 * with the LoadingIndicator: Henter…): grey, in the middle. `item`: as an item of a list. */
export function EmptyNote({ item, busy, children }: { item?: boolean; busy?: boolean; children: ReactNode }) {
  const className = 'px-4 py-6 text-center text-muted';
  const text = busy ? <LoadingIndicator>{children}</LoadingIndicator> : children;
  return item ? <li className={className}>{text}</li> : <p className={className}>{text}</p>;
}

/** What is wrong, in the accent colour: why a sheet cannot be saved (under its fields), or what could
 * not be read. `alert`: read by screen readers as soon as it is shown. */
export function ProblemNote({ alert, children }: { alert?: boolean; children: ReactNode }) {
  return (
    <div role={alert ? 'alert' : undefined} className="text-sm break-words text-accent">
      {children}
    </div>
  );
}

/** A heading over fields in a form (Andre felter, SEO); `first` at the top of a column, without the space
 * above it on a wide screen. */
export function FormHeading({ first, children }: { first?: boolean; children: ReactNode }) {
  return <h2 className={`pt-4 text-xl font-semibold ${first ? 'large:pt-0' : ''}`}>{children}</h2>;
}

/** A section of a long form that folds in and out (the sections of a page; Material 3 has no accordion, so it has its
 * own name): its heading, as large as a FormHeading, is a button with the arrow at its right, which turns while the
 * section is open, and a line under each section. Folded, only the heading is shown; what is in it stays (hidden), so
 * the text and the fields keep what was written, and it shows softly when opened (.editor-reveal). It stops under the
 * top bar when the page scrolls to it. `ref`: the section, for what scrolls to it and marks it. */
export function FoldSection({
  ref,
  title,
  open,
  onToggle,
  children,
}: {
  ref?: Ref<HTMLElement>;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section ref={ref} aria-labelledby={`${id}-title`} className="scroll-mt-[calc(5rem+env(safe-area-inset-top))] border-b border-line">
      <h2>
        <button
          type="button"
          id={`${id}-title`}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-(--block-radius-small) px-3 py-4 text-left text-xl font-semibold transition-colors hover:bg-tint focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          onClick={onToggle}
        >
          <span className="min-w-0 flex-1">{title}</span>
          <CaretDown
            size={20}
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>
      <div id={`${id}-body`} hidden={!open} className="editor-reveal space-y-6 pt-2 pb-8">
        {children}
      </div>
    </section>
  );
}

/** Rows in the theme's segmented list, under a small heading: the start screen, the lists. Never with a note under it. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      {title && <GroupTitle>{title}</GroupTitle>}
      <ul className={listClass}>{children}</ul>
    </section>
  );
}

/** A list of checks, each fine or not (the SEO rating of a page), as PageSpeed shows them: a score from 0 to 100 (the
 * share that is fine) in a ring, green from 90, orange from 50, else red, with the title under it; then those that can be
 * done better (a red triangle before each) and those that are fine (a green dot), each under its name and number
 * (editor.css: --editor-status-*). A row with a `fix` folds out to it (how to do it better). Material 3 has none, so it
 * has its own name. Never with a note under it. The ring fills up to the score when it comes into view, and its number
 * counts up with it. */
export type Check = { ok: boolean; text: string; fix?: string };

// The ring's colours for each status, as whole class names (so Tailwind finds them).
const statusTones = {
  good: { fill: 'fill-(--editor-status-good-surface)', stroke: 'stroke-(--editor-status-good)', text: 'text-(--editor-status-good-text)' },
  average: {
    fill: 'fill-(--editor-status-average-surface)',
    stroke: 'stroke-(--editor-status-average)',
    text: 'text-(--editor-status-average-text)',
  },
  bad: { fill: 'fill-(--editor-status-bad-surface)', stroke: 'stroke-(--editor-status-bad)', text: 'text-(--editor-status-bad-text)' },
};

/** The score of checks from 0 to 100: the share that is fine (100 with none). */
export const scoreOf = (items: Check[]) => (items.length ? Math.round((items.filter((i) => i.ok).length / items.length) * 100) : 100);
const toneOf = (score: number) => statusTones[score >= 90 ? 'good' : score >= 50 ? 'average' : 'bad'];

/** A score from 0 to 100 in a small ring, in the colours of CheckList's (green from 90, orange from 50, else red), at
 * the start of a row (the SEO rating of each page). Material 3 has none, so it has its own name. In a row that is a
 * link, `onClick` is what a tap on the ring does besides (the page opens at its rating, the rest of the row at its top). */
export function ScoreRing({ score, label, onClick }: { score: number; label: string; onClick?: () => void }) {
  const tone = toneOf(score);
  return (
    <span role="img" aria-label={label} onClick={onClick} className="relative size-10 shrink-0">
      <svg viewBox="0 0 36 36" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="15.9155" className={tone.fill} />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${score} 100`}
          className={tone.stroke}
        />
      </svg>
      <span aria-hidden="true" className={`absolute inset-0 grid place-items-center text-sm font-medium tabular-nums ${tone.text}`}>
        {score}
      </span>
    </span>
  );
}

export function CheckList({ title, items }: { title?: string; items: Check[] }) {
  const [open, setOpen] = useState<string | null>(null);
  // The ring fills up to the score when it comes into view (and stays so); at once for those who want less motion.
  const ring = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ring.current;
    if (!el || seen) return;
    if (!('IntersectionObserver' in window)) return setSeen(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setSeen(true), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const bad = items.filter((i) => !i.ok);
  const good = items.filter((i) => i.ok);
  const score = scoreOf(items);
  const tone = toneOf(score);
  // The number counts up with the ring (from what it shows to the score, over the ring's 1.2 s, easing out), and goes
  // on to a new score the same way; at once for those who want less motion.
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!seen) return;
    const start = from.current;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || start === score) {
      from.current = score;
      return setShown(score);
    }
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1200);
      const value = Math.round(start + (score - start) * (1 - (1 - p) ** 3));
      from.current = value;
      setShown(value);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [seen, score]);
  const mark = (ok: boolean) =>
    ok ? (
      <span aria-hidden="true" className="mx-0.5 size-3 shrink-0 rounded-full bg-(--editor-status-good)" />
    ) : (
      <svg aria-hidden="true" viewBox="0 0 12 12" className="size-4 shrink-0 fill-(--editor-status-bad)">
        <path d="M6 1 11.5 11H.5Z" />
      </svg>
    );
  const row = (item: Check) => {
    const shown = open === item.text;
    const text = (
      <span className="min-w-0 flex-1">
        <span className="sr-only">{`${item.ok ? t.common.check.ok : t.common.check.notOk}: `}</span>
        {item.text}
      </span>
    );
    return item.fix ? (
      <ListItem
        key={item.text}
        onClick={() => setOpen(shown ? null : item.text)}
        aria-expanded={shown}
        leading={mark(item.ok)}
        headline={text}
        trailing={<CaretDown size={18} className={`shrink-0 text-muted transition-transform ${shown ? 'rotate-180' : ''}`} />}
      >
        {shown && <p className="editor-reveal px-4 pb-3 pl-11 text-muted">{item.fix}</p>}
      </ListItem>
    ) : (
      <ListItem key={item.text} leading={mark(item.ok)} headline={text} />
    );
  };
  // The ring: its circle is 2πr = 100 long (r = 15.9155), so the score is how much of it is drawn.
  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3">
        <div ref={ring} className="relative size-28">
          <svg viewBox="0 0 36 36" aria-hidden="true" className="size-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" className={tone.fill} />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${seen ? score : 0} 100`}
              className={`transition-[stroke-dasharray] duration-[1200ms] ease-out motion-reduce:transition-none ${seen && score > 0 ? '' : 'opacity-0'} ${tone.stroke}`}
            />
          </svg>
          <span aria-hidden="true" className={`absolute inset-0 grid place-items-center text-4xl tabular-nums ${tone.text}`}>
            {shown}
          </span>
        </div>
        {title && <h3 className="text-xl font-medium">{title}</h3>}
        <span className="sr-only">{t.common.check.score(good.length, items.length)}</span>
      </div>
      {bad.length > 0 && <Group title={`${t.common.check.notOk} (${bad.length})`}>{bad.map(row)}</Group>}
      {good.length > 0 && <Group title={`${t.common.check.ok} (${good.length})`}>{good.map(row)}</Group>}
    </div>
  );
}

/** How a link to a page looks when it is shared on social media (Facebook, LinkedIn, a message), as a card: its picture
 * cut to 1.91:1 (one on its side or square keeps its upper part, as the site cuts it), the site's domain in small
 * capitals, the title and the description, each cut off after two lines. It is never wider than 500 px, the width of a link
 * card in the Facebook feed, and sits at the start of its column. Material 3 has none, so it has its own name. */
export function SharePreview({ image, domain, title, description }: { image: string; domain: string; title: string; description: string }) {
  const [tall, setTall] = useState(false);
  return (
    <figure aria-label={t.forms.sharePreview} className={`${siteCardClass('outlined')} max-w-[500px] overflow-hidden p-0`}>
      <img
        src={image}
        alt=""
        className={`aspect-[1.91/1] w-full bg-line/50 object-cover ${tall ? 'object-[50%_20%]' : ''}`}
        onLoad={(e) => setTall(e.currentTarget.naturalHeight >= e.currentTarget.naturalWidth)}
      />
      <figcaption className="space-y-0.5 border-t border-line px-4 py-3">
        <span className="block truncate text-xs tracking-wide text-muted uppercase">{domain}</span>
        <span className="line-clamp-2 font-semibold">{title}</span>
        <span className="line-clamp-2 text-sm text-muted">{description}</span>
      </figcaption>
    </figure>
  );
}

/** Pictures in the theme's carousel (a theme's or an app's screenshots), each opening a sheet with it whole, under its
 * name. */
export function ImageCarousel({ label, images }: { label: string; images: { src: string; label: string }[] }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<{ src: string; label: string } | null>(null);
  return (
    <>
      <SiteCarousel
        label={label}
        roleDescription={t.common.carousel.name}
        itemRoleDescription={t.common.carousel.item}
        indicatorLabels={images.map((_, i) => t.common.carousel.of(i + 1, images.length))}
        items={images.map((x) => ({
          key: x.src,
          label: x.label,
          content: (
            <button
              type="button"
              aria-haspopup="dialog"
              className="block aspect-[3/4] w-full overflow-hidden border border-line bg-surface"
              onClick={() => {
                setShown(x);
                sheet.current?.showModal();
              }}
            >
              <img src={x.src} alt={x.label} loading="lazy" className="size-full object-cover object-top" />
            </button>
          ),
        }))}
      />
      <BottomSheet
        ref={sheet}
        aria-label={shown?.label}
        onClose={(e) => e.target === e.currentTarget && setShown(null)}
        onClick={(e) => e.target === sheet.current && sheet.current?.close()}
      >
        <SheetTitle title={shown?.label ?? ''} onClose={() => sheet.current?.close()} />
        {shown && (
          <SheetBody>
            <img src={shown.src} alt={shown.label} className="mx-auto w-full max-w-sm border border-line" />
          </SheetBody>
        )}
      </BottomSheet>
    </>
  );
}

/** Whether the window is at least as wide as one of Material 3's breakpoints, kept up to date when the window changes.
 * Use the breakpoint the CSS it goes with changes at (a menu's sheet turns into a dialog from medium, a file's side
 * panel is beside the grid from expanded). */
export function useAtLeast(name: Exclude<Breakpoint, 'compact'>) {
  return useMedia(atLeast(name));
}

/** Whether the window is at least as wide as the breakpoint right now (not kept up to date: for a tap's handler). */
export const atLeastNow = (name: Exclude<Breakpoint, 'compact'>) => matchMedia(atLeast(name)).matches;

/** How the main menu is laid out in this window (lib/menu-layout.mjs): whether the navigation rail stands, which way it
 * expands, and whether the top bar has the menu button. */
export function useMenuLayout() {
  const medium = useAtLeast('medium');
  const expanded = useAtLeast('expanded');
  return menuLayout(expanded ? 'expanded' : medium ? 'medium' : 'compact');
}

// Whether the screen is as a media query says, kept up to date when the window changes.
function useMedia(query: string) {
  const [is, setIs] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const list = matchMedia(query);
    const change = () => setIs(list.matches);
    list.addEventListener('change', change);
    return () => list.removeEventListener('change', change);
  }, [query]);
  return is;
}

/** Whether `box` is in view (or within `margin` of it), kept up to date while the screen scrolls: so a part of a long
 * form does its work only when it is seen (the SEO rating, the earlier versions in EntryForm.tsx). */
export function useInView(box: RefObject<Element | null>, margin = '0px') {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) return setSeen(true);
    const io = new IntersectionObserver((entries) => setSeen(entries.some((e) => e.isIntersecting)), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [box, margin]);
  return seen;
}

// What is searched for and picked over each list, while the editor is open (useKept).
const kept = new Map<string, unknown>();

/** A screen's search or filter (the search over the pages, a status picked), kept while the editor is
 * open, so it is the same again on coming back to the screen (from a page opened in the list). Under
 * its own key for each screen and each of its searches and filters; without a key, not kept. */
export function useKept<T>(key: string | null, first: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => (key && kept.has(key) ? (kept.get(key) as T) : first));
  function set(next: T) {
    if (key) kept.set(key, next);
    setValue(next);
  }
  return [value, set];
}

/** On a computer: what is picked in a screen's list or grid (a file in Filer), in the theme's side sheet at the right
 * of it, with its title and a cross that closes it; it stays in view while the screen scrolls. On a
 * phone the same is in a sheet (useAtLeast). */
export function SideSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const id = useId();
  return (
    <SiteSideSheet
      headline={title}
      headlineId={id}
      closeLabel={t.common.close}
      onClose={onClose}
      className="editor-reveal sticky top-8 max-h-[calc(100dvh-3rem)] self-start"
    >
      <div className="space-y-5">{children}</div>
    </SiteSideSheet>
  );
}

/** One entry of a SectionList: its id, its name and evt. the theme's Badge (how many are new there; or a dot). */
export type NavigationItem = { id: string; label: string; badge?: number | boolean };

/** The sections of a long form (a page's, a post's: Indhold, Status, Andre felter …) as an "on this page" list, as on
 * m3.material.io: plain text, no icons and no surface; the one in view (`value`) in the accent colour and medium
 * weight (`aria-current="location"`). A tap calls `onChange` with its id (EntryForm scrolls to it). Evt. the theme's
 * Badge after the name. `title` names the navigation. In a SectionPane. */
export function SectionList({
  title,
  items,
  value,
  onChange,
}: {
  title: string;
  items: NavigationItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav aria-label={title}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map(({ id, label, badge }) => (
          <li key={id}>
            <button
              type="button"
              aria-current={id === value ? 'location' : undefined}
              onClick={() => onChange(id)}
              className="section-list-item flex w-full items-center gap-2 rounded-(--block-radius-small) px-2 py-2 text-start text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-[current=location]:text-accent"
            >
              <span className="min-w-0">{label}</span>
              {badge ? <SiteBadge count={badge === true ? undefined : badge} /> : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The "on this page" card at the end of a long form on large and wider screens: the theme's outlined card, as tall as
 * its content (it scrolls inside only when that is taller than the window), with the small `caption`
 * (Afsnit), the form's `title` under it and the form's SectionList (`children`). It stays in view while the form
 * scrolls. Its place is FormColumns' `pane`, against the window's end edge; below large it is not drawn. */
export function SectionPane({ caption, title, children }: { caption: string; title: string; children: ReactNode }) {
  return (
    <div className={`${siteCardClass('outlined')} max-h-[calc(100dvh-2*var(--section-pane-gap))] overflow-y-auto`}>
      <p className="section-pane-caption m-0 text-muted">{caption}</p>
      <h2 className="section-pane-title m-0 mb-3 text-ink">{title}</h2>
      {children}
    </div>
  );
}

/** The editor's main navigation (Material 3's navigation drawer, the theme's, in its design): the site's parts in sections
 * (`MainDrawerSection`, `MainDrawerItem`), at the full height of the window, with a header row at the top: `header` (the
 * signed-in user, AccountRow) at the start and the menu button at the end. From medium
 * and wider a navigation rail (`rail`: its destinations, `MainRailItem` and `MainRailSectionItem`) stands in its place while
 * the drawer is closed; its menu button, or a section in it, opens the drawer (`onOpenChange`). The drawer is standard at
 * expanded and wider, beside the content (`open` shows and hides it, and the rail the other way round); modal below, over a
 * scrim, closing on a choice, the scrim, Escape or a swipe toward its edge, with focus on the first item when it opens
 * (lib/menu-layout.mjs). `variant` forces one of them, without the rail (the parts page does).
 * It has two levels when its children do (`MainDrawerSectionItem`, `MainDrawerBack`): `onEscape` is called for Escape and
 * answers true when it used the key (went back to the first level), so the modal drawer stays open; false lets it close. */
export function MainDrawer({
  label,
  open,
  onOpenChange,
  onEscape,
  variant,
  rail,
  header,
  children,
}: {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEscape?: () => boolean;
  variant?: 'modal' | 'standard';
  rail?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}) {
  const layout = useMenuLayout();
  const shown = variant ?? layout.expanded;
  const railShown = rail !== undefined && variant === undefined && layout.rail && !(shown === 'standard' && open);
  return (
    <>
      {railShown && (
        <MainRail label={label} onOpen={() => onOpenChange(true)}>
          {rail}
        </MainRail>
      )}
      {shown === 'standard' ? (
        <StandardMainDrawer label={label} open={open} onOpenChange={onOpenChange} onEscape={onEscape} header={header}>
          {children}
        </StandardMainDrawer>
      ) : (
        <ModalMainDrawer label={label} open={open} onOpenChange={onOpenChange} onEscape={onEscape} header={header}>
          {children}
        </ModalMainDrawer>
      )}
    </>
  );
}

// The collapsed navigation rail (the theme's): sticky, the full height of the window with room for a phone's notch, with its
// menu button at the top, which opens the drawer. Never expanded itself: the drawer is what expands (MainDrawer).
function MainRail({ label, onOpen, children }: { label: string; onOpen: () => void; children: ReactNode }) {
  return (
    <aside className="editor-main-rail-frame sticky top-0 z-10 h-dvh shrink-0 self-start bg-(--navigation-rail-surface,var(--bg)) pt-[env(safe-area-inset-top)]">
      <SiteNavigationRail
        label={label}
        menuLabel={t.library.openMenu}
        expanded={false}
        onExpandedChange={onOpen}
        className="editor-main-rail h-full"
      >
        {children}
      </SiteNavigationRail>
    </aside>
  );
}

// The header row at the top of either drawer: `header` (the signed-in user on the first level, the back row on a section's
// list; MainMenu.tsx) at the start and the menu button at the end, which closes the drawer and stays level with the top bar's
// menu button. The header cell starts at the drawer items' outer edge: the row has no start padding, and the header (the
// account row, the back row) brings the items' inline padding itself, so its pill (editor.css, .editor-main-drawer-header)
// has the shape of an item's and the avatar or arrow stands over the items' icons. The button is centred on the 1.5rem box
// of the items' trailing arrows (a negative end margin from the button's own width). The row is the top bar's height (`--top-app-bar-height`), so the divider (middle inset) under it stands level with the top bar's line.
function MainDrawerMenuButton({ onClick, header }: { onClick: () => void; header?: ReactNode }) {
  return (
    <>
      <div className="editor-main-drawer-header flex min-h-(--top-app-bar-height,4rem) items-center gap-1 p-(--navigation-drawer-item-padding,0_1rem) py-0 ps-0">
        <div className="min-w-0 flex-1">{header}</div>
        <MenuButton label={t.library.closeMenu} open onClick={onClick} className="-me-[calc((var(--icon-button-width)-1.5rem)/2)]" />
      </div>
      <SiteDivider kind="middle-inset" className="mb-4" />
    </>
  );
}

// What is inside either drawer: the sections in a <nav>.
function MainDrawerBody({ label, children }: { label: string; children: ReactNode }) {
  return <nav aria-label={label}>{children}</nav>;
}

// The standard drawer: beside the content, sticky, the full height of the window (room at the top for a phone's notch), with
// the menu button at the top; there only while it is open (the theme's drawer handles the arrow keys).
function StandardMainDrawer({
  label,
  open,
  onOpenChange,
  onEscape,
  header,
  children,
}: {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEscape?: () => boolean;
  header?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <aside className="sticky top-0 z-10 h-dvh shrink-0 self-start overflow-y-auto">
      <SiteNavigationDrawer
        variant="standard"
        className="editor-main-drawer-panel min-h-full pt-[env(safe-area-inset-top)]"
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Escape' && onEscape?.()) e.preventDefault();
        }}
      >
        <MainDrawerMenuButton onClick={() => onOpenChange(false)} header={header} />
        <MainDrawerBody label={label}>{children}</MainDrawerBody>
      </SiteNavigationDrawer>
    </aside>
  );
}

// The modal drawer: a <dialog> from the start edge over its scrim. Always in the page (closed it is not drawn), so the
// links are there for check:screens. Escape closes the dialog itself; the scrim is a click on the dialog, not on its content.
function ModalMainDrawer({
  label,
  open,
  onOpenChange,
  onEscape,
  header,
  children,
}: {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEscape?: () => boolean;
  header?: ReactNode;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Escape that went back a level: the dialog must not close on it (keydown comes before the dialog's cancel).
  const escaped = useRef(false);
  const down = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      siteFocusNavigationDrawerItem(el);
    } else if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-label={label}
      className={`${siteNavigationDrawerDialogClass} editor-main-drawer`}
      onClose={() => onOpenChange(false)}
      onCancel={(e) => {
        if (escaped.current) e.preventDefault();
        escaped.current = false;
      }}
      onClick={(e) => {
        if (e.target === dialog.current || (e.target as Element).closest('a[href]')) onOpenChange(false);
      }}
      onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const from = down.current;
        down.current = null;
        if (from && swipeCloses(e.clientX - from.x, e.clientY - from.y, getComputedStyle(e.currentTarget).direction === 'rtl'))
          onOpenChange(false);
      }}
    >
      <SiteNavigationDrawer
        variant="modal"
        className="editor-main-drawer-panel pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          escaped.current = false;
          if (e.key === 'Escape' && onEscape?.()) {
            escaped.current = true;
            e.preventDefault();
          }
        }}
      >
        <MainDrawerMenuButton onClick={() => onOpenChange(false)} header={header} />
        <MainDrawerBody label={label}>{children}</MainDrawerBody>
      </SiteNavigationDrawer>
    </dialog>
  );
}

/** A destination in the main navigation rail: Home, a link; its icon (filled while `selected`) over its name. */
export function MainRailItem({ href, icon: Glyph, label, selected }: { href: string; icon: Icon; label: string; selected?: boolean }) {
  return <SiteNavigationRailItem href={href} icon={<Glyph weight={selected ? 'fill' : 'regular'} />} label={label} selected={selected} />;
}

/** A section in the main navigation rail: a button that opens the drawer at that section's list (`onClick`); `selected`
 * when the open screen is in it. */
export function MainRailSectionItem({
  icon: Glyph,
  label,
  selected,
  onClick,
}: {
  icon: Icon;
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <SiteNavigationRailItem icon={<Glyph weight={selected ? 'fill' : 'regular'} />} label={label} selected={selected} onClick={onClick} />
  );
}

/** A section of the main drawer: its title over its items, a divider between sections (the theme's). */
export const MainDrawerSection = SiteNavigationDrawerSection;

/** A part in the main drawer: its icon (filled while open), its name, how many there are (`count`, at the end) and
 * `selected` when it is the open one. */
export function MainDrawerItem({
  href,
  icon: Glyph,
  label,
  count,
  selected,
}: {
  href: string;
  icon: Icon;
  label: string;
  count?: number | null;
  selected?: boolean;
}) {
  return (
    <SiteNavigationDrawerItem
      href={href}
      active={selected}
      aria-current={selected ? 'page' : undefined}
      icon={<Glyph weight={selected ? 'fill' : 'regular'} />}
      badge={count ?? undefined}
    >
      {label}
    </SiteNavigationDrawerItem>
  );
}

/** A section on the first level of the main drawer: its icon, its name and an arrow to its list. A button (it shows the
 * list in the same drawer, so the modal drawer stays open); `selected` when the open screen is in it. */
export function MainDrawerSectionItem({
  icon: Glyph,
  label,
  selected,
  onClick,
}: {
  icon: Icon;
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <SiteNavigationDrawerItem
      active={selected}
      aria-current={selected ? 'true' : undefined}
      icon={<Glyph weight={selected ? 'fill' : 'regular'} />}
      trailing="caret-right"
      onClick={onClick}
    >
      {label}
    </SiteNavigationDrawerItem>
  );
}

/** The back row in the main drawer's header row (the `header` of MainDrawer) on a section's list: an arrow and `label`, with
 * `name` as its accessible name (where it goes); `onClick` shows the first level. It is a drawer item (the pill, the inline
 * padding), so its arrow stands over the items' icons; it is as high as the account row (56px, a drawer item's height). */
export function MainDrawerBack({ label, name, onClick }: { label: string; name?: string; onClick: () => void }) {
  return (
    <SiteNavigationDrawerBack label={label} aria-label={name} onClick={onClick} className="navigation-drawer-item navigation-drawer-back" />
  );
}

/** A part with sub-screens in a section's list: the part as an item with the button that folds its sub-screens out
 * (`MainDrawerSubitem`) after it. `selected` when the part itself is the open screen; `open` folds it out (it holds the
 * open screen), and later changes of it fold it out too. The sub-screens stay in the page, `hidden` while it is folded in. */
export function MainDrawerFold({
  href,
  icon: Glyph,
  label,
  count,
  selected,
  open,
  children,
}: {
  href: string;
  icon: Icon;
  label: string;
  count?: number | null;
  selected?: boolean;
  open?: boolean;
  children: ReactNode;
}) {
  const [unfolded, setUnfolded] = useState(Boolean(open));
  useEffect(() => {
    if (open) setUnfolded(true);
  }, [open]);
  return (
    <>
      <SiteNavigationDrawerRow>
        <SiteNavigationDrawerItem
          href={href}
          active={selected}
          aria-current={selected ? 'page' : undefined}
          icon={<Glyph weight={selected || open ? 'fill' : 'regular'} />}
          badge={count ?? undefined}
        >
          {label}
        </SiteNavigationDrawerItem>
        <SiteNavigationDrawerToggle
          label={unfolded ? t.library.hideSubpagesOf(label) : t.library.showSubpagesOf(label)}
          expanded={unfolded}
          onClick={() => setUnfolded(!unfolded)}
        />
      </SiteNavigationDrawerRow>
      <div hidden={!unfolded}>{children}</div>
    </>
  );
}

/** A sub-screen of a `MainDrawerFold`, `selected` when it is the open one. */
export function MainDrawerSubitem({ href, label, selected }: { href: string; label: string; selected?: boolean }) {
  return (
    <SiteNavigationDrawerSubitem href={href} active={selected} aria-current={selected ? 'page' : undefined}>
      {label}
    </SiteNavigationDrawerSubitem>
  );
}

/** One level of the main drawer (the first, or a section's list). Every level stays in the page; the ones not `shown` are
 * `hidden`, so out of the accessibility tree and the focus order. A level takes the focus when it is shown after a change of
 * level (`focus`: `list`, the first item under the back row, or `top`, the section it came from). */
export function MainDrawerLevel({ shown = true, focus, children }: { shown?: boolean; focus?: 'list' | 'top'; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = el.current;
    if (!shown || !focus || !root) return;
    const target =
      focus === 'list'
        ? root.querySelector<HTMLElement>('.navigation-drawer-item:not(.navigation-drawer-back), .navigation-drawer-subitem')
        : (root.querySelector<HTMLElement>('[data-active]') ?? root.querySelector<HTMLElement>('.navigation-drawer-item'));
    target?.focus();
  }, [shown, focus]);
  return (
    <div ref={el} hidden={!shown} className={shown ? 'contents' : undefined}>
      {children}
    </div>
  );
}

/** The panel icon at the start of the top bar on every screen (Screen.tsx): it opens and closes the main drawer. `open`: the drawer
 * is shown, so the icon is `left_panel_close` (`sidebar`), else `left_panel_open` (`sidebar-simple`). `label` says what the next
 * press does. */
export function MenuButton({
  label,
  open,
  onClick,
  className = '',
}: {
  label: string;
  open?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return <IconButton icon={open ? Sidebar : SidebarSimple} label={label} aria-expanded={open} className={className} onClick={onClick} />;
}

/** Tabs (Material 3): what they are called (`label`), the one open (`value`), each one's name and icon, and the
 * opening of another. Every tab has its icon over its name, so all tabs in the editor look the same. */
export type TabChoice<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string; icon: Icon }[];
  onChange: (v: T) => void;
};

/** The row of the theme's tabs: its primary tabs, sharing the width, each with its icon over its name, the open one
 * with the theme's indicator under it. The arrow keys go to the one before and after and open it. `id` ties it to its
 * TabPanel. In a screen's top app bar (`tabs` on Screen), the bar's line is the divider under them (ui.css). */
export function TabRow<T extends string>({ id, label, value, options, onChange }: TabChoice<T> & { id: string }) {
  const keys = (e: KeyboardEvent<HTMLElement>) => {
    const at = options.findIndex((o) => o.value === value);
    const to = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: options.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = options[(to + options.length) % options.length];
    onChange(next.value);
    e.currentTarget.querySelector<HTMLElement>(`[data-tab="${next.value}"]`)?.focus();
  };
  return (
    <SiteTabs kind="primary" scrollable={false} label={label} onKeyDown={keys}>
      {options.map(({ value: v, label: name, icon: Glyph }) => (
        <SiteTab
          key={v}
          id={`${id}-tab-${v}`}
          data-tab={v}
          controls={`${id}-panel`}
          selected={v === value}
          icon={<Glyph />}
          onClick={() => onChange(v)}
        >
          <span className="truncate">{name}</span>
        </SiteTab>
      ))}
    </SiteTabs>
  );
}

/** What the open tab of a TabRow (the same `id`) shows. */
export function TabPanel({ id, value, className = '', children }: { id: string; value: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`${id}-panel`}
      aria-labelledby={`${id}-tab-${value}`}
      tabIndex={0}
      className={`focus-visible:outline-none ${className}`}
    >
      {children}
    </div>
  );
}

/** A form in two columns on a wide computer screen (large): `main` in the wide one, and at the right
 * `first` (the status, or the fields beside a preview) and `side` (the other fields), each on a card,
 * or without one (`cards` false: a preview that is its own card). `sticky`: the right column stays in
 * view while the form scrolls (alone, it spans both rows, so it has the whole height to stay in). Narrower, one column as on a phone: `first`, `main`, then `side`. */
export function FormColumns({
  first,
  main,
  side,
  cards = true,
  sticky = false,
  pane,
}: {
  first?: ReactNode;
  main: ReactNode;
  side?: ReactNode;
  cards?: boolean;
  sticky?: boolean;
  /** A SectionPane, on large and wider screens against the window's end edge under the top bar (--section-pane-width
   * wide, in an absolute strip along the content that its card sticks in while the form scrolls; editor.css lets the content column keep clear of it); below large nothing.
   * Instead of `first` and `side`. */
  pane?: ReactNode;
}) {
  // On a wide computer screen (large) each of the right column's parts on the theme's outlined card.
  const carded = useAtLeast('large') && cards;
  const right = `space-y-6 large:col-start-2 ${carded ? siteCardClass('outlined') : ''} ${sticky ? 'large:sticky large:top-8' : ''}`;
  return (
    <div
      className={`flex flex-col gap-6 ${
        pane ? '' : 'large:grid large:grid-cols-[minmax(0,1fr)_22rem] large:grid-rows-[auto_1fr] large:items-start large:gap-x-8'
      }`}
    >
      {first && <div className={`${right} ${side ? 'large:row-start-1' : 'large:row-span-2 large:row-start-1'}`}>{first}</div>}
      <div className="min-w-0 space-y-6 large:col-start-1 large:row-span-2 large:row-start-1">{main}</div>
      {side && <div className={`${right} ${first ? 'large:row-start-2' : 'large:row-span-2 large:row-start-1'}`}>{side}</div>}
      {pane && (
        <div className="editor-section-pane hidden large:absolute large:inset-y-0 large:end-0 large:z-10 large:block large:w-(--section-pane-width) large:pe-(--section-pane-gap)">
          <div className="large:sticky large:top-(--section-pane-gap) large:mt-(--section-pane-gap)">{pane}</div>
        </div>
      )}
    </div>
  );
}

/** The icon before a name in a row or a list of choices, the same everywhere: the theme's leading icon (Material's),
 * grey; `selected`: in the selected colour, the open part in the sidebar (App.tsx). Or what is in it (`children`): the
 * chosen icon of an icon field. Beside its row's first two lines, as the theme places it. */
export function LeadingIcon({ icon: Glyph, selected = false, children }: { icon?: Icon; selected?: boolean; children?: ReactNode }) {
  return (
    <SiteListItemLeadingIcon icon={Glyph && <Glyph />} selected={selected}>
      {children}
    </SiteListItemLeadingIcon>
  );
}

/** A picture before a name in a row, as a ListItem's `leading` (Material's leading image): small and square, with the
 * corners of a field, beside its row's first two lines, as an icon; the picture a page's colours came from ("Farver" ›
 * "Sider"). `alt` empty when the row's text says what it is. */
export function LeadingImage({ src, alt = '' }: { src: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" className="size-10 rounded-(--block-radius-small) bg-tint object-cover" />;
}

/** What a design token is, for the sample of it before its row ("Dele" › "Værdier", Tokens.tsx). */
export type TokenKind = 'shape' | 'elevation' | 'font' | 'color';

/** A sample of one of the theme's design tokens before its name in a row, as a ListItem's `leading`, beside its first
 * two lines as an icon,
 * drawn with the token itself (`value`, its CSS variable as CSS: `var(--radius)`), so it shows what the theme sets: a corner with its radius
 * (shape), a surface with its shadow (elevation), "Aa" in its font (font; in `weight`, for a type role) and a round of its
 * colour (color). Material 3 has none; the editor's own. */
export function LeadingToken({ kind, value, weight }: { kind: TokenKind; value: string; weight?: string }) {
  return (
    <span className="flex size-10 items-center justify-center" aria-hidden="true">
      {kind === 'shape' && <span className="size-10 border-t-2 border-l-2 border-accent bg-tint" style={{ borderTopLeftRadius: value }} />}
      {kind === 'elevation' && <span className="size-8 rounded-(--block-radius) bg-surface" style={{ boxShadow: value }} />}
      {kind === 'font' && (
        <span className="text-2xl leading-none" style={{ fontFamily: value, fontWeight: weight }}>
          Aa
        </span>
      )}
      {kind === 'color' && <span className="size-8 rounded-full border border-line" style={{ background: value }} />}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------------
// The sheet from the bottom

/** A screen's top bar (Screen.tsx): the theme's top app bar (Material 3's), at the top of the screen (it scrolls away with the page),
 * below a phone's clock, and marked as the theme marks it once the screen has scrolled under it (data-stuck). */
export function TopAppBar({ children }: { children: ReactNode }) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const check = () => setStuck(scrollY > 0);
    check();
    addEventListener('scroll', check, { passive: true });
    return () => removeEventListener('scroll', check);
  }, []);
  return (
    <SiteTopAppBar className="pt-[env(safe-area-inset-top)]" data-stuck={stuck || undefined}>
      {children}
    </SiteTopAppBar>
  );
}

/** The theme's dialog (Material 3's), in the middle of the screen over its scrim, on a <dialog> (`ref`; opened with
 * showModal): a question (ask.tsx). */
export function Dialog({ ref, className, children, ...rest }: DialogHTMLAttributes<HTMLDialogElement> & { ref?: Ref<HTMLDialogElement> }) {
  return (
    <dialog ref={ref} className={[siteDialogModalClass, className].filter(Boolean).join(' ')} {...rest}>
      <SiteDialog className="p-6">{children}</SiteDialog>
    </dialog>
  );
}

/** The sheet from the bottom (a dialog in the middle on a computer): the theme's bottom sheet, as high as what is in
 * it, on a <dialog> (`ref`; opened with showModal), with a SheetTitle and SheetBody, SheetList or SheetActions in it.
 * `full`: as high as the screen, and wider on a computer, with a whole page in it (the preview, PageFrame).
 * `panel`: the theme's modal side sheet (data-wide="side-sheet") at the window's end edge under the top bar, half the space
 * beside the start panel (.editor-side-panel in editor.css); the rest of the page stays in view, inert as under a dialog. */
export function BottomSheet({
  ref,
  full,
  panel,
  className,
  children,
  ...rest
}: DialogHTMLAttributes<HTMLDialogElement> & { ref?: Ref<HTMLDialogElement>; full?: boolean; panel?: boolean }) {
  const sheet = full ? siteBottomSheetFullClass : siteBottomSheetFitClass;
  return (
    <dialog ref={ref} className={[sheet, 'editor-sheet', panel && 'editor-side-panel', className].filter(Boolean).join(' ')} {...rest}>
      <div className={siteBottomSheetContainerClass()} data-wide={panel ? 'side-sheet' : undefined}>
        {children}
      </div>
    </dialog>
  );
}

/** A web page in a frame, in a full BottomSheet (the preview of a page): `html` is the whole page, drawn as
 * wide as `width` (one of Material 3's window sizes) and made smaller to fit, scrolled in the frame. Nothing
 * in it runs (no scripts), and its links lead nowhere. With `part` (a selector: the header) only that part of the page is
 * shown, as high as it is (measured when the page is in the frame), in the frame's own place: Appearance › Header. */
export function PageFrame({ html, width, title, part }: { html: string; width: number; title: string; part?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Where the part is in the page (px of the page), once it is in the frame.
  const [cut, setCut] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const watch = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const scale = size.width ? Math.min(1, size.width / width) : 1;
  const measure = (frame: HTMLIFrameElement) => {
    const doc = frame.contentDocument;
    const el = part && doc?.querySelector(part);
    if (!doc || !el) return;
    // Only the part is shown: the page does not scroll in its frame.
    doc.documentElement.style.overflow = 'hidden';
    const r = el.getBoundingClientRect();
    setCut({ top: r.top, height: r.height });
  };
  const height = part ? (cut ? cut.top + cut.height : width) : size.height / scale;
  return (
    <div
      ref={box}
      className="relative min-h-0 flex-1 overflow-hidden border-t border-line bg-line/40"
      style={part ? { height: (cut?.height ?? 0) * scale } : undefined}
    >
      {size.width > 0 && (
        <iframe
          title={title}
          srcDoc={html}
          sandbox="allow-same-origin"
          className="absolute top-0 left-1/2 origin-top border-0 bg-white"
          style={{ width, height, top: -(cut?.top ?? 0) * scale, transform: `translateX(-50%) scale(${scale})` }}
          onLoad={part ? (e) => measure(e.currentTarget) : undefined}
        />
      )}
    </div>
  );
}

/** The top of a sheet: its title and the cross that closes it. On a phone a handle above it, as in
 * Google's sheets: the top is dragged up to make the sheet as tall as the screen (as far as there is
 * more in it) and down to make it small again or close it, fast or far; a tap on the handle makes it
 * taller or smaller. Its height is the sheet's CSS (`data-tall` in editor.css); while it is dragged,
 * its height and place follow the finger. */
export function SheetTitle({ title, onClose }: { title: string; onClose: () => void }) {
  const top = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  // Where the finger went down and last was, how fast it went (px/ms, down), and the heights.
  const drag = useRef<{
    id: number;
    y: number;
    last: number;
    at: number;
    v: number;
    from: number;
    small: number;
    big: number;
    moved: boolean;
  } | null>(null);
  // A drag on the handle is not a tap.
  const dragged = useRef(false);
  const sheetOf = () => top.current?.closest('dialog') ?? null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The sheet as its CSS makes it, small or tall, without what the drag put on it.
  const settle = (sheet: HTMLDialogElement, big: boolean) => {
    sheet.toggleAttribute('data-tall', big);
    sheet.style.removeProperty('height');
    sheet.style.removeProperty('max-height');
    sheet.style.removeProperty('transform');
    sheet.style.removeProperty('transition');
    setTall(big);
  };
  // Small again when it closes (the cross, Fortryd, Esc), so it opens small next time.
  useEffect(() => {
    const sheet = sheetOf();
    if (!sheet) return;
    const reset = () => settle(sheet, false);
    sheet.addEventListener('close', reset);
    return () => sheet.removeEventListener('close', reset);
  }, []);
  // How high the sheet is small and tall (each as high as what is in it, if that is less).
  const heights = (sheet: HTMLDialogElement) => {
    const was = sheet.hasAttribute('data-tall');
    sheet.toggleAttribute('data-tall', false);
    const small = sheet.offsetHeight;
    sheet.toggleAttribute('data-tall', true);
    const big = sheet.offsetHeight;
    sheet.toggleAttribute('data-tall', was);
    return { small, big, now: was ? big : small };
  };
  // Glides from where the finger left it to a height (0: down and closed), then is that.
  const glide = (sheet: HTMLDialogElement, to: number, small: number, big: number) => {
    const done = () => (to ? settle(sheet, to === big && big > small) : (onClose(), settle(sheet, false)));
    if (reduced()) return done();
    // The site's spatial spring (motionTiming, "Bevægelse").
    const { duration, easing } = motionTiming('spatial');
    sheet.style.transition = `height ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
    sheet.style.height = `${to || small}px`;
    sheet.style.transform = to ? 'none' : `translateY(${small}px)`;
    setTimeout(done, duration);
  };
  const toggle = () => {
    const sheet = sheetOf();
    if (!sheet) return;
    const { small, big, now } = heights(sheet);
    if (big <= small) return;
    sheet.style.maxHeight = 'none';
    sheet.style.height = `${now}px`;
    void sheet.offsetHeight;
    glide(sheet, tall ? small : big, small, big);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    // Not the cross, and not on a computer, where the sheet is a dialog in the middle.
    if ((e.target as Element).closest('button:not([data-bottom-sheet-handle])') || matchMedia(atLeast('medium')).matches) return;
    drag.current = { id: e.pointerId, y: e.clientY, last: e.clientY, at: e.timeStamp, v: 0, from: 0, small: 0, big: 0, moved: false };
    dragged.current = false;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const sheet = sheetOf();
    if (!d || d.id !== e.pointerId || !sheet) return;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dy) < 6) return;
      const { small, big, now } = heights(sheet);
      Object.assign(d, { moved: true, from: now, small, big });
      dragged.current = true;
      top.current?.setPointerCapture(e.pointerId);
      sheet.style.transition = 'none';
      sheet.style.maxHeight = 'none';
    }
    d.v = (e.clientY - d.last) / Math.max(1, e.timeStamp - d.at);
    d.last = e.clientY;
    d.at = e.timeStamp;
    const high = d.from - dy;
    // Taller as far as it goes (a little more, slowly, as if on a rubber band), lower by sliding down.
    const height = high > d.big ? d.big + (high - d.big) / 4 : Math.max(high, d.small);
    sheet.style.height = `${height}px`;
    sheet.style.transform = high < d.small ? `translateY(${d.small - high}px)` : 'none';
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    const sheet = sheetOf();
    if (!d?.moved || d.id !== e.pointerId || !sheet) return;
    const high = d.from - (e.clientY - d.y);
    const { small, big } = d;
    const fast = Math.abs(d.v) > 0.5 && e.timeStamp - d.at < 100;
    let to: number;
    if (fast && d.v > 0) to = high > small + 1 ? small : 0;
    else if (fast) to = big > small ? big : small;
    else if (high < small) to = high < small * 0.7 ? 0 : small;
    else to = big > small && high - small > (big - small) / 2 ? big : small;
    glide(sheet, to, small, big);
  };

  return (
    <div
      ref={top}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="shrink-0 touch-none select-none medium:touch-auto medium:select-auto"
    >
      <SiteBottomSheetHeader
        headline={title}
        closeLabel={t.common.close}
        handleLabel={tall ? t.common.sheetSmaller : t.common.sheetTaller}
        onHandle={() => !dragged.current && toggle()}
        onClose={onClose}
      />
    </div>
  );
}

/** A choice: what it says, and other words it is found by in a search (`words`: another name, a code);
 * `detail`: shown muted at its right (a country code). */
type ChoiceOption<T> = { value: T; label: string; group?: string; lang?: string; words?: string; detail?: string };

/** The sheet with the choices of a Choice or a ChoiceListItem, the chosen one marked; choices may be in
 * groups with a heading (the years). A choice closes it. With `search` (what is searched, for screen
 * readers), a search field over the choices finds them by what they say and their words; it is empty
 * again when the sheet opens. */
function ChoiceSheet<T extends string>({
  dialog,
  title,
  value,
  options,
  search,
  onChange,
}: {
  dialog: RefObject<HTMLDialogElement | null>;
  title: string;
  value: T;
  options: ChoiceOption<T>[];
  search?: string;
  onChange: (v: T) => void;
}) {
  const [query, setQuery] = useState('');
  const close = () => dialog.current?.close();
  const q = query.trim().toLocaleLowerCase();
  const shown = q ? options.filter((o) => `${o.label} ${o.words ?? ''}`.toLocaleLowerCase().includes(q)) : options;
  return (
    <BottomSheet ref={dialog} aria-label={title} onClick={(e) => e.target === dialog.current && close()} onClose={() => setQuery('')}>
      <SheetTitle title={title} onClose={close} />
      {search && <SearchBar value={query} onChange={setQuery} label={search} className="mx-5 mb-2 shrink-0" />}
      <SheetList>
        {!shown.length && <EmptyNote item>{t.common.noMatch}</EmptyNote>}
        {shown.map((o, i) => (
          <li key={o.value} lang={o.lang}>
            {o.group && o.group !== shown[i - 1]?.group && <SheetGroupTitle>{o.group}</SheetGroupTitle>}
            <Option
              selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
            >
              {o.detail ? (
                <span className="flex gap-3">
                  <span className="min-w-0 flex-1">{o.label}</span>
                  <span className="shrink-0 text-muted tabular-nums">{o.detail}</span>
                </span>
              ) : (
                o.label
              )}
            </Option>
          </li>
        ))}
      </SheetList>
    </BottomSheet>
  );
}

/** An icon that opens a sheet with choices (ChoiceSheet). It is marked itself while it filters (selected), and greyed
 * out while it cannot be used (`disabled`: the sorting while the pages are shown as the menu). */
export function Choice<T extends string>({
  title,
  icon,
  value,
  selected,
  disabled,
  options,
  search,
  onChange,
}: {
  title: string;
  icon: Icon;
  value: T;
  selected?: boolean;
  disabled?: boolean;
  options: ChoiceOption<T>[];
  search?: string;
  onChange: (v: T) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <IconButton
        icon={icon}
        label={title}
        selected={selected}
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      />
      <ChoiceSheet dialog={dialog} title={title} value={value} options={options} search={search} onChange={onChange} />
    </>
  );
}

/** One filter in Filters: its heading, what is chosen and the choices (the first: all), which may be in
 * groups with a heading (the pages and the tags). */
export type FilterGroup = { title: string; value: string; options: ChoiceOption<string>[]; onChange: (v: string) => void };

/** The funnel, which opens a sheet with all the filters of a list, each a group that folds out from its
 * heading (with what is chosen in it beside it) to its choices, the chosen one marked. One group is open
 * at a time, the first when the sheet opens, and the sheet does not get lower when another opens; a lone
 * group stands open under its heading. A choice is taken at once and the sheet stays open, so another filter can be
 * chosen too; the cross or a tap outside closes it. The funnel is marked while a filter is chosen (selected). */
export function Filters({ title, selected, groups }: { title: string; selected?: boolean; groups: FilterGroup[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const first = groups[0]?.title ?? '';
  const [open, setOpen] = useState<string | null>(first);
  const lone = groups.length === 1;
  const close = () => dialog.current?.close();
  function toggle(group: string) {
    // As high as it has been, so it does not get lower under the finger.
    const el = dialog.current;
    if (el) el.style.minHeight = `${Math.max(el.offsetHeight, parseFloat(el.style.minHeight) || 0)}px`;
    setOpen(open === group ? null : group);
  }
  return (
    <>
      <IconButton icon={Funnel} label={title} selected={selected} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} />
      <BottomSheet
        ref={dialog}
        aria-label={title}
        onClick={(e) => e.target === dialog.current && close()}
        onClose={(e) => {
          if (e.target !== e.currentTarget) return;
          e.currentTarget.style.minHeight = '';
          setOpen(first);
        }}
      >
        <SheetTitle title={title} onClose={close} />
        <SheetList div>
          {groups.map((g) => {
            const unfolded = lone || open === g.title;
            return (
              <section key={g.title}>
                {lone ? (
                  <SheetGroupTitle>{g.title}</SheetGroupTitle>
                ) : (
                  <h3>
                    <button
                      type="button"
                      aria-expanded={unfolded}
                      className={`${optionClass()} font-medium`}
                      onClick={() => toggle(g.title)}
                    >
                      <span className="min-w-0 flex-1">{g.title}</span>
                      <span className="min-w-0 truncate font-normal text-muted">{g.options.find((o) => o.value === g.value)?.label}</span>
                      <CaretDown size={16} className={`shrink-0 text-muted transition-transform ${unfolded ? 'rotate-180' : ''}`} />
                    </button>
                  </h3>
                )}
                {unfolded && (
                  <ul className={lone ? '' : 'pl-3'}>
                    {g.options.map((o, i) => (
                      <li key={o.value} lang={o.lang}>
                        {o.group && o.group !== g.options[i - 1]?.group && <SheetGroupTitle>{o.group}</SheetGroupTitle>}
                        <Option selected={o.value === g.value} onClick={() => g.onChange(o.value)}>
                          {o.label}
                        </Option>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </SheetList>
      </BottomSheet>
    </>
  );
}

/** A phone number with its country code before it: the code, with the country's flag, opens a sheet
 * with the countries (ChoiceSheet) and a search over them; the number is typed in the field after it
 * (`children`). The chosen country is marked and scrolled to. */
export function PhoneField({ code, onCode, children }: { code: string; onCode: (code: string) => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The country picked, of those with the code (+1 is both the USA and Canada); the first with it until one is.
  const [picked, setPicked] = useState<string>();
  const region = picked && dialCodes[picked] === code ? picked : regionOf(code);
  const options = useMemo(
    () => countries().map((c) => ({ value: c.region, label: `${flagOf(c.region)} ${c.name}`, detail: c.code, words: c.words })),
    [],
  );
  const name = region ? countryName(region) : code;
  return (
    <div className="flex gap-2">
      <div className="shrink-0">
        <ChoiceField
          aria-haspopup="dialog"
          aria-label={t.common.phoneCode.label(name, code)}
          title={name}
          onClick={() => {
            dialog.current?.showModal();
            dialog.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'center' });
          }}
        >
          {region && <span aria-hidden="true">{flagOf(region)}</span>}
          <span className="tabular-nums">{code}</span>
        </ChoiceField>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <ChoiceSheet
        dialog={dialog}
        title={t.common.phoneCode.title}
        value={region ?? ''}
        options={options}
        search={t.common.phoneCode.search}
        onChange={(r) => {
          setPicked(r);
          onCode(dialCodes[r]);
        }}
      />
    </div>
  );
}

/** A choice's field with its menu (Material 3's exposed dropdown menu) for a few choices: the field (ChoiceField) shows
 * what is chosen (`empty`, muted, while nothing is) with its arrow, which points up while the menu is open, and a tap,
 * Enter, Space or the down arrow opens the Menu (`attached`) right under it, as wide as the field, the chosen one
 * checked. Select's field and MenuRow's small box (`size`) are this one. `title`: the menu's name on a phone. */
function ChoiceMenu<T extends string>({
  title,
  value,
  options,
  empty,
  onChange,
  ...field
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onChange' | 'title' | 'value'> &
  InField & {
    title: string;
    value: T;
    options: ChoiceOption<T>[];
    empty?: string;
    size?: 'small';
    onChange: (v: T) => void;
  }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const chosen = options.find((o) => o.value === value);
  // The field's box (the button's parent) is what the menu sits under, so it is as wide as the whole field.
  const [keyboard, setKeyboard] = useState(false);
  const toggle = (button: HTMLElement, byKeyboard: boolean) => {
    setKeyboard(byKeyboard);
    setAnchor(anchor ? null : button.parentElement);
  };
  return (
    <>
      <ChoiceField
        {...field}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        // A click with no pointer (Enter, Space) has detail 0.
        onClick={(e: MouseEvent<HTMLElement>) => toggle(e.currentTarget, e.detail === 0)}
        onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
          if (e.key !== 'ArrowDown' || anchor) return;
          e.preventDefault();
          toggle(e.currentTarget, true);
        }}
      >
        <span lang={chosen?.lang} className={`min-w-0 flex-1 truncate ${chosen ? '' : 'opacity-60'}`}>
          {chosen ? chosen.label : empty}
        </span>
      </ChoiceField>
      <Menu attached keyboard={keyboard} anchor={anchor} label={title} onClose={() => setAnchor(null)}>
        {options.map((o) => (
          <MenuItem key={o.value} selected={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** A field with a choice: it shows what is chosen, and opens the choices: on a computer a menu right under the field
 * (ChoiceMenu), on a phone the sheet with the choices (ChoiceSheet), not the phone's own list. `title` is the sheet's (the
 * field's name); `empty` is shown, muted, while nothing is chosen; with `search` a search field over the choices, when
 * there may be many, they are always in the sheet, as are choices in groups or with a detail. With `href`, the choices
 * are on a page of their own (a field's page, Field.page), which it links to, the arrow pointing there, and no sheet. */
export function Select<T extends string>({
  id,
  title,
  value,
  options,
  empty,
  search,
  href,
  onChange,
  ...field
}: InField & {
  id?: string;
  title: string;
  value: T;
  options: ChoiceOption<T>[];
  empty?: string;
  search?: string;
  href?: string;
  onChange: (v: T) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const wide = useAtLeast('medium');
  const chosen = options.find((o) => o.value === value);
  if (wide && !href && !search && !options.some((o) => o.group || o.detail))
    return <ChoiceMenu id={id} title={title} value={value} options={options} empty={empty} onChange={onChange} {...field} />;
  if (href)
    return (
      <ChoiceField id={id} href={href} arrow={CaretRight} {...field}>
        <span lang={chosen?.lang} className={`min-w-0 flex-1 truncate ${chosen ? '' : 'opacity-60'}`}>
          {chosen ? chosen.label : empty}
        </span>
      </ChoiceField>
    );
  return (
    <>
      <ChoiceField
        id={id}
        {...field}
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          dialog.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'center' });
        }}
      >
        <span lang={chosen?.lang} className={`min-w-0 flex-1 truncate ${chosen ? '' : 'opacity-60'}`}>
          {chosen ? chosen.label : empty}
        </span>
      </ChoiceField>
      <ChoiceSheet dialog={dialog} title={title} value={value} options={options} search={search} onChange={onChange} />
    </>
  );
}

/** A row in a Group with its name and, at the right, what is chosen (muted, `empty` while nothing is), that opens a
 * sheet to choose in (`onClick`, with `children`: the sheet): ChoiceListItem, the pages of "Standardsider"
 * (PageListItem in PagePicker.tsx). `ref`: the row, for marking it (WrongField). */
export function PickListItem({
  title,
  chosen,
  lang,
  ref,
  onClick,
  children,
}: {
  title: string;
  chosen?: string;
  lang?: string;
  ref?: Ref<HTMLButtonElement>;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <ListItem
      ref={ref}
      onClick={onClick}
      aria-haspopup="dialog"
      headline={title}
      trailing={
        <span lang={lang} className="min-w-0 truncate text-muted">
          {chosen}
        </span>
      }
      arrow
    >
      {children}
    </ListItem>
  );
}

/** A row in a Group with its name and what is chosen (PickListItem), that opens a sheet with the choices
 * (ChoiceSheet), with a search over them when there may be many (`search`): the language. */
export function ChoiceListItem<T extends string>({
  title,
  value,
  options,
  search,
  onChange,
}: {
  title: string;
  value: T;
  options: ChoiceOption<T>[];
  search?: string;
  onChange: (v: T) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const chosen = options.find((o) => o.value === value);
  return (
    <PickListItem title={title} chosen={chosen?.label} lang={chosen?.lang} onClick={() => dialog.current?.showModal()}>
      <ChoiceSheet dialog={dialog} title={title} value={value} options={options} search={search} onChange={onChange} />
    </PickListItem>
  );
}

/** A new entry of more than one kind (a pop-up: Standard or Mailchimp): the "+" of a list's top bar,
 * which opens a sheet with the kinds, each with its icon, its name and what it is, as under "Indsæt";
 * a choice closes it and goes on with that kind. */
export function NewChoice<T extends string>({
  title,
  options,
  onChange,
}: {
  title: string;
  options: { value: T; label: string; hint?: string; icon?: Icon }[];
  onChange: (v: T) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return (
    <>
      <IconButton icon={Plus} label={title} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} />
      <BottomSheet ref={dialog} aria-label={title} onClick={(e) => e.target === dialog.current && close()}>
        <SheetTitle title={title} onClose={close} />
        <SheetList>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={optionClass()}
                onClick={() => {
                  close();
                  onChange(o.value);
                }}
              >
                <LeadingIcon icon={o.icon} />
                <span className="min-w-0">
                  <span className="block font-medium">{o.label}</span>
                  {o.hint && <span className="block text-sm text-muted">{o.hint}</span>}
                </span>
              </button>
            </li>
          ))}
        </SheetList>
      </BottomSheet>
    </>
  );
}

/** One action of a FAB menu: its icon, its name and what it does: a link (`href`) or a button (`onClick`). While `busy` its
 * action runs, and it is disabled as with `disabled`. */
export type FabAction = { icon: Icon; label: string; href?: string; onClick?: () => void; busy?: boolean; disabled?: boolean };

// An action's icon, drawn.
const iconOf = ({ icon: Item }: FabAction) => <Item />;

// What an action's element gets besides its icon and name: busy is disabled and aria-busy (a link has neither).
const fabProps = ({ href, onClick, busy, disabled }: FabAction) => ({
  href,
  onClick,
  ...(href === undefined ? { disabled: disabled || busy, 'aria-busy': busy || undefined } : {}),
});

/** The screen's main actions at the bottom right (.editor-fab, editor.css): the theme's FAB menu, opened and closed as
 * on the site (setUpFabMenu), or with one action that action as a FAB (its icon, its name as its tooltip and read by screen readers; a link, or a button); nothing without any. Drawn in a portal
 * on <body>, since the screen's entrance animation (a transform) would make its <main> the containing block of a fixed FAB. */
export function FabMenu({ icon: Glyph, label, items }: { icon: Icon; label: string; items: FabAction[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const menu = items.length > 1;
  useEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>('[data-fab-menu]');
    return root ? setUpFabMenu(root) : undefined;
  }, [menu]);
  if (items.length === 0) return null;
  return createPortal(
    <div ref={ref} className="editor-fab">
      {menu ? (
        <SiteFabMenu
          icon={<Glyph />}
          label={label}
          closeLabel={t.common.close}
          items={items.map((item) => ({ label: item.label, icon: iconOf(item), ...fabProps(item) }))}
        />
      ) : (
        <SiteFab icon={iconOf(items[0])} label={items[0].label} title={items[0].label} {...fabProps(items[0])} />
      )}
    </div>,
    document.body,
  );
}
