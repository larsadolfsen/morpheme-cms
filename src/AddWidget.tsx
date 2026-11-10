// "Add widget" in the start screen's edit mode (DashboardGrid.tsx): the widgets there are to place, in the editor's sheet
// (BottomSheet). The CMS's widgets come first, then a group per app; a group's name is its title when there is more than one
// group. Each widget is a row with its icon, its name (headline) and its hint (supporting text). A tap on a row calls onPick
// with the widget's full id and closes the sheet; the same widget may be added again. `open` shows the sheet (showModal);
// onClose tells the parent that it closed, however (Esc, the cross, a tap outside).
import { useEffect, useRef } from 'react';
import { siteText, t } from './i18n';
import type { WidgetGroup } from './widgets';
import { BottomSheet, ListItem, SheetGroupTitle, SheetList, SheetTitle } from './ui';

export function AddWidget({
  open,
  groups,
  onPick,
  onClose,
}: {
  open: boolean;
  groups: WidgetGroup[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) el.showModal();
    if (!open && el?.open) el.close();
  }, [open]);

  return (
    <BottomSheet
      ref={dialog}
      aria-label={t.dashboard.addWidget}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
    >
      <SheetTitle title={t.dashboard.addWidget} onClose={() => dialog.current?.close()} />
      <SheetList div>
        {groups.map((group) => (
          <section key={group.source} className="mt-2">
            {groups.length > 1 && <SheetGroupTitle>{group.label}</SheetGroupTitle>}
            <ul>
              {group.items.map(({ id, definition }) => (
                <ListItem
                  key={id}
                  icon={definition.icon}
                  headline={group.source === 'cms' ? definition.label : siteText(definition.label)}
                  supporting={group.source === 'cms' ? definition.hint : siteText(definition.hint)}
                  onClick={() => {
                    dialog.current?.close();
                    onPick(id);
                  }}
                />
              ))}
            </ul>
          </section>
        ))}
      </SheetList>
    </BottomSheet>
  );
}
