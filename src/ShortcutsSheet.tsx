// The Keyboard shortcuts list (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md, section 5.4 and 7): the key that opens the search and
// every registered action that has a key, each as a row with its name and its key, written for this computer (shortcuts.ts). The action *Keyboard shortcuts* of
// the palette shows it: in the editor's sheet (a dialog in the middle) on a computer, and as a page with a back arrow on a phone (owner, 15 Nov: pages, not
// overlays, on a phone). Exposes shortcutRows, showShortcuts, ShortcutsSheet, ShortcutsPage.
import { useEffect, useRef } from 'react';
import { siteName } from '@site/editor';
import { actions } from './actions';
import Screen from './Screen';
import { closeShortcuts, openShortcuts, setShortcutRows, useShortcutRows, useShortcutsOpen, type ShortcutRow } from './shortcutsOpen';
import { shortcutText } from './shortcuts';
import { t } from './i18n';
import { BottomSheet, ListItem, SheetList, SheetTitle } from './ui';

/** The key that opens the palette (CommandPalette.tsx KEY): it is not an action of its own. */
const SEARCH_KEY = 'Mod+K';

/** The search's key and the key of every action registered now, once for a name and key. */
export function shortcutRows(): ShortcutRow[] {
  const list: ShortcutRow[] = [{ id: 'search', label: t.palette.label, key: SEARCH_KEY }];
  for (const a of actions.all())
    if (a.shortcut && !list.some((r) => r.label === a.label && r.key === a.shortcut!.key))
      list.push({ id: a.id, label: a.label, key: a.shortcut.key });
  return list;
}

/** Shows the list: a page on a phone (below the medium width, 37.5rem), the dialog from medium. */
export function showShortcuts() {
  setShortcutRows(shortcutRows());
  if (matchMedia('(width < 37.5rem)').matches) location.hash = '#shortcuts';
  else openShortcuts();
}

const Rows = ({ rows }: { rows: ShortcutRow[] }) =>
  rows.map((r) => (
    <ListItem key={r.id} headline={r.label} trailing={<kbd className="mo-editor-shortcut-key">{shortcutText(r.key)}</kbd>} />
  ));

/** The dialog of a computer. */
export function ShortcutsSheet() {
  const open = useShortcutsOpen();
  const rows = useShortcutRows();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) {
      el.showModal();
      // No control has the focus at the start (not the close button): the dialog itself does, without a ring; Tab reaches the buttons.
      el.focus({ preventScroll: true });
    }
    if (!open && el?.open) el.close();
  }, [open]);
  return (
    <BottomSheet
      ref={dialog}
      aria-label={t.palette.shortcuts}
      className="mo-editor-shortcuts-dialog"
      tabIndex={-1}
      onClose={closeShortcuts}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
    >
      <SheetTitle title={t.palette.shortcuts} onClose={() => dialog.current?.close()} />
      <SheetList>
        <Rows rows={rows} />
      </SheetList>
    </BottomSheet>
  );
}

/** The page of a phone (#shortcuts), with its back arrow to the start screen. */
export function ShortcutsPage() {
  const rows = useShortcutRows();
  return (
    <Screen title={t.palette.shortcuts} back={{ href: '#', label: siteName }}>
      <ul>
        <Rows rows={rows.length ? rows : shortcutRows()} />
      </ul>
    </Screen>
  );
}
