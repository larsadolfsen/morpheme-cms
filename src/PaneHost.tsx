// The editor's one pane: the theme's standard side sheet (SiteSideSheet, kind 'standard') beside the page from medium (600 dp), where what
// is shown is fed in (owner, 15 Nov 2026: settings are a pane, not a dialog; docs/superpowers/specs/2026-11-15-section-settings-pane.md).
// This is editor state only: the markup and the look are the theme's side sheet and `.mo-editor-side-sheet` (editor.css), as BlockDialog's own
// slot had them. <PaneHost /> in App.tsx is the place (an empty slot). A screen feeds its content with usePane(entry) on each render (entry
// null: nothing) and puts the returned `portal` in what it renders: the content is drawn into the slot with a portal, so it stays in the screen's own React
// context (the form's fields, for one). The pane fed last is shown (one opened from inside another is on top of it; when it goes, the first
// shows again). While one is open the root has [data-side-panel] (the page makes room for it) and setPanelOpen(true) (sidePanel.ts). The
// theme's standardSideSheet() opens it (the pane itself has the focus, no control shows a ring) and asks `beforeClose` before the close button
// or Escape closes it. Exposes PaneHost, usePane, type PaneEntry.
import { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SiteSideSheet, siteStandardSideSheet } from './themeUi';
import { setPanelOpen } from './sidePanel';
import { t } from './i18n';

export type PaneEntry = {
  headline: string;
  /** The id of the headline, which names the pane (aria-labelledby). */
  headlineId: string;
  /** Buttons at the bottom, none when the pane changes what it shows at once. */
  actions?: ReactNode;
  children: ReactNode;
  /** Asked before the close button or Escape closes the pane; false keeps it open. */
  beforeClose?: () => boolean | Promise<boolean>;
  /** What had the focus before, which has it back when the pane closes. */
  opener?: HTMLElement | null;
  /** The cursor stays where it is when the pane opens (the settings of a row beside the row being typed in). */
  keepFocus?: boolean;
  /** The focus leaves the pane. */
  onBlur?: () => void;
  /** A back icon button before the headline, for a pane opened from inside another: it shows the other again (the theme's SideSheet
   * `onBack`); `backLabel` names it. */
  onBack?: () => void;
  backLabel?: string;
};

// The slot, the ids of the panes that are open (the last is on top) and how to close each: outside React, so every screen sees the same.
let slot: HTMLElement | null = null;
let open: string[] = [];
const closers = new Map<string, () => Promise<void>>();
const listeners = new Set<() => void>();
let version = 0;
const publish = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (changed: () => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};
const snapshot = () => version;

function add(id: string) {
  if (open.includes(id)) return;
  open = [...open, id];
  publish();
}
function drop(id: string) {
  if (!open.includes(id)) return;
  open = open.filter((o) => o !== id);
  closers.delete(id);
  publish();
}

/** Feeds the pane (entry) or takes it away (null). Call it on every render with what is to be shown now, and put the returned `portal` in what the
 * component renders. close() hides the pane (the focus goes back to its opener); the caller then stops feeding it. A pane on top of another
 * (opened from inside it) shows its `onBack`, as a back icon button. */
export function usePane(entry: PaneEntry | null) {
  const id = useId();
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const has = !!entry;
  useLayoutEffect(() => {
    if (has) add(id);
    else drop(id);
  }, [has, id]);
  useLayoutEffect(() => () => drop(id), [id]);
  const portal =
    entry && slot
      ? createPortal(<Pane id={id} entry={entry} top={open.at(-1) === id} nested={open.length > 1 && open.at(-1) === id} />, slot)
      : null;
  return { portal, close: () => closers.get(id)?.() ?? Promise.resolve() };
}

function Pane({ id, entry, top, nested }: { id: string; entry: PaneEntry; top: boolean; nested: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(entry);
  latest.current = entry;
  const controls = useRef<ReturnType<typeof siteStandardSideSheet> | null>(null);
  // The theme's controls, made once for this pane.
  useEffect(() => {
    const sheet = box.current?.querySelector<HTMLElement>('[data-side-sheet-container]');
    if (!sheet) return;
    const made = siteStandardSideSheet(sheet, { beforeClose: () => latest.current.beforeClose?.() ?? true });
    controls.current = made;
    closers.set(id, made.close);
    return () => {
      controls.current = null;
      closers.delete(id);
    };
  }, [id]);
  // It opens (and has the focus) once it is the one shown: not before, as a pane that is not shown cannot take the focus. One shown again
  // (the pane opened from inside it has gone) takes the focus back.
  const shownBefore = useRef(false);
  useEffect(() => {
    if (!top || !controls.current) return;
    if (shownBefore.current) {
      box.current?.querySelector<HTMLElement>('[data-side-sheet-container]')?.focus({ preventScroll: true });
      return;
    }
    shownBefore.current = true;
    // The settings of a row are beside the row being typed in: the cursor stays where it is.
    const typing = latest.current.keepFocus ? document.activeElement : null;
    controls.current.open(latest.current.opener ?? undefined);
    if (typing instanceof HTMLElement && typing !== document.body) typing.focus({ preventScroll: true });
  }, [top]);
  return (
    <div
      ref={box}
      className={top ? 'mo-contents' : 'mo-hidden'}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && latest.current.onBlur?.()}
    >
      <SiteSideSheet
        headline={entry.headline}
        headlineId={entry.headlineId}
        closeLabel={t.common.close}
        className="mo-editor-side-sheet"
        onBack={nested ? entry.onBack : undefined}
        backLabel={entry.backLabel}
        actions={entry.actions}
      >
        {entry.children}
      </SiteSideSheet>
    </div>
  );
}

// Known to the screens as soon as it is in the page: they draw into it from the next render. A stable function, so React does not take the
// slot away and give it back on every render.
function place(el: HTMLElement | null) {
  if (el === slot) return;
  slot = el;
  queueMicrotask(publish);
}

export default function PaneHost() {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const shown = open.length > 0;
  useEffect(() => {
    if (!shown) return;
    document.documentElement.setAttribute('data-side-panel', '');
    setPanelOpen(true);
    return () => {
      document.documentElement.removeAttribute('data-side-panel');
      setPanelOpen(false);
    };
  }, [shown]);
  return <div ref={place} className="mo-contents" />;
}
