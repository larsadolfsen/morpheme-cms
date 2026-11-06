// A list of links (Field.links: social media's profiles): each a row with its network's icon and name, known by its
// address (networkOf in site/social.mjs; for one not known its host and a globe), and the address under it; the arrows
// at its end move it up and down. A tap opens the bottom sheet where its address is changed or the link removed, and
// the FAB adds one in the same sheet. An address typed without https:// is given it; the same address twice is not
// let in. What is changed here is saved with the form (CompanyForm.tsx). Exposes LinkList (the list) and networkIcons
// (the icon of each network known, by its id). Uses the rows, the sheet and the FAB of ui.tsx and CreateFab.tsx, the
// arrows of MoveButtons.tsx, and the address logic of linkAddress.mjs.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FacebookLogo, Globe, LinkedinLogo, PinterestLogo, Trash, XLogo, type Icon } from '@phosphor-icons/react';
import { networkOf, type NetworkId } from '../site/social.mjs';
import { nameOf, problemOf, shownAddress, typedLink } from './linkAddress.mjs';
import { CreateFab } from './CreateFab';
import { MoveButtons } from './MoveButtons';
import { movedList } from './moveItem.mjs';
import type { Field } from './schema';
import { BottomSheet, Button, EmptyNote, Label, ListItem, listClass, SheetBody, SheetTitle, TextField } from './ui';
import { t } from './i18n';

/** The icon of each network known (NETWORKS in site/social.mjs), as the share buttons have them; any other link has the
 * globe. */
export const networkIcons: Record<NetworkId, Icon> = {
  facebook: FacebookLogo,
  x: XLogo,
  linkedin: LinkedinLogo,
  pinterest: PinterestLogo,
};

type Link = { url?: string } & Record<string, unknown>;

const iconOf = (url: string): Icon => {
  const network = networkOf(url);
  return network ? networkIcons[network.id] : Globe;
};
/** `hint`: what is under the list's name (hintOf in fields.tsx). `wrong`: the item whose address keeps the form from
 * being saved (WrongField), its number and when it was found, so its sheet opens again on the next try. */
export function LinkList({
  field,
  value,
  onChange,
  hint,
  wrong,
}: {
  field: Field;
  value: Link[];
  onChange: (v: Link[]) => void;
  hint?: ReactNode;
  wrong?: { index: number; at: number } | null;
}) {
  const address = field.fields?.find((f) => f.name === 'url');
  const dialog = useRef<HTMLDialogElement>(null);
  // The link open in the sheet: its place in the list (null: a new one) and its address as typed.
  const [editing, setEditing] = useState<{ index: number | null; typed: string } | null>(null);
  const [problem, setProblem] = useState('');
  const open = (index: number | null) => {
    setEditing({ index, typed: index === null ? '' : String(value[index]?.url ?? '') });
    setProblem('');
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();
  // A link that keeps the form from being saved is opened in the sheet, with what is wrong.
  useEffect(() => {
    if (!wrong || !value[wrong.index]) return;
    open(wrong.index);
    setProblem(problemWith(String(value[wrong.index].url ?? '')) ?? '');
  }, [wrong?.at]);

  // What is wrong with an address: none, not one, or one already in the list (but for the link itself).
  const problemWith = (url: string, index: number | null = null) =>
    problemOf(
      url,
      index,
      value.map((l) => l.url),
      { pattern: address?.pattern, noAddress: t.forms.links.noAddress, twice: t.forms.links.twice },
    );

  function done() {
    if (!editing) return;
    const url = typedLink(editing.typed);
    const wrongWith = problemWith(url, editing.index);
    if (wrongWith) return setProblem(wrongWith);
    if (editing.index === null) onChange([...value, { url }]);
    else onChange(value.map((l, i) => (i === editing.index ? { ...l, url } : l)));
    close();
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    close();
  };
  const move = (i: number, to: number) => onChange(movedList(value, i, to));

  const typed = editing ? typedLink(editing.typed) : '';
  const network = typed ? networkOf(typed) : null;
  return (
    <div>
      <Label hint={hint}>{field.label}</Label>
      <ul className={listClass}>
        {value.length ? (
          value.map((link, i) => {
            const url = String(link.url ?? '');
            return (
              <ListItem
                key={i}
                icon={iconOf(url)}
                headline={nameOf(url) || t.forms.empty}
                supporting={shownAddress(url)}
                truncate
                onClick={() => open(i)}
                actions={
                  value.length > 1 && (
                    <span className="flex shrink-0 pr-1.5">
                      <MoveButtons index={i} length={value.length} onMove={(to) => move(i, to)} />
                    </span>
                  )
                }
              />
            );
          })
        ) : (
          <EmptyNote item>{t.forms.links.none}</EmptyNote>
        )}
      </ul>
      <BottomSheet
        ref={dialog}
        onClose={(e) => e.target === e.currentTarget && setEditing(null)}
        onClick={(e) => e.target === dialog.current && close()}
      >
        <SheetTitle title={editing?.index == null ? t.forms.links.add : nameOf(String(value[editing.index]?.url ?? ''))} onClose={close} />
        {editing && (
          <SheetBody
            onSubmit={(e) => {
              e.preventDefault();
              done();
            }}
          >
            <div>
              <TextField
                id="link-url"
                label={address?.label ?? t.forms.links.address}
                hint={network ? t.forms.links.found(network.name) : t.forms.links.hint}
                problem={problem || undefined}
                value={editing.typed}
                inputMode="url"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => {
                  setEditing({ ...editing, typed: e.target.value });
                  setProblem('');
                }}
              />
            </div>
            <Button type="submit">{editing.index === null ? t.forms.links.addButton : t.forms.links.done}</Button>
            {editing.index !== null && (
              <Button kind="outlined" icon={Trash} onClick={() => remove(editing.index!)}>
                {t.forms.links.remove}
              </Button>
            )}
          </SheetBody>
        )}
      </BottomSheet>
      <CreateFab label={t.forms.links.add} onClick={() => open(null)} />
    </div>
  );
}
