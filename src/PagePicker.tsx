// A field that picks a page to link to: it shows the page, and opens a list of the pages with a search,
// as a sheet from the bottom on a phone and a dialog on a computer. The pages come in groups (the
// fixed pages and the other pages, for the menu), each in the order picked last time in this browser, and can be
// filtered by their status and by whether the menu links to them (usePickTools, as the sheets that pick several). A link to a part of a page (/kontakt/#find-vej) is shown as that page; a page that no longer
// exists is shown with its address, so it is not lost silently. The same sheet opens from a row in a list (PageListItem:
// the pages of "Default pages").
import { useRef, useState, type Ref } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import type { Option } from './fields';
import {
  ChoiceField,
  type InField,
  Option as Choice,
  SearchRow,
  BottomSheet,
  SheetTitle,
  EmptyNote,
  SheetGroupTitle,
  SheetList,
  PickListItem,
  SupportingText,
  usePickTools,
} from './ui';
import { t } from './i18n';

export type Group = { title: string; options: Option[] };

type Sheet = {
  value: string;
  groups: Group[];
  required?: boolean;
  /** The sheet's title and what is picked there, under it (a row's name and its field's hint); else "Choose page". */
  title?: string;
  hint?: string;
  onChange: (value: string) => void;
};

const plain = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

// The sheet with the pages, the page picked and how it is shown, and how the sheet is opened.
function usePageSheet({ value, groups, required, title, hint, onChange }: Sheet) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const all = groups.flatMap((g) => g.options);
  const tools = usePickTools(all, 'pages');
  const page = all.find((o) => o.value === value) ?? all.find((o) => o.value === value.replace(/#.*/, ''));
  const shown = page ? page.label : value ? t.forms.missing(value) : required ? t.forms.pickPageEllipsis : t.forms.noPage;
  const q = plain(query.trim());
  const found = groups
    .map((g) => ({ ...g, options: tools.arrange(g.options.filter((o) => plain(o.label).includes(q) || o.value.includes(q))) }))
    .filter((g) => g.options.length);

  function show() {
    dialog.current?.showModal();
    // The keyboard would cover the list on a phone; there it opens when the search is tapped.
    if (matchMedia('(pointer: fine)').matches) search.current?.focus();
    dialog.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
  }

  function pick(v: string) {
    onChange(v);
    dialog.current?.close();
  }

  const sheet = (
    <BottomSheet
      ref={dialog}
      aria-label={title ?? t.forms.pickPage}
      onClose={(e) => e.target === e.currentTarget && setQuery('')}
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
    >
      <SheetTitle title={title ?? t.forms.pickPage} onClose={() => dialog.current?.close()} />
      {hint && <SupportingText className="mx-5 mb-3 shrink-0">{hint}</SupportingText>}
      <SearchRow
        inputRef={search}
        value={query}
        onChange={setQuery}
        label={t.forms.searchPages}
        sort={tools.sort}
        filter={tools.filter}
        className="mx-5 mb-2 shrink-0"
      />
      {tools.chips}
      <SheetList div>
        {!required && !q && !tools.filtered && (
          <Choice role="option" selected={!value} onClick={() => pick('')}>
            <span className={value ? 'text-on-surface-variant' : ''}>{t.forms.noPage}</span>
          </Choice>
        )}
        {found.map((g) => (
          <section key={g.title} className="mt-2">
            {groups.length > 1 && <SheetGroupTitle>{g.title}</SheetGroupTitle>}
            <ul>
              {g.options.map((o) => (
                <li key={o.value}>
                  <Choice role="option" selected={o.value === value} onClick={() => pick(o.value)}>
                    {o.label}
                  </Choice>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!found.length && <EmptyNote>{t.forms.noPages}</EmptyNote>}
      </SheetList>
    </BottomSheet>
  );

  return { page, shown, show, sheet };
}

/** The field with the page picked (a ChoiceField, with what it says in itself, `inField`), that opens the sheet with
 * the pages. */
export default function PagePicker({ id, inField, ...props }: Sheet & { id: string; inField?: InField }) {
  const { page, shown, show, sheet } = usePageSheet(props);
  return (
    <>
      <ChoiceField id={id} arrow={CaretRight} onClick={show} {...inField}>
        <span className={`min-w-0 flex-1 truncate ${page ? '' : 'opacity-60'}`}>{shown}</span>
      </ChoiceField>
      {sheet}
    </>
  );
}

/** A row in a Group with its name (`title`) and the page picked, that opens the sheet with the pages, titled with its
 * name and its hint under it (PickListItem): the pages of "Default pages". */
export function PageListItem({ ref, ...props }: Sheet & { title: string; ref?: Ref<HTMLButtonElement> }) {
  const { shown, show, sheet } = usePageSheet(props);
  return (
    <PickListItem ref={ref} title={props.title} chosen={shown} onClick={show}>
      {sheet}
    </PickListItem>
  );
}
