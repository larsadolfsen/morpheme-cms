// The text bar of an editor: the row of tools with the context's tools on the left (Bold, Italic ... for text, the block's tools for a block), the
// main tools on the right (Preview, Undo, Redo, Insert) and the `⋮` with what does not fit (textBar.mjs `planBar`), the menus the tools open (Text
// style, List, Alignment, Color and the `⋮`'s own with its next level), and the bar's motion (barMotion.mjs). Moved out of MarkdownEditor.tsx without a
// change of what it draws or does, so another editor (the list editor window) can draw the same bar with its own tools.
//
// What the host gives it (EditorBarProps): which tools stand where (`context`, `fixed`, `spare` ids and the `contextKey` that says the context changed), what a tool
// is and does (`tool(id)`; Insert is the tool 'insert', so the host decides its label, icon and what its action opens: the page editor opens the block
// picker or the Library, the list editor will open the field kinds), the menu rows of the ⋮ (`menu`, `groups`, `settings`, `viewOnSite`) and the
// state of the text where the cursor is (`active` ... `noColor`) with the three things the menus change (`setKind`, `setAlign`, `setColor`).
// The bar keeps the state of its own menus and its width. It draws a fragment: the Toolbar and its menus, which the host puts above its text.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ListBullets, Palette, TextAlignCenter, TextAlignLeft, TextAlignRight, TextT, type TextB } from '@phosphor-icons/react';
import { TEXT_COLORS, colorClass } from '../lib/text-colors.mjs';
import { motionReduced, motionTiming } from '../lib/motion';
import { barSlideKind } from './barMotion.mjs';
import type { CardRow } from './blockBar';
import { changeToIcon } from './blockHandleIcon';
import { CloseIcon, MoreVertIcon, ViewOnSiteIcon } from './icon';
import { t } from './i18n';
import { styleRows } from './styleMenu.mjs';
import { planBar, toolWidth } from './textBar.mjs';
import { Menu, MenuDivider, MenuItem, Toolbar, ToolbarButton } from './ui';

/** An icon given as raw SVG (the block's tools, contextualMenu.ts), as the component a bar button wants: drawn at 20 dp, once per SVG. */
const rawIcons = new Map<string, typeof TextB>();
export function rawIcon(svg: string): typeof TextB {
  let icon = rawIcons.get(svg);
  if (!icon) {
    const html = svg.replace('<svg', '<svg width="20" height="20" fill="currentColor" aria-hidden="true"');
    icon = (() => (
      <span aria-hidden="true" className="inline-flex" dangerouslySetInnerHTML={{ __html: html }} />
    )) as unknown as typeof TextB;
    rawIcons.set(svg, icon);
  }
  return icon;
}

// The icon of a button when its style is not on: the general text (T) and list icons.
const GENERIC_ICONS = {
  text: { node: TextT },
  list: { node: ListBullets },
};

// The alignments of a paragraph or a smaller heading (lib/text-align.mjs), each with its icon and name; left is the text's own.
export const ALIGN_FACES = {
  left: { node: TextAlignLeft },
  center: { node: TextAlignCenter },
  right: { node: TextAlignRight },
};
export type Align = keyof typeof ALIGN_FACES;
export const alignLabel = (align: Align) => ({ left: t.text.alignLeft, center: t.text.alignCenter, right: t.text.alignRight })[align];
/** The keys of the bar's tools that have one: the text engine's own (the same as in textActions.ts), shown in their tooltips. */
const TOOL_KEYS: Record<string, string | undefined> = { bold: 'Mod+B', italic: 'Mod+I', undo: 'Mod+Z', redo: 'Mod+Shift+Z' };

/** Which menu a bar button opens: Text style or List. */
export type KindGroup = 'style' | 'list';
/** A face of a text style or a list kind: its name and icon. */
export type BarFace = { label: string; icon: typeof TextB };
/** What a tool is and does: the bar draws it as a button, the `⋮` menu as a row. */
export type BarTool = {
  label: string;
  icon?: typeof TextB;
  text?: boolean;
  action: () => void;
  on?: string;
  pressed?: boolean;
  disabled?: boolean;
  reason?: string;
};
/** Related tools bundled into one row of the `⋮` that opens them as its next level (the Table's add, delete and align rows). `icon` is raw SVG. */
export type BarGroup = { key: string; label: string; icon: string; ids: string[]; short?: Record<string, string> };

export type EditorBarProps = {
  /** The context group's name for assistive technology: the block's name, or "Text tools". */
  name: string;
  /** Changes when the context changes (text, a block, a selection of blocks): the bar then slides or fades. '' when there is none. */
  contextKey: string;
  /** The ids of the context's tools, the main tools that always stand on the bar, and the ones that give way first (Preview). Block tools are 'block:<kind>'. */
  context: string[];
  fixed: string[];
  spare: string[];
  /** The width of the tools drawn as text, by id (textBar.mjs). */
  widths: Record<string, number>;
  /** What the tool with this id is and does. */
  tool: (id: string) => BarTool;
  /** A selection of blocks: the count with its cross, the tool 'block:count'. */
  count?: { label: string; n: number; action: () => void };
  /** The active block's own rows of the `⋮` and the groups of its tools. */
  menu: CardRow[];
  groups: BarGroup[];
  /** Section settings stands in the `⋮`. */
  settings: boolean;
  /** The address `View on site` in the `⋮` opens. */
  viewOnSite?: string;
  /** What applies where the cursor is (activeOf), marked on the buttons and rows. */
  active: string[];
  /** The heading levels the Text style menu offers. */
  levels: number[];
  /** The Text style button's face and label, the faces of the styles and lists, the row icon of a style, the lists the List menu offers and the one on now. */
  styleFace: BarFace;
  styleLabel: string;
  STYLE_FACES: Record<string, BarFace>;
  LIST_FACES: Record<string, BarFace>;
  rowIcon: (row: string) => typeof TextB;
  lists: string[];
  listFace?: BarFace;
  /** The alignment where the cursor is, and whether it can change; whether the Color tool is off. */
  alignNow: Align;
  alignOn: boolean;
  noColor: boolean;
  /** What the menus change. */
  setKind: (kind: string) => void;
  setAlign: (align: Align) => void;
  setColor: (name: string | null) => void;
};

export function EditorBar({
  name,
  contextKey,
  context,
  fixed,
  spare,
  widths,
  tool: toolOf,
  count,
  menu,
  groups,
  settings,
  viewOnSite,
  active,
  levels: headingLevels,
  styleFace,
  styleLabel,
  STYLE_FACES,
  LIST_FACES,
  rowIcon,
  lists,
  listFace,
  alignNow,
  alignOn,
  noColor,
  setKind,
  setAlign,
  setColor: color,
}: EditorBarProps) {
  const toolbar = useRef<HTMLDivElement>(null);
  // The button that opened a menu with the kinds of text (Text style, List), while it is open.
  const [kindsAt, setKindsAt] = useState<{ at: HTMLElement; group: KindGroup } | null>(null);
  // The `⋮` button, and the menu under it while it is open; the Alignment and Color menus of its rows open under it too.
  const moreButton = useRef<HTMLButtonElement>(null);
  const [moreAt, setMoreAt] = useState<HTMLElement | null>(null);
  // The ⋮ menu's next level (a row's submenu: Change type), shown in place of its rows with a back row; null: its own rows.
  const [moreLevel, setMoreLevel] = useState<CardRow | null>(null);
  useEffect(() => void (!moreAt && setMoreLevel(null)), [moreAt]);
  // The first row of the level that was opened or gone back to has the focus, so the keyboard goes on from there.
  const levelShown = useRef(false);
  useEffect(() => {
    if (!levelShown.current && !moreLevel) return;
    levelShown.current = !!moreLevel;
    document.querySelector<HTMLElement>('.editor-menu [role^="menuitem"]')?.focus({ preventScroll: true });
  }, [moreLevel]);
  const [colorAt, setColorAt] = useState<HTMLElement | null>(null);
  // The bar's width, in dp, measured with a ResizeObserver (never a timer): how many tools fit (textBar.mjs).
  const [barWidth, setBarWidth] = useState(0);
  // The alignment button that opened its menu, while it is open.
  const [alignAt, setAlignAt] = useState<HTMLElement | null>(null);
  useEffect(() => {
    alignAt?.setAttribute('aria-expanded', 'true');
    return () => alignAt?.setAttribute('aria-expanded', 'false');
  }, [alignAt]);
  useLayoutEffect(() => {
    const bar = toolbar.current!;
    const measure = () => setBarWidth(bar.clientWidth);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(bar);
    return () => watch.disconnect();
  }, []);
  // A menu of one of the ⋮ menu's rows is open under the ⋮ button.
  const underMore = [kindsAt?.at, alignAt, colorAt].some((at) => !!at && at === moreButton.current);
  const plan = planBar({
    // The count with its cross is two buttons wide (TOOL_WIDTH in textBar.mjs).
    width: barWidth,
    context,
    fixed,
    spare,
    more: menu.length > 0 || settings || !!viewOnSite,
    widths,
  });
  // The bar's motion (barMotion.mjs): the contextual tools slide in from the left and push the main tools right when a context starts, slide out
  // when it ends, and fade in place from one context to another. FLIP: the new layout is measured, then the old place is animated from, with the
  // theme's springs only (motionTiming) and none at all for a visitor who asked for reduced motion. The bar's height and the dividers never move.
  const slideRow = useRef<HTMLDivElement>(null);
  const contextBox = useRef<HTMLDivElement>(null);
  const mainBox = useRef<HTMLDivElement>(null);
  const slid = useRef<{ key: string; mainLeft: number; ghost: HTMLElement | null } | null>(null);
  useLayoutEffect(() => {
    const row = slideRow.current;
    const main = mainBox.current;
    if (!row || !main) return;
    const context = contextBox.current;
    const mainLeft = main.offsetLeft;
    const was = slid.current;
    const kind = was ? barSlideKind(was.key, contextKey) : 'none';
    if (was && kind !== 'none' && !motionReduced()) {
      const spatial = motionTiming('spatial', 'fast');
      // A slide that is not over is reversed from where it is: its place now counts, not its end.
      const visibleShift = new DOMMatrixReadOnly(getComputedStyle(main).transform).m41;
      for (const running of main.getAnimations()) running.cancel();
      const pushed = mainLeft - was.mainLeft;
      if (pushed || visibleShift) main.animate([{ transform: `translateX(${visibleShift - pushed}px)` }, { transform: 'none' }], spatial);
      if (kind === 'enter' && context) {
        context.animate([{ transform: `translateX(${-context.offsetWidth}px)` }, { transform: 'none' }], spatial);
      }
      if (kind === 'leave' && was.ghost) {
        const ghost = row.appendChild(was.ghost);
        const gone = () => ghost.remove();
        ghost.animate([{ transform: 'none' }, { transform: `translateX(${-ghost.offsetWidth}px)` }], spatial).finished.then(gone, gone);
      }
      // From one context to another the bars cross-fade: the tools that left (the ghost, out of the row's flow, so nothing below or beside moves)
      // fade out as the new tools fade in, with the theme's effects spring.
      if (kind === 'change') {
        const effects = motionTiming('effects');
        if (context) context.animate([{ opacity: 0 }, { opacity: 1 }], effects);
        if (was.ghost) {
          const ghost = row.appendChild(was.ghost);
          const gone = () => ghost.remove();
          ghost.animate([{ opacity: 1 }, { opacity: 0 }], effects).finished.then(gone, gone);
        }
      }
    }
    // What the contextual tools looked like, to slide them out once the context ends (a copy: they are gone by then).
    let ghost: HTMLElement | null = null;
    if (context) {
      ghost = context.cloneNode(true) as HTMLElement;
      ghost.classList.add('editor-tools-ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('inert', '');
    }
    slid.current = { key: contextKey, mainLeft, ghost };
  });
  const menuOf = (id: string) => ({ style: 'style', list: 'list' })[id] as KindGroup | undefined;
  // A button of the bar. Text style, List, Alignment and Color open a menu under them; the others act.
  const barButton = (id: string) => {
    if (id === 'style' || id === 'list') {
      const group = menuOf(id)!;
      const opened = kindsAt?.group === group;
      const [icon, label] =
        group === 'style'
          ? [styleFace.icon, styleLabel]
          : [listFace?.icon ?? GENERIC_ICONS.list.node, listFace ? t.text.listIs(listFace.label) : t.text.list];
      return (
        <ToolbarButton
          key={id}
          icon={icon}
          label={label}
          menu={opened}
          onClick={(e) => setKindsAt(opened ? null : { at: e.currentTarget, group })}
        />
      );
    }
    if (id === 'align')
      return (
        <ToolbarButton
          key={id}
          icon={ALIGN_FACES[alignNow].node}
          label={t.text.alignmentIs(alignLabel(alignNow))}
          menu={!!alignAt && alignAt.closest('.editor-tools') !== null && alignAt !== moreButton.current}
          disabled={!alignOn}
          onClick={(e) => setAlignAt(alignAt === e.currentTarget ? null : e.currentTarget)}
        />
      );
    if (id === 'color')
      return (
        <ToolbarButton
          key={id}
          icon={Palette}
          label={t.text.color}
          menu={!!colorAt && colorAt !== moreButton.current}
          disabled={noColor}
          onClick={(e) => setColorAt(colorAt === e.currentTarget ? null : e.currentTarget)}
        />
      );
    if (id === 'block:count' && count)
      return <ToolbarButton key={id} icon={CloseIcon} label={count.label} count={count.n} onClick={count.action} />;
    const { label, icon, text, action, on, pressed, disabled, reason } = toolOf(id);
    return (
      <ToolbarButton
        key={id}
        icon={icon}
        label={label}
        text={text ? { width: toolWidth(id, widths) } : undefined}
        selected={on ? active.includes(on) : pressed}
        disabled={disabled}
        reason={reason}
        shortcutKey={TOOL_KEYS[id]}
        onClick={action}
      />
    );
  };
  // A row of the `⋮` menu. Text style, Alignment and Color open their own menu, under the `⋮` button.
  const moreRows = (id: string) => {
    const under = (open: () => void) => () => {
      open();
    };
    if (id === 'style')
      return (
        <MenuItem key={id} icon={styleFace.icon} onClick={under(() => setKindsAt({ at: moreButton.current!, group: 'style' }))}>
          {styleLabel}
        </MenuItem>
      );
    if (id === 'list')
      return lists.map((kind) => (
        <MenuItem key={kind} icon={LIST_FACES[kind].icon} selected={active.includes(kind)} onClick={() => setKind(kind)}>
          {LIST_FACES[kind].label}
        </MenuItem>
      ));
    if (id === 'align')
      return (
        <MenuItem key={id} icon={ALIGN_FACES[alignNow].node} disabled={!alignOn} onClick={under(() => setAlignAt(moreButton.current))}>
          {alignLabel(alignNow)}
        </MenuItem>
      );
    if (id === 'color')
      return (
        <MenuItem key={id} icon={Palette} disabled={noColor} onClick={under(() => setColorAt(moreButton.current))}>
          {t.text.color}
        </MenuItem>
      );
    const { label, icon, action, on, pressed, disabled } = toolOf(id);
    return (
      <MenuItem key={id} icon={icon} selected={on ? active.includes(on) : pressed} disabled={disabled} onClick={action}>
        {label}
      </MenuItem>
    );
  };
  // In the `⋮` menu the context's tools come first, then a divider, then the main tools.
  const MORE_ORDER = ['bold', 'italic', 'style', 'list', 'align', 'link', 'color'];
  const moreContext = [...plan.more.context].sort((a, b) => MORE_ORDER.indexOf(a) - MORE_ORDER.indexOf(b));
  // Preview comes after Section settings.
  const moreMain = [
    ...plan.more.fixed.filter((id) => id !== 'preview'),
    ...(settings ? ['settings'] : []),
    ...plan.more.fixed.filter((id) => id === 'preview'),
  ];
  // Related tools of a Table are bundled into one row that opens them as the menu's next level (Material 3, Menus: "Use groups to bundle similar
  // actions together", and on web "menus can open submenus"). A group with a single tool in the menu stays a plain row, so every tool stays reachable.
  const groupedRows = (ids: string[]) => {
    const seen = new Set<string>();
    return ids.flatMap((id) => {
      const g = groups.find((x) => x.ids.includes(id));
      const members = g ? g.ids.filter((i) => ids.includes(i)) : [];
      if (!g || members.length < 2) return [moreRows(id)];
      if (seen.has(g.key)) return [];
      seen.add(g.key);
      const level: CardRow = {
        icon: g.icon,
        label: g.label,
        action: () => {},
        submenu: members.map((i) => {
          const tool = toolOf(i);
          // Under "Align column" a row says only the side (the group already names the column); the others keep their names.
          const short = g.short ?? {};
          return { icon: tool.icon ?? rawIcon(''), label: short[i] ?? tool.label, selected: tool.pressed, action: tool.action };
        }),
      };
      return [
        <MenuItem key={g.key} icon={rawIcon(g.icon)} opens onClick={() => setMoreLevel(level)}>
          {g.label}
        </MenuItem>,
      ];
    });
  };
  const toolRows = menu.filter((row) => row.with === 'tools');
  const ownRows = menu.filter((row) => row.with !== 'tools');
  // The ⋮ menu's groups, each after a divider: the context's tools, the main tools, the block's own menu, then View on site.
  const moreGroups = moreContext.length + moreMain.length + menu.length;
  return (
    <>
      {/* The top edge of the text's box: it draws its own border and rounded corners, so the box's side lines start under it and never run past it when it sticks; no shadow. Stays at the top of the screen while scrolling through the text (under the safe area, as the top bar scrolls away). One row, 44 dp high: the text tools, a divider and the main tools; the `⋮` at its end has what does not fit (textBar.mjs). */}
      <Toolbar
        ref={toolbar}
        label={t.text.tools}
        className="editor-tools sticky top-[env(safe-area-inset-top)] z-10 rounded-t-panel border border-outline-variant pb-(--toolbar-docked-padding-block)"
      >
        <div ref={slideRow} className="editor-tools-slide">
          {plan.bar.context.length > 0 && (
            <div ref={contextBox} className="editor-tools-context">
              <div role="group" aria-label={name} className="editor-tools-group">
                {plan.bar.context.map(barButton)}
              </div>
            </div>
          )}
          <div ref={mainBox} className="editor-tools-main">
            <div role="group" aria-label={t.text.pageTools} className="editor-tools-group">
              {plan.bar.fixed.map(barButton)}
            </div>
            {plan.overflow && (
              <ToolbarButton
                ref={moreButton}
                icon={MoreVertIcon}
                label={t.text.more}
                popup={!!moreAt || underMore}
                onClick={(e) => {
                  // A tap on the ⋮ while one of its rows' menus (Text style, Alignment, Color) is open closes that menu and does not open the ⋮
                  // menu behind it; else it opens or closes the ⋮ menu, with none of the others open.
                  if (underMore) {
                    setKindsAt(null);
                    setAlignAt(null);
                    setColorAt(null);
                    return setMoreAt(null);
                  }
                  setKindsAt(null);
                  setAlignAt(null);
                  setColorAt(null);
                  setMoreAt(moreAt ? null : e.currentTarget);
                }}
              />
            )}
          </div>
        </div>
      </Toolbar>
      <Menu
        popup="end"
        anchor={moreAt}
        label={moreLevel?.label ?? t.text.more}
        onBack={moreLevel ? () => setMoreLevel(null) : undefined}
        onClose={() => setMoreAt(null)}
      >
        {moreLevel ? (
          <>
            {/* The next level: back to the menu's rows (Left arrow too), then the submenu's rows. */}
            <MenuItem icon={rawIcon(changeToIcon)} back label={t.text.backToMenu(moreLevel.label)} onClick={() => setMoreLevel(null)}>
              {moreLevel.label}
            </MenuItem>
            <MenuDivider />
            {moreLevel.submenu!.map((sub) => (
              <MenuItem
                key={sub.label}
                icon={sub.icon}
                selected={sub.selected}
                onKeyDown={(e) => e.key === 'ArrowLeft' && (e.preventDefault(), setMoreLevel(null))}
                onClick={sub.action}
              >
                {sub.label}
              </MenuItem>
            ))}
          </>
        ) : (
          <>
            {groupedRows(moreContext)}
            {toolRows.map((row) => (
              <MenuItem key={row.label} icon={rawIcon(row.icon)} opens onClick={() => setMoreLevel(row)}>
                {row.label}
              </MenuItem>
            ))}
            {(moreContext.length > 0 || toolRows.length > 0) && moreMain.length > 0 && <MenuDivider />}
            {groupedRows(moreMain)}
            {ownRows.length > 0 && (moreContext.length > 0 || moreMain.length > 0 || toolRows.length > 0) && <MenuDivider />}
            {ownRows.map((row) => (
              <MenuItem
                key={row.label}
                icon={rawIcon(row.icon)}
                opens={!!row.submenu}
                onClick={() => (row.submenu ? setMoreLevel(row) : row.action(false))}
              >
                {row.label}
              </MenuItem>
            ))}
            {viewOnSite && moreGroups > 0 && <MenuDivider />}
            {viewOnSite && (
              <MenuItem icon={ViewOnSiteIcon} onClick={() => void window.open(viewOnSite, '_blank', 'noopener')}>
                {t.app.viewOnSite}
              </MenuItem>
            )}
          </>
        )}
      </Menu>
      <Menu popup="start" anchor={alignAt} label={t.text.alignment} onClose={() => setAlignAt(null)}>
        {(Object.keys(ALIGN_FACES) as Align[]).map((align) => (
          <MenuItem
            key={align}
            icon={ALIGN_FACES[align].node}
            selected={alignNow === align}
            onClick={() => {
              setAlignAt(null);
              setAlign(align);
            }}
          >
            {alignLabel(align)}
          </MenuItem>
        ))}
      </Menu>
      {/* The site's colours (text-colors.mjs), each named in its colour, as it is in the text (its class), and "No color" in the text's own, last. */}
      <Menu popup="start" anchor={colorAt} label={t.text.color} onClose={() => setColorAt(null)}>
        {TEXT_COLORS.map((name) => (
          <MenuItem key={name} selected={active.includes(colorClass(name))} onClick={() => color(name)}>
            <span className={colorClass(name)}>{t.text.colors[name as keyof typeof t.text.colors]}</span>
          </MenuItem>
        ))}
        <MenuItem selected={!active.includes('textColor')} onClick={() => color(null)}>
          <span className="text-on-surface">{t.text.noColor}</span>
        </MenuItem>
      </Menu>
      {/* Text style: the heading levels the text may have, a divider, then the body sizes, Label and Quote; the rows that do not apply (a heading in a list item, a list or Quote in a heading) are hidden (styleMenu.mjs). */}
      <Menu
        popup="start"
        anchor={kindsAt?.at ?? null}
        label={kindsAt?.group === 'list' ? t.text.list : t.text.kind}
        onClose={() => setKindsAt(null)}
      >
        {kindsAt?.group === 'style' &&
          styleRows(active, headingLevels).map((row, i) =>
            row === '-' ? (
              <MenuDivider key={`-${i}`} />
            ) : (
              <MenuItem key={row} icon={rowIcon(row)} selected={active.includes(row)} onClick={() => setKind(row)}>
                {STYLE_FACES[row].label}
              </MenuItem>
            ),
          )}
        {kindsAt?.group === 'list' &&
          lists.map((kind) => (
            <MenuItem key={kind} icon={LIST_FACES[kind].icon} selected={active.includes(kind)} onClick={() => setKind(kind)}>
              {LIST_FACES[kind].label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}
