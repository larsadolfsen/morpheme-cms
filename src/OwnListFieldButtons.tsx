// `Add field` and `Edit list` as two visible buttons (the owner's report of 14 November: "No way to add new fields to dynamic lists"). Shown under the items on a
// list's page (src/OwnList.tsx) and under the fields on an item's page (src/OwnListEntryTools.tsx), so the owner finds them from where they stand, not only in the
// list's overflow menu. `Add field` opens the menu of the six kinds; `Edit list` opens the sheet where a field is renamed, hidden or removed.
import { useRef, useState } from 'react';
import AddFieldMenu from './AddFieldMenu';
import { Button } from './ui';
import { t } from './i18n';

export default function OwnListFieldButtons({ onAdd, onEdit }: { onAdd: (kind: string) => void; onEdit: () => void }) {
  const [adding, setAdding] = useState(false);
  const at = useRef<HTMLSpanElement>(null);
  return (
    <div className="own-list-field-buttons mt-6 flex flex-wrap items-center gap-2" data-own-list-fields>
      <span ref={at} className="inline-block">
        <Button kind="outlined" aria-haspopup="menu" aria-expanded={adding} onClick={() => setAdding(!adding)}>
          {t.ownList.addField}
        </Button>
      </span>
      <Button kind="text" onClick={onEdit}>
        {t.ownList.edit}
      </Button>
      <AddFieldMenu anchor={adding ? at.current : null} onPick={onAdd} onClose={() => setAdding(false)} />
    </div>
  );
}
