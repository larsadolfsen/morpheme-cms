// The dialog for the site's blocks in the text (src/apps/<app>/blocks/): which block to put in where the cursor is,
// and its fields, for a new block and when "Ret" is tapped on one in the text. A sheet from the bottom
// on a phone, a dialog on a computer, like the page picker. The fields are the editor's own (fields.tsx),
// so it must be inside the form's Fields.Provider. list: the blocks of this text (the site's blocks on a
// page, the sections on a fixed page). Over the blocks to choose from, as under "Standardblokke" (Library.tsx):
// the search, the order (A–Å, Å–A or by group, kept in this browser) and the funnel with the filter by group
// (the standard blocks, each app's under its name), the one picked as a chip. Also the sheet of a section's
// settings (its colour, SectionSettings.tsx), which goes the same way as a block's fields: Annuller, Gem, the question when closed changed.
// The fields and the section settings are in the theme's side sheet (sheetPlacement.mjs): a standard one beside the page from
// medium (not modal: the page stays usable, .editor-side-sheet in editor.css), a modal one over the page below it
// (fields only; the section settings are a sheet from the bottom there). Both end with Gem (Indsæt) and Annuller.
// Their open, close, focus and Escape are the theme's (sideSheet() and standardSideSheet(), sideSheetControl.ts); leave() is their beforeClose.
// Another block tapped while one is open closes the open one first (the question when changed). Exposes useBlockDialog, IMAGE.
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { ArrowsDownUp, Image } from '@phosphor-icons/react';
import {
  Button,
  Choice,
  Filters,
  InputChip,
  LeadingIcon,
  optionClass,
  Preview,
  SearchRow,
  BottomSheet,
  SheetActions,
  SheetBody,
  SheetTitle,
  EmptyNote,
  ProblemNote,
  SheetList,
  SheetGroupTitle,
  useAtLeast,
} from './ui';
import { htmlBlock, type BlockData, type BlockProps, type SiteBlock } from './blocks';
import { clean, newValue, problemAt, savedValue } from './check';
import { EditLink, FieldList, useWrongField, WrongField } from './fields';
import { HTML } from './markdown.mjs';
import { byText, type Template } from './schema';
import { preview, siteBlocks } from './registry';
import { apps } from './site';
import { headed, letterOf } from './Sheet';
import CropField, { type Cut } from './Crop';
import { t } from './i18n';
import { snackbar } from '../lib/snackbar';
import { closeChanged } from './ask';
import SectionSettings from './SectionSettings';
import { sheetLook } from './sheetPlacement.mjs';
import { SiteSideSheet, siteSideSheet, siteSideSheetDialogClass, siteStandardSideSheet } from './themeUi';

export type BlockAsk = {
  list: SiteBlock[];
  /** What the text may have of them (collections.ts): what is offered, and the cards' menus. */
  template?: Template;
  /** What the cards say about the blocks comes from (describe in blocks.ts). */
  data: BlockData;
  /** Which block to put in, with its fields filled in; null when cancelled. A block can be put in more
   * than once, unless the template says how many (have: the types in the text now, one for each, IMAGE for a picture).
   * image: a picture is offered first, and chosen as the type IMAGE. */
  choose: (offer?: { image?: boolean; have?: string[] }) => Promise<{ type: string; props: BlockProps } | null>;
  /** New props for a block in the text; null when cancelled. isNew: one about to be put in ("Indsæt"). */
  edit: (type: string, props: BlockProps, isNew?: boolean) => Promise<BlockProps | null>;
  /** The settings of the section the cursor is in (now its colour; null: none); the new ones, or null when cancelled. */
  section: (color: string | null) => Promise<{ color: string | null } | null>;
};

type Open = { step: 'choose'; image?: boolean; have?: string[] } | { step: 'fields'; type: string; isNew: boolean } | { step: 'section' };

/** The type a section's settings are answered with (not a block's). */
const SECTION = 'section';

/** The choice of a picture in the sheet ("+" in the toolbar, MarkdownEditor.tsx), and a picture in the
 * text, which is changed here like a block's fields: another from the gallery, and its description, or
 * that it is decorative (then it has none, marked in its address: crop.mjs);
 * and its format and crop (Crop.tsx, props format and crop), but not on a fixed page, whose pictures
 * are the sections' own (sections.mjs). */
export const IMAGE = 'image';
const picture: SiteBlock = {
  type: IMAGE,
  label: t.blocks.picture.label,
  icon: Image,
  hint: t.blocks.picture.hint,
  fields: [
    { name: 'src', label: t.blocks.picture.src, type: 'image', required: true },
    {
      name: 'decorative',
      label: t.blocks.picture.decorative,
      type: 'boolean',
      toggle: t.blocks.picture.decorativeToggle,
      hint: t.blocks.picture.decorativeHint,
    },
    // Only for a picture that is not decorative (false, or not set).
    {
      name: 'alt',
      label: t.blocks.picture.alt,
      type: 'text',
      hint: t.blocks.picture.altHint,
      only: { field: 'decorative', is: ['', 'false'] },
    },
  ],
};
type Answer = { type: string; props: BlockProps } | null;

// Text as searched: lower case, without accents (as in PagePicker.tsx).
const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

type InsertSort = 'az' | 'za' | 'group';
const INSERT_SORTS: InsertSort[] = ['az', 'za', 'group'];
const INSERT_SORT_KEY = 'editor-sort-indsaet';

// A block's group: the app's name for an app's block, otherwise the standard blocks (also the picture and HTML).
const groupOf = (b: SiteBlock) => (b.app ? (apps.find((a) => a.id === b.app)?.label ?? b.app) : t.blockSettings.standard);

/** crop: a picture can be cut to a format (not in a "Banner"'s text, whose picture the theme lays out). */
export function useBlockDialog(
  list: SiteBlock[] = siteBlocks,
  data: BlockData,
  template?: Template,
  { crop = true } = {},
): [BlockAsk, ReactElement] {
  const blockOf = (type: string) => (type === IMAGE ? picture : type === HTML ? htmlBlock : list.find((b) => b.type === type));
  const dialog = useRef<HTMLDialogElement>(null);
  // The modal side sheet's <dialog> (below medium) and its controls; the standard one's box (from medium).
  const sideDialog = useRef<HTMLDialogElement>(null);
  const sideControls = useRef<ReturnType<typeof siteSideSheet> | null>(null);
  const standard = useRef<HTMLDivElement>(null);
  const standardControls = useRef<ReturnType<typeof siteStandardSideSheet> | null>(null);
  const headingId = useId();
  const medium = useAtLeast('medium');
  const answer = useRef<(a: Answer) => void>(() => {});
  const [open, setOpen] = useState<Open | null>(null);
  // What is open now (set at once, where `open` follows a render later), the look it has, when the last one has closed
  // (a new one waits for it), and what had the focus before (back to it from a standard side sheet).
  const openNow = useRef<Open | null>(null);
  const lookNow = useRef('sheet');
  const closing = useRef<Promise<void>>(Promise.resolve());
  const trigger = useRef<HTMLElement | null>(null);
  const show = (next: Open | null) => {
    openNow.current = next;
    setOpen(next);
  };
  const [values, setValues] = useState<BlockProps>({});
  const [problem, setProblem] = useState('');
  // Why it cannot be saved, as a message in front of the sheet too (below the fields it can be out of
  // sight), and the field it is about marked, as in every form (useWrongField in fields.tsx).
  const wrongField = useWrongField((text) => {
    snackbar({ text: t.blocks.notSaved(text), error: true });
    setProblem(text);
  });
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<InsertSort>(() => {
    try {
      const saved = localStorage.getItem(INSERT_SORT_KEY);
      if (INSERT_SORTS.some((s) => s === saved)) return saved as InsertSort;
    } catch {}
    return 'az';
  });
  const [group, setGroup] = useState('');
  const search = useRef<HTMLInputElement>(null);
  // The fields as they were when they were shown, to tell whether they have been changed.
  const shown = useRef('');

  // Another one asked for while one is open (a tap on another block, or on "+" in the text): the open one is left first
  // (with the question when it is changed), and the new one opens when it has closed. Stay in the open one: null.
  const ask = async (first: Open, props: BlockProps = {}): Promise<Answer> => {
    const from = document.activeElement;
    await closing.current;
    if (openNow.current && !(await latest.current.leave())) return null;
    await closing.current;
    if (from instanceof HTMLElement && from !== document.body) trigger.current = from;
    return new Promise<Answer>((resolve) => {
      answer.current = resolve;
      show(first);
      setValues(props);
      if (first.step === 'fields') shown.current = asWritten(first.type, props);
      if (first.step === 'section') shown.current = JSON.stringify(props.color ?? '');
      setProblem('');
      wrongField.stop(null);
      setQuery('');
      setGroup('');
    });
  };

  // Which dialog is open follows the look of the step: the sheet from the bottom, or the modal side sheet (below).
  const look: string = open ? sheetLook(open.step, medium) : 'sheet';
  lookNow.current = look;
  useEffect(() => {
    const sheet = dialog.current;
    if (open && look === 'sheet') {
      if (sheet && !sheet.open) sheet.showModal();
    } else if (sheet?.open) sheet.close();
  }, [look, !!open]);

  // The two side sheets are the theme's (sideSheetControl.ts). Their cross, Escape and (modal) a tap on the scrim go to
  // leave() first (a question when changed), which closes them itself, so beforeClose always answers false.
  const beforeClose = async () => {
    await latest.current.leave();
    return false;
  };

  // The modal side sheet (below medium).
  useEffect(() => {
    const d = sideDialog.current;
    if (look !== 'modal-side-sheet' || !d) return;
    sideControls.current = siteSideSheet(d, { beforeClose });
    sideControls.current.open();
    return () => {
      sideControls.current = null;
      document.documentElement.style.overflow = '';
    };
  }, [look]);

  // The standard side sheet (from medium): the page makes room for it (editor.css: [data-side-panel]), the focus moves
  // into it and back to what had it before when it closes.
  useEffect(() => {
    if (look !== 'side-sheet') return;
    document.documentElement.setAttribute('data-side-panel', '');
    const box = standard.current?.querySelector<HTMLElement>('[data-side-sheet-container]');
    if (box) {
      standardControls.current = siteStandardSideSheet(box, { beforeClose });
      standardControls.current.open(trigger.current ?? undefined);
    }
    return () => {
      standardControls.current = null;
      document.documentElement.removeAttribute('data-side-panel');
    };
  }, [look]);

  // The search, once the list to choose from is shown. The keyboard would cover the list on a phone;
  // there it opens when the search is tapped.
  const choosing = open?.step === 'choose';
  useEffect(() => {
    if (choosing && matchMedia('(pointer: fine)').matches) search.current?.focus();
  }, [choosing]);

  // Answer and close (the side sheet slides out first; the next one waits for `closing`).
  const done = (a: Answer) => {
    answer.current(a);
    answer.current = () => {};
    openNow.current = null;
    closing.current = (async () => {
      if (sideControls.current && sideDialog.current?.open) await sideControls.current.close();
      else if (standardControls.current) await standardControls.current.close();
      else if (dialog.current?.open) dialog.current.close();
      setOpen(null);
    })();
  };

  const asker: BlockAsk = {
    list,
    template,
    data,
    choose: (offer) => ask({ step: 'choose', image: offer?.image, have: offer?.have }),
    section: async (color) => {
      const answered = await ask({ step: 'section' }, { color: color ?? '' });
      return answered && { color: answered.props.color ? String(answered.props.color) : null };
    },
    edit: async (type, props, isNew = false) => {
      const fields = blockOf(type)?.fields ?? [];
      // A block on the page with what a field it has no value for means; a new one with the defaults.
      const a = await ask({ step: 'fields', type, isNew }, isNew ? { ...newValue(fields), ...props } : savedValue(fields, props));
      return a && a.props;
    },
  };

  // The fields as they would be saved, to compare.
  function asWritten(type: string, props: BlockProps) {
    return JSON.stringify(clean(blockOf(type)?.fields ?? [], props));
  }

  function pick(type: string) {
    const fields = blockOf(type)!.fields;
    if (!fields.length) return done({ type, props: {} });
    shown.current = asWritten(type, newValue(fields));
    setValues(newValue(fields));
    show({ step: 'fields', type, isNew: true });
  }

  /** true when it was saved (and so is closed). */
  function save(type: string) {
    const fields = blockOf(type)!.fields;
    if (wrongField.stop(problemAt(fields, values))) return false;
    done({ type, props: clean(fields, values) });
    return true;
  }

  // Closed (Annuller, the cross, a swipe down, Esc, a tap beside it) with the fields changed: the owner is
  // asked whether to keep them ("Indsæt", "Gem"), leave them or stay.
  // true when it has closed (not when the owner stays in it, or a field keeps it from being saved).
  async function leave(): Promise<boolean> {
    const finish = (a: Answer) => {
      done(a);
      return true;
    };
    if (open?.step === 'section') {
      if (JSON.stringify(values.color ?? '') === shown.current) return finish(null);
      const choice = await closeChanged(t.common.save);
      if (choice === 'keep') return (saveSection(), true);
      return choice === 'discard' && finish(null);
    }
    if (open?.step !== 'fields' || asWritten(open.type, values) === shown.current) return finish(null);
    const choice = await closeChanged(open.isNew ? t.blocks.insert : t.common.save);
    if (choice === 'keep') return save(open.type);
    return choice === 'discard' && finish(null);
  }
  // The ask() of an earlier render may be the one called: it leaves through the latest.
  const latest = useRef({ leave });
  latest.current = { leave };

  function saveSection() {
    done({ type: SECTION, props: { color: values.color ?? '' } });
  }

  function pickSort(next: InsertSort) {
    setSort(next);
    try {
      localStorage.setItem(INSERT_SORT_KEY, next);
    } catch {}
  }

  const block = open?.step === 'fields' ? blockOf(open.type) : undefined;
  // The blocks to choose from (not a section of text, which is written in the text), with the picture
  // when it is offered, in alphabetical order and as far as the search finds them. Only those the
  // template allows, and not one the text has as many of as it may.
  // A picture by the template's most of them alone (a page's template does not name it among its blocks).
  const room = (b: SiteBlock) => {
    const max = template?.max?.[b.type];
    const have = open?.step === 'choose' ? (open.have ?? []).filter((t) => t === b.type).length : 0;
    return (b.type === IMAGE || !template?.blocks || template.blocks.includes(b.type)) && (max === undefined || have < max);
  };
  const offered =
    open?.step === 'choose'
      ? [...(open.image && room(picture) ? [picture] : []), ...list.filter((b) => !b.written && room(b))].sort((a, b) =>
          byText(a.label, b.label),
        )
      : [];
  // The groups among them: the standard blocks first, then the apps' by their names. With only one there is
  // nothing to filter or order by.
  const groupNames = [...new Set(offered.map(groupOf))].sort(
    (a, b) => Number(b === t.blockSettings.standard) - Number(a === t.blockSettings.standard) || byText(a, b),
  );
  const grouped = groupNames.length > 1;
  const shownGroup = grouped && groupNames.includes(group) ? group : '';
  const shownSort = sort === 'group' && !grouped ? 'az' : sort;
  const q = plain(query.trim());
  const found = offered
    .filter((b) => plain(`${b.label} ${b.hint ?? ''}`).includes(q) && (!shownGroup || groupOf(b) === shownGroup))
    .sort((a, b) => (shownSort === 'za' ? -1 : 1) * byText(a.label, b.label));
  // Under the group's name, or A–Å or Å–A under the first letter of their names (headed, from HEADINGS_FROM).
  const headings =
    shownSort === 'group'
      ? groupNames
          .filter((g) => !shownGroup || g === shownGroup)
          .map((g) => ({ key: g as string | null, items: found.filter((b) => groupOf(b) === g) }))
          .filter((g) => g.items.length > 0)
      : headed(found, (b) => letterOf(b.label));
  const title = open?.step === 'section' ? t.text.sectionSettings : block ? block.label : t.blocks.insert;
  const sectionSettings = <SectionSettings color={String(values.color ?? '')} onChange={(color) => setValues({ color })} />;
  // A side sheet (the same markup, standard or modal): the block's fields or the section settings, with Gem (Indsæt) and Annuller.
  const sideSheetOf = (kind: 'standard' | 'modal') =>
    open &&
    (open.step === 'section' || block) && (
      <SiteSideSheet
        kind={kind}
        headline={open.step === 'fields' && open.isNew ? t.blocks.insert : title}
        headlineId={headingId}
        closeLabel={t.common.close}
        className={kind === 'standard' ? 'editor-side-sheet' : undefined}
        actions={
          <>
            <Button onClick={() => (open.step === 'fields' ? save(open.type) : saveSection())}>
              {open.step === 'fields' && open.isNew ? t.blocks.insert : t.common.save}
            </Button>
            <Button kind="outlined" onClick={() => void leave()}>
              {t.common.cancel}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {open.step === 'section' ? (
            sectionSettings
          ) : (
            <>
              {block?.edit && (
                <p className="text-sm">
                  <EditLink edit={block.edit} />
                </p>
              )}
              {block?.preview && <Preview>{preview(block.type, values, data)}</Preview>}
              <WrongField.Provider value={wrongField.field}>
                <FieldList fields={block!.fields} value={values} onChange={(v) => setValues(v as BlockProps)} />
              </WrongField.Provider>
              {block!.type === IMAGE && crop && !data.page && !!values.src && (
                <CropField
                  src={String(values.src)}
                  format={String(values.format ?? '')}
                  crop={(values.crop as Cut) ?? null}
                  onChange={(next) =>
                    setValues((v) => ({ ...v, ...next({ format: String(v.format ?? ''), crop: (v.crop as Cut) ?? null }) }))
                  }
                />
              )}
              {problem && <ProblemNote>{problem}</ProblemNote>}
            </>
          )}
        </div>
      </SiteSideSheet>
    );
  const element = (
    <>
      <BottomSheet
        ref={dialog}
        aria-label={title}
        // React passes on the close of a sheet inside it (the categories, a page): only its own counts. Closed by
        // something else than leave() and done(): answer it as cancelled.
        onClose={(e) => e.target === e.currentTarget && lookNow.current === 'sheet' && openNow.current && done(null)}
        onCancel={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          void leave();
        }}
        // A tap beside a dialog leaves it.
        onClick={(e) => e.target === dialog.current && void leave()}
      >
        <SheetTitle title={title} onClose={() => void leave()} />
        {open?.step === 'choose' && (
          <>
            <SearchRow
              inputRef={search}
              value={query}
              onChange={setQuery}
              label={t.blocks.searchInsert}
              sort={
                <Choice
                  title={t.library.sort}
                  icon={ArrowsDownUp}
                  value={shownSort}
                  options={INSERT_SORTS.filter((s) => grouped || s !== 'group').map((s) => ({ value: s, label: t.library.sorts[s] }))}
                  onChange={pickSort}
                />
              }
              filter={
                grouped && (
                  <Filters
                    title={t.library.filter}
                    selected={!!shownGroup}
                    groups={[
                      {
                        title: t.library.groupFilter,
                        value: shownGroup,
                        options: [{ value: '', label: t.library.allGroups }, ...groupNames.map((g) => ({ value: g, label: g }))],
                        onChange: setGroup,
                      },
                    ]}
                  />
                )
              }
              className="mx-5 mb-2 shrink-0"
            />
            {shownGroup && (
              <div className="mx-5 mb-2 flex shrink-0 flex-wrap gap-2">
                <InputChip removeLabel={t.library.removeFilter(shownGroup)} onRemove={() => setGroup('')}>
                  {shownGroup}
                </InputChip>
              </div>
            )}
            <SheetList>
              {headings.map((h) => [
                h.key && (
                  <li key={`heading-${h.key}`}>
                    <SheetGroupTitle>{h.key}</SheetGroupTitle>
                  </li>
                ),
                ...h.items.map((b) => (
                  <li key={b.type}>
                    <button
                      type="button"
                      className={optionClass()}
                      onClick={() => (b.type === IMAGE ? done({ type: IMAGE, props: {} }) : pick(b.type))}
                    >
                      <LeadingIcon icon={b.icon} />
                      <span className="min-w-0">
                        <span className="block font-medium">{b.label}</span>
                        {b.hint && <span className="block text-sm text-muted">{b.hint}</span>}
                      </span>
                    </button>
                  </li>
                )),
              ])}
              {!offered.length && <EmptyNote item>{t.blocks.noneHere}</EmptyNote>}
              {offered.length > 0 && !found.length && (
                <EmptyNote item>{query.trim() ? t.blocks.noneNamed(query.trim()) : t.common.noMatch}</EmptyNote>
              )}
            </SheetList>
          </>
        )}
        {look === 'sheet' && open?.step === 'section' && (
          <>
            <SheetBody>{sectionSettings}</SheetBody>
            <SheetActions onCancel={() => void leave()} onDone={saveSection} done={t.common.save} />
          </>
        )}
      </BottomSheet>
      {look === 'modal-side-sheet' && (
        <dialog ref={sideDialog} className={siteSideSheetDialogClass} aria-labelledby={headingId}>
          {sideSheetOf('modal')}
        </dialog>
      )}
      {look === 'side-sheet' && (
        // The standard side sheet is not modal: the page stays usable.
        <div ref={standard} className="contents">
          {sideSheetOf('standard')}
        </div>
      )}
    </>
  );
  return [asker, element];
}
