// The Keyboard shortcuts list (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md, section 5.4 and 7): every action the editor has
// registered that has a key, and the key that opens the search, each as a row with its name and its key, in the editor's sheet (a dialog in the middle on a
// computer). It is opened by the action *Keyboard shortcuts* of the palette. The keys are the registry's, written for this computer (shortcuts.ts).
import { useEffect, useMemo, useRef } from 'react';
import { actions } from './actions';
import { closeShortcuts, useShortcutsOpen } from './shortcutsOpen';
import { shortcutText } from './shortcuts';
import { t } from './i18n';
import { BottomSheet, ListItem, SheetList, SheetTitle } from './ui';

/** The key that opens the palette (CommandPalette.tsx KEY): it is not an action of its own. */
const SEARCH_KEY = 'Mod+K';

export function ShortcutsSheet() {
  const open = useShortcutsOpen();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) el.showModal();
    if (!open && el?.open) el.close();
  }, [open]);
  // Read when it opens: the actions registered then (the text's, and the block's that is active).
  const rows = useMemo(() => {
    if (!open) return [];
    const list = [{ id: 'search', label: t.palette.label, key: SEARCH_KEY }];
    for (const a of actions.all())
      if (a.shortcut && !list.some((r) => r.label === a.label && r.key === a.shortcut!.key))
        list.push({ id: a.id, label: a.label, key: a.shortcut.key });
    return list;
  }, [open]);

  return (
    <BottomSheet
      ref={dialog}
      aria-label={t.palette.shortcuts}
      onClose={closeShortcuts}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
    >
      <SheetTitle title={t.palette.shortcuts} onClose={() => dialog.current?.close()} />
      <SheetList>
        {rows.map((r) => (
          <ListItem
            key={r.id}
            headline={r.label}
            trailing={<kbd className="font-sans text-sm text-on-surface-variant">{shortcutText(r.key)}</kbd>}
          />
        ))}
      </SheetList>
    </BottomSheet>
  );
}
