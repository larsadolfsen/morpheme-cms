// The dialog for the site's blocks in the text (src/apps/<app>/blocks/): which block to put in where the cursor is,
// and its fields, for a new block and when "Edit" is tapped on one in the text. A sheet from the bottom
// on a phone, a dialog on a computer, like the page picker. The fields are the editor's own (fields.tsx),
// so it must be inside the form's Fields.Provider. list: the blocks of this text (the site's blocks on a
// page, the sections on a fixed page). Over the blocks to choose from, as under "Standard blocks" (Library.tsx):
// the search, the order (A–Z, Z–A or by group, kept in this browser) and the funnel with the filter by group
// (the standard blocks, each app's under its name), the one picked as a chip. Also the sheet of a section's
// settings (its colour, SectionSettings.tsx), which goes the same way as a block's fields: Cancel, Save, the question when closed changed.
// The fields and the section settings are in the theme's side sheet (sheetPlacement.mjs): a standard one beside the page from
// expanded (not modal: the page stays usable, .mo-editor-side-sheet in editor.css), a modal one over the page below it
// (fields only; the section settings are the standard side sheet from medium, 600 dp). The modal one and the sheet from the bottom end with Save
// (Insert) and Cancel. The standard one is live when the caller gives it the block (LiveBlock, liveSheet.mjs): each change goes to the
// block at once, one undo step per field, and it follows the block through Undo and Redo; it has only its headline and close button
// (no Save, Cancel or Remove; Remove is in the block's menu) and asks nothing when it closes. A sheet keeps its look while it is open,
// even when the window crosses the expanded breakpoint.
// Their open, close, focus and Escape are the theme's (sideSheet() and standardSideSheet(), sideSheetControl.ts); leave() is their beforeClose.
// On a compact window (a phone, below medium) a block's fields and a section's settings are a subpage of the page form instead (owner, 14 Nov: full-screen views are
// pages), drawn as the crop view is (CropView.tsx; editor.css gives .mo-editor-block-page the crop page's layer and column): the top app bar with the back arrow and the block's name, the fields, and Save
// (Insert) in the theme's standard bottom sheet (ActionSheet). It is a layer over the form (a modal <dialog>), so the form keeps its scroll place; it has a step of its own in the
// history (useSheetBack), so the browser's and Android's back leave it; back with changes asks "Keep your changes?" (closeChanged).
// Below medium the fields of a block on the page (edit with `keep`) are kept in a hidden copy in this browser while they are changed
// (sheetCopy.mjs, one per page, `copy`), deleted when the sheet is answered; offer() asks to put a copy back when the page opens again:
// Restore opens the subpage (or the modal side sheet at medium) with the copy's values, still unsaved, and from medium the live side sheet
// with them written to the block like any change.
// Another block tapped while one is open closes the open one first (the question when changed). Exposes useBlockDialog, IMAGE.
import { useCallback, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import {
  ActionSheet,
  Button,
  Choice,
  Filters,
  InputChip,
  ListItem,
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
  IconButton,
  TopAppBar,
  atLeastNow,
} from './ui';
import { blockGroups, htmlBlock, type BlockData, type BlockProps, type SiteBlock } from './blocks';
import { clean, newValue, problemAt, savedValue } from './check';
import { EditLink, FieldList, FieldPageSheet, useWrongField, WrongField } from './fields';
import { HTML } from './markdown.mjs';
import { byText, type Field, type Template } from './schema';
import { preview, siteBlocks } from './registry';
import { apps } from './site';
import { headed, letterOf } from './Sheet';
import { cropView, type Cut } from './CropView';
import { shownAt } from './images';
import { t } from './i18n';
import { snackbar } from '../lib/snackbar';
import { choose as askChoice, closeChanged } from './ask';
import SectionSettings, { type SectionValues } from './SectionSettings';
import { liveSheet, sheetLook } from './sheetPlacement.mjs';
import { sheetSteps } from './liveSheet.mjs';
import { usePane } from './PaneHost';
import { siteFollowKeyboard } from './themeUi';
import { typedInPlace } from './typedInPlace.mjs';
import { useSheetBack } from './useSheetBack';
import { drop as dropCopy, keep as keepCopy, matches as copyMatches, take as takeCopy } from './sheetCopy.mjs';
import { safeImageSrc } from '../lib/safe-url.mjs';
import { materialIcon } from './icon';

/** Where an image's live sheet opens (from medium, the bar's Alt text and a new image): its Alt text field. Below medium the alt text sheet (`BlockAsk.alt`) is used. */
export type EditFocus = 'alt';

/** Scrolls the open sheet to its field labelled `name` (the Alt text field; a video's link, `reachField`) and puts the focus there, once the sheet has drawn it (it opens after the one before it has closed). */
export function reachField(name: string) {
  let tries = 0;
  const go = () => {
    const sheet = [...document.querySelectorAll<HTMLElement>('dialog[open], .mo-editor-side-sheet')].at(-1);
    const label = [...(sheet?.querySelectorAll('label') ?? [])].find((l) => l.textContent?.trim() === name);
    const target = label?.htmlFor ? sheet?.querySelector<HTMLElement>(`[id="${CSS.escape(label.htmlFor)}"]`) : null;
    if (!target) return void (tries++ < 40 && setTimeout(go, 50));
    target.scrollIntoView({ block: 'center' });
    target.focus({ preventScroll: true });
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) target.select();
  };
  setTimeout(go);
}

export type BlockAsk = {
  list: SiteBlock[];
  /** An image can be cut here (the bar's Crop, the sheet's Aspect ratio): not in a Banner's text, nor on a fixed page. */
  canCrop: boolean;
  /** What the text may have of them (collections.ts): what is offered, and the cards' menus. */
  template?: Template;
  /** What the cards say about the blocks comes from (describe in blocks.ts). */
  data: BlockData;
  /** Which block to put in, with its fields filled in; null when cancelled. A block can be put in more
   * than once, unless the template says how many (have: the types in the text now, one for each, IMAGE for an image).
   * image: an image is offered first, and chosen as the type IMAGE. live: the caller can put a block in at once and open its live
   * sheet (`edit` with a LiveBlock); a block with fields then comes with its defaults and `open` true when its sheet would be live,
   * with no `Insert` of its own. */
  choose: (offer?: {
    image?: boolean;
    have?: string[];
    live?: boolean;
  }) => Promise<{ type: string; props: BlockProps; open?: boolean } | null>;
  /** New props for a block in the text; null when cancelled. isNew: one about to be put in ("Insert"). live: makes the link to the
   * block in the text, used when the sheet is live (the side sheet from medium): its changes are then written through it, and the
   * answer is null when it closes (nothing is left to write). focus: the field the sheet opens at (EditFocus). */
  edit: (
    type: string,
    props: BlockProps,
    isNew?: boolean,
    live?: () => LiveBlock | null,
    focus?: EditFocus,
    keep?: KeepAt,
  ) => Promise<BlockProps | null>;
  /** The page whose sheets keep a hidden copy below medium (sheetCopy.mjs); undefined: none kept (another form, or not known yet). */
  copy?: string;
  /** Once the page's text is loaded: offers to put back the page's hidden copy ("Restore your unsaved changes?") when the block it was
   * typed for is still there (find: the block or image at that index, null when there is none). Asks once per page. */
  offer: (find: (index: number) => SheetTarget | null) => void;
  /** The short sheet for an image's alt text (image tools spec 9.1): its preview, `Decorative image` and `Alt text` (with the Library's text as the hint), and `Skip`
   * (mode 'new', right after an image was picked: the image stays without a text of its own, also when the sheet is closed) or `Cancel` (mode 'edit', the bar's
   * Alt text) and `Save`. The new text and whether the image is decorative; null in 'edit' when it was left. */
  alt: (
    image: { src: string; alt: string; decorative: boolean },
    mode: 'new' | 'edit',
  ) => Promise<{ alt: string; decorative: boolean } | null>;
  /** The sheet with the pages, open at once, for an item's link (a row's link button): the address picked ('' is no page), null when it is closed
   * without a pick. No sheet of the item comes first. */
  page: (field: Field, value: string, title: string) => Promise<string | null>;
  /** The settings of the section the cursor is in (its colour, null: none, an H2's image and its description, and the width); the new
   * ones, or null when cancelled. image: the section can have an image (an H2's); width: it can have a width (an H1's or H2's). live: as
   * `edit`'s. */
  section: (
    current: SectionSettingsOf,
    options?: { image?: boolean; width?: boolean; live?: () => LiveBlock | null },
  ) => Promise<SectionSettingsOf | null>;
  /** The settings of a row of a block typed in place (a List's icon and link; `inline` in blocks.ts): in the side panel from medium, kept
   * open and updated while a row is active, and a bottom sheet below it. Live: each change is told to `onChange` at once, with no Save and no
   * Cancel of its own. Not shown while another sheet is open. null closes it. `open` false: only update the settings if they are open already. */
  row: (spec: RowSpec | null, open?: boolean) => void;
};

/** Where a block's sheet keeps its hidden copy: the block's index among the parts of the text that open a sheet (blocks and images),
 * and the values to open the sheet with instead of its props (a copy put back). */
export type KeepAt = { at: number; start?: BlockProps };

/** A block or image in the text a hidden copy may be for: its index, type and props (as edit gets them), and how to open its sheet with
 * the copy's values. */
export type SheetTarget = { index: number; type: string; props: BlockProps; open: (values: BlockProps) => void };

/** The settings of the active row of a block typed in place: what the panel or sheet shows and where its changes go. */
export type RowSpec = {
  headline: string;
  fields: Field[];
  value: BlockProps;
  onChange: (value: BlockProps) => void;
  /** The sheet is closed once the value is changed (the icon picker: a pick is all it asks). */
  closes?: boolean;
};

/** The link of a live sheet to its block (or section heading) in the text (MarkdownEditor.tsx). */
export type LiveBlock = {
  /** Writes the sheet's values to the block at once, as part of an undo step (liveSheet.mjs, sheetSteps). */
  write: (props: BlockProps, step: { fresh: boolean; group: number }) => void;
  /** Who is told the block's props when something else changes them (Undo, Redo); null when the block is gone. */
  follow: (to: ((props: BlockProps | null) => void) | null) => void;
  /** The sheet has closed: the undo step ends, and the block is no longer followed. */
  end: () => void;
  /** What gets the focus back when the sheet closes and what had it before is gone (the block's card drawn anew by a change). */
  target?: () => HTMLElement | null;
};

/** A section's settings in the text: null for what it has not. */
export type SectionSettingsOf = { color: string | null; image?: string | null; alt?: string | null; width?: string | null };

// wide, compact: the window was at least expanded, or below medium, when the step was shown; its look stays while it is open. live: its
// changes go to the block at once.
type Open = (
  | { step: 'choose'; image?: boolean; have?: string[]; live?: boolean }
  | { step: 'fields'; type: string; isNew: boolean; live?: boolean }
  | { step: 'section'; image: boolean; width: boolean; live?: boolean }
  | { step: 'row'; live?: undefined }
  | { step: 'alt'; mode: 'new' | 'edit'; live?: undefined }
) & { wide?: boolean; compact?: boolean };

const sectionValues = (v: BlockProps): SectionValues => ({
  color: String(v.color ?? ''),
  image: String(v.image ?? ''),
  alt: String(v.alt ?? ''),
  width: String(v.width ?? ''),
});

// An image's alt text sheet as it would be saved, to compare (the text and whether the image is decorative).
const altWritten = (v: BlockProps) => JSON.stringify([String(v.alt ?? '').trim(), v.decorative === true]);
// The answer that keeps the image with no text of its own (Skip, and the sheet closed in 'new' mode).
const SKIPPED = { type: 'image', props: { alt: '', decorative: false } };

/** The type a section's settings are answered with (not a block's). */
const SECTION = 'section';

/** The choice of an image in the sheet ("+" in the toolbar, MarkdownEditor.tsx), and an image in the
 * text, which is changed here like a block's fields: another from the gallery, and its description, or
 * that it is decorative (then it has none, marked in its address: crop.mjs);
 * and its format and crop (CropView.tsx, props format and crop), but not on a fixed page, whose images
 * are the sections' own (sections.mjs). */
export const IMAGE = 'image';
const image: SiteBlock = {
  type: IMAGE,
  group: 'media',
  label: t.blocks.picture.label,
  icon: materialIcon('image'),
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
    // Only for an image that is not decorative (false, or not set).
    {
      name: 'alt',
      label: t.blocks.picture.alt,
      type: 'text',
      hint: t.blocks.picture.altHint,
      libraryText: 'src',
      only: { field: 'decorative', is: ['', 'false'] },
    },
  ],
};
// The fields of the alt text sheet: the image's own, without the image (its address stays in the values, for the Library's text).
const altFields = image.fields.filter((f) => f.name !== 'src');
type Answer = { type: string; props: BlockProps; open?: boolean } | null;

// Text as searched: lower case, without accents (as in PagePicker.tsx).
const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

type InsertSort = 'az' | 'za' | 'group';
const INSERT_SORTS: InsertSort[] = ['az', 'za', 'group'];
const INSERT_SORT_KEY = 'editor-sort-insert';

// A block's group: the app's name for an app's block, otherwise the standard blocks (also the image and HTML).
// The standard blocks are in groups by what they do (`group`), the same in `Insert`'s headings and its filter.
const groupOf = (b: SiteBlock) => (b.app ? (apps.find((a) => a.id === b.app)?.label ?? b.app) : t.blockSettings.groups[b.group ?? 'media']);
const standardGroups: string[] = blockGroups.map((g) => t.blockSettings.groups[g]);

/** crop: an image can be cut to a format (not in a block's text, whose image the theme lays out). copy: the page whose sheets keep a hidden
 * copy below medium. back: the name of the screen the subpage goes back to (the page's title). */
export function useBlockDialog(
  list: SiteBlock[] = siteBlocks,
  data: BlockData,
  template?: Template,
  { crop = true, copy, back }: { crop?: boolean; copy?: string; back?: string } = {},
): [BlockAsk, ReactElement] {
  const blockOf = (type: string) => (type === IMAGE ? image : type === HTML ? htmlBlock : list.find((b) => b.type === type));
  const dialog = useRef<HTMLDialogElement>(null);
  // The modal side sheet's <dialog> (below medium) and its controls; the standard one's box (from medium).
  // The subpage's <dialog> (a block's fields on a compact window).
  const pageDialog = useRef<HTMLDialogElement>(null);
  // The hidden copy of the open block's fields (below medium): where the block is and its props when it opened; null when none is kept.
  const copyOf = useRef<{ index: number; type: string; before: BlockProps } | null>(null);
  // The page whose copy has been offered (offer() asks once).
  const offerMade = useRef<string | undefined>(undefined);
  const headingId = useId();
  const answer = useRef<(a: Answer) => void>(() => {});
  // The row settings shown now (the `row` step).
  const rowSpec = useRef<RowSpec | null>(null);
  // The page sheet of an item's link, open now (the `page` of the asker): the field, its value, its title and where the answer goes.
  const [pageAsk, setPageAsk] = useState<{ field: Field; value: string; title: string; end: (v: string | null) => void } | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  // What is open now (set at once, where `open` follows a render later), the look it has, when the last one has closed
  // (a new one waits for it), and what had the focus before (back to it from a standard side sheet).
  const openNow = useRef<Open | null>(null);
  const lookNow = useRef('sheet');
  const closing = useRef<Promise<void>>(Promise.resolve());
  const trigger = useRef<HTMLElement | null>(null);
  // The look is taken from the window as each step is shown, and kept while it is open.
  const show = (next: Open | null) => {
    const shown: Open | null = next && { ...next, wide: atLeastNow('medium'), compact: !atLeastNow('medium') };
    openNow.current = shown;
    setOpen(shown);
    return shown;
  };
  // The live sheet's link to its block, and its undo steps (one per field focus).
  const live = useRef<LiveBlock | null>(null);
  const steps = useRef(sheetSteps());
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
    return 'group';
  });
  const [group, setGroup] = useState('');
  const search = useRef<HTMLInputElement>(null);
  // The fields as they were when they were shown, to tell whether they have been changed.
  const shown = useRef('');

  // Another one asked for while one is open (a tap on another block, or on "+" in the text): the open one is left first
  // (with the question when it is changed), and the new one opens when it has closed. Stay in the open one: null.
  // linked: makes the link to the block, when the sheet is live (its changes then go to the block at once).
  // start: the values to open with instead of props (a hidden copy put back); kept: where the block keeps its hidden copy.
  const ask = async (
    first: Open,
    props: BlockProps = {},
    linked?: () => LiveBlock | null,
    start?: BlockProps,
    kept?: { index: number; type: string; before: BlockProps },
  ): Promise<Answer> => {
    const from = document.activeElement;
    await closing.current;
    if (openNow.current && !(await latest.current.leave())) return null;
    await closing.current;
    if (from instanceof HTMLElement && from !== document.body) trigger.current = from;
    return new Promise<Answer>((resolve) => {
      answer.current = resolve;
      const link = linked && liveSheet(first.step, atLeastNow('medium')) ? linked() : null;
      // A live sheet keeps no copy: its changes are on the page.
      copyOf.current = link ? null : (kept ?? null);
      const opened = show(link && (first.step === 'fields' || first.step === 'section') ? { ...first, live: true } : first)!;
      if (link) {
        live.current = link;
        steps.current = sheetSteps();
        // Undo or Redo changed the block: the sheet shows it as it is now. The block gone (its insert undone): the sheet closes.
        link.follow((now) => {
          if (openNow.current !== opened) return;
          if (!now) return void queueMicrotask(() => openNow.current === opened && done(null));
          setValues(opened.step === 'fields' ? savedValue(blockOf(opened.type)?.fields ?? [], now) : sectionValues(now));
        });
      }
      setValues(start ?? props);
      // A hidden copy put back at computer width: its values are written to the block like any change (an unsaved change of the page).
      if (link && start && first.step === 'fields') writeLive(clean(blockOf(first.type)?.fields ?? [], start));
      if (first.step === 'fields') shown.current = asWritten(first.type, props);
      if (first.step === 'section') shown.current = JSON.stringify(sectionValues(props));
      if (first.step === 'alt') shown.current = altWritten(props);
      setProblem('');
      wrongField.stop(null);
      setQuery('');
      setGroup('');
    });
  };

  // Which dialog is open follows the look of the step: the sheet from the bottom, or the modal side sheet (below). It is taken when
  // the step is shown (show) and kept while it is open: a sheet never switches between live and Save and Cancel mid-edit.
  const look: string = open ? sheetLook(open.step, !!open.wide) : 'sheet';
  lookNow.current = look;
  useEffect(() => {
    const sheet = dialog.current;
    if (open && look === 'sheet') {
      if (sheet && !sheet.open) sheet.showModal();
    } else if (sheet?.open) sheet.close();
  }, [look, !!open]);

  // The subpage (a block's fields on a compact window): a modal <dialog> over the form, as the crop view is. The form under it stays as it was
  // (its scroll place too), and does not scroll; the page's top and bottom bars are the dialog's own; it keeps above the on-screen keyboard.
  // No control has the focus at the start (owner, 15 Nov): showModal() would focus the back arrow, with a ring and its tooltip, so the page itself
  // takes the focus, without a ring; Tab reaches the back arrow first.
  useEffect(() => {
    const d = pageDialog.current;
    if (look !== 'subpage' || !d) return;
    if (!d.open) d.showModal();
    d.focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    const stop = siteFollowKeyboard(d);
    return () => {
      stop();
      if (d.open) d.close();
      document.documentElement.style.overflow = '';
    };
  }, [look]);
  // The browser's and Android's back leave the subpage through leave() (the question when changed); staying in it gives the step back.
  const onBack = useCallback(async () => {
    if (!(await latest.current.leave())) history.pushState({ ...history.state, sheet: 'mo-editor-block-page' }, '');
  }, []);
  useSheetBack(look === 'subpage' && !!open, onBack, 'mo-editor-block-page');

  // The hidden copy (below medium): kept 300 ms after each change while the fields differ from what was shown, deleted when they are
  // the same again; done() deletes it when the sheet is answered.
  useEffect(() => {
    const at = copyOf.current;
    if (!copy || !at || open?.step !== 'fields' || look === 'side-sheet') return;
    const changed = asWritten(open.type, values) !== shown.current;
    const timer = window.setTimeout(() => {
      if (copyOf.current !== at) return;
      if (changed) keepCopy(copy, at, values);
      else dropCopy(copy);
    }, 300);
    return () => clearTimeout(timer);
  }, [values, open, look]);

  // The two side sheets are the theme's (sideSheetControl.ts). Their cross, Escape and (modal) a tap on the scrim go to
  // leave() first (a question when changed), which closes them itself, so beforeClose always answers false.
  const beforeClose = async () => {
    await latest.current.leave();
    return false;
  };

  // The search, once the list to choose from is shown. The keyboard would cover the list on a phone;
  // there it opens when the search is tapped.
  const choosing = open?.step === 'choose';
  useEffect(() => {
    if (choosing && matchMedia('(pointer: fine)').matches) search.current?.focus();
  }, [choosing]);

  // The alt text sheet is for the text: its field has the focus when the sheet is open (a phone's keyboard comes up and the field is in view), unless the
  // image is decorative and has none.
  const altStep = open?.step === 'alt';
  useEffect(() => {
    if (!altStep) return;
    const id = setTimeout(() => dialog.current?.querySelector<HTMLElement>('textarea, input[type=text]')?.focus(), 150);
    return () => clearTimeout(id);
  }, [altStep]);

  // Answer and close (the side sheet slides out first; the next one waits for `closing`).
  const done = (a: Answer) => {
    answer.current(a);
    answer.current = () => {};
    openNow.current = null;
    if (copyOf.current) {
      copyOf.current = null;
      dropCopy(copy);
    }
    // A live sheet ends its undo step and lets go of its block; the focus goes to the block's card when the one tapped was drawn anew.
    const ended = live.current;
    live.current = null;
    steps.current.end();
    const card = ended && !trigger.current?.isConnected ? ended.target?.() : null;
    ended?.follow(null);
    ended?.end();
    closing.current = (async () => {
      if (pageDialog.current?.open) pageDialog.current.close();
      else if (lookNow.current === 'side-sheet') await pane.close();
      else if (dialog.current?.open) dialog.current.close();
      card?.focus();
      setOpen(null);
    })();
  };

  // A change in a live sheet, written to the block at once: the changes typed in one field while it has the focus are one undo step,
  // and each pick is one (liveSheet.mjs).
  const typedIn = () => {
    const at = document.activeElement;
    const typing = 'input:not([type=checkbox]):not([type=radio]):not([type=button]), textarea, [contenteditable="true"]';
    return at instanceof HTMLElement && at.closest('.mo-editor-side-sheet') && at.matches(typing) ? at : null;
  };
  const writeLive = (props: BlockProps) => live.current?.write(props, steps.current.change(typedIn()));
  const changeFields = (next: BlockProps) => {
    setValues(next);
    if (open?.step === 'fields' && open.live) writeLive(clean(blockOf(open.type)?.fields ?? [], next));
  };

  /** The fields of the block's sheet (the gear): the ones typed where the block stands (a list's heading and subheading) are not repeated. */
  const settingsFields = (b: NonNullable<typeof block>) => {
    const inline = b.inline;
    if (!typedInPlace(b) || !inline?.blockSettings) return b.fields;
    if (inline.single) return b.fields.filter((f) => !inline.fields.includes(f.name));
    // The items are edited on the items (owner, 22 Nov 2026, B5): Block settings holds only what applies to the whole block. The list of
    // items is left out when every field of an item is typed, picked in a slot or picked from the link button.
    const own = new Set([
      ...inline.fields,
      ...(inline.media ?? []),
      ...(inline.settings ?? []),
      ...(inline.onItem ?? []),
      ...(inline.link ? [inline.link] : []),
      ...(inline.icon ? [inline.icon] : []),
    ]);
    return b.fields.filter((f) => f.name !== inline.item || !(f.fields ?? []).every((x) => own.has(x.name)));
  };

  const asker: BlockAsk = {
    list,
    canCrop: crop && !data.page,
    template,
    data,
    choose: (offer) => ask({ step: 'choose', image: offer?.image, have: offer?.have, live: offer?.live }),
    section: async (current, options) => {
      const answered = await ask(
        { step: 'section', image: !!options?.image, width: !!options?.width },
        sectionValues(current as BlockProps),
        options?.live,
      );
      if (!answered) return null;
      const v = sectionValues(answered.props);
      return { color: v.color || null, image: v.image || null, alt: v.alt || null, width: v.width || null };
    },
    row: (spec, show_ = true) => {
      if (!spec) {
        if (openNow.current?.step === 'row') done(null);
        return;
      }
      if (openNow.current && openNow.current.step !== 'row') return;
      if (!openNow.current && !show_) return;
      rowSpec.current = spec;
      if (!openNow.current) {
        trigger.current = null;
        show({ step: 'row' });
      }
      setValues(spec.value);
    },
    edit: async (type, props, isNew = false, linked, focus, keep) => {
      const fields = blockOf(type)?.fields ?? [];
      if (focus === 'alt') reachField(t.blocks.picture.alt);
      // A block on the page with what a field it has no value for means; a new one with the defaults; a hidden copy put back with its values.
      const values = isNew ? { ...newValue(fields), ...props } : savedValue(fields, props);
      const a = await ask(
        { step: 'fields', type, isNew },
        values,
        linked,
        keep?.start && { ...values, ...keep.start },
        keep && { index: keep.at, type, before: props },
      );
      return a && a.props;
    },
    copy,
    offer: (find) => {
      if (!copy || offerMade.current === copy) return;
      offerMade.current = copy;
      const kept = takeCopy(copy);
      if (!kept) return;
      const here = find(kept.block.index);
      if (!here || !copyMatches(kept, here)) return dropCopy(copy);
      // Esc keeps the copy for next time; no button has the focus when the question opens.
      void askChoice({
        title: t.blocks.restoreTitle,
        text: t.blocks.restoreText(blockOf(here.type)?.label ?? here.type),
        choices: [
          { value: 'restore', label: t.history.restore },
          { value: 'discard', label: t.app.discard },
        ],
        cancel: false,
      }).then((a) => {
        if (a?.choice === 'restore') {
          here.open(kept.values);
          // From medium the values go to the page at once, so the copy has done its work.
          if (atLeastNow('medium')) dropCopy(copy);
        } else if (a?.choice === 'discard') dropCopy(copy);
      });
    },
    page: (field, value, title) =>
      new Promise((resolve) => {
        setPageAsk((was) => {
          was?.end(null);
          return { field, value, title, end: resolve };
        });
      }),
    alt: async (picture, mode) => {
      const a = await ask({ step: 'alt', mode }, { src: picture.src, alt: picture.alt, decorative: picture.decorative });
      return a ? { alt: String(a.props.alt ?? ''), decorative: a.props.decorative === true } : null;
    },
  };

  // The fields as they would be saved, to compare.
  function asWritten(type: string, props: BlockProps) {
    // An image's aspect ratio and crop are not fields, but closing the sheet after changing them asks as it does for a field.
    const cut = type === IMAGE ? [String(props.format ?? ''), props.crop ?? null] : null;
    return JSON.stringify([clean(blockOf(type)?.fields ?? [], props), cut]);
  }

  function pick(type: string) {
    const fields = blockOf(type)!.fields;
    if (!fields.length) return done({ type, props: {} });
    // A block typed in place goes in at once, with its first row active (MarkdownEditor.tsx): no sheet. One with `inline` but no view to draw it (an app's block without Inline.tsx) has its sheet.
    if (typedInPlace(blockOf(type))) return done({ type, props: newValue(fields) });
    // From medium any other block goes in at once too, with its defaults, and the caller opens its live sheet beside it (no Insert).
    if (open?.step === 'choose' && open.live && liveSheet('fields', atLeastNow('medium')))
      return done({ type, props: newValue(fields), open: true });
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

  // Closed (Cancel, the cross, a swipe down, Esc, a tap beside it) with the fields changed: the owner is
  // asked whether to keep them (Keep: as the sheet's Insert or Save), leave them (Discard) or stay.
  // true when it has closed (not when the owner stays in it, or a field keeps it from being saved).
  async function leave(): Promise<boolean> {
    const finish = (a: Answer) => {
      done(a);
      return true;
    };
    // A row's settings and a live sheet: closing them leaves nothing to keep or discard.
    if (open?.step === 'row' || open?.live) return finish(null);
    if (open?.step === 'section') {
      if (JSON.stringify(sectionValues(values)) === shown.current) return finish(null);
      const choice = await closeChanged();
      if (choice === 'keep') return (saveSection(), true);
      return choice === 'discard' && finish(null);
    }
    if (open?.step === 'alt') {
      // Closed before Save: with nothing changed, or after Discard, a new image stays without a text of its own (Skip), an old one is as it was.
      const left = () => finish(open.mode === 'new' ? SKIPPED : null);
      if (altWritten(values) === shown.current) return left();
      const choice = await closeChanged();
      if (choice === 'keep') return (saveAlt(), true);
      return choice === 'discard' && left();
    }
    if (open?.step !== 'fields' || asWritten(open.type, values) === shown.current) return finish(null);
    const choice = await closeChanged();
    if (choice === 'keep') return save(open.type);
    return choice === 'discard' && finish(null);
  }
  // The ask() of an earlier render may be the one called: it leaves through the latest.
  const latest = useRef({ leave });
  latest.current = { leave };

  function saveAlt() {
    // A decorative image has no text.
    done({
      type: IMAGE,
      props: { alt: values.decorative === true ? '' : String(values.alt ?? '').trim(), decorative: values.decorative === true },
    });
  }

  function saveSection() {
    done({ type: SECTION, props: sectionValues(values) });
  }

  function pickSort(next: InsertSort) {
    setSort(next);
    try {
      localStorage.setItem(INSERT_SORT_KEY, next);
    } catch {}
  }

  const block = open?.step === 'fields' ? blockOf(open.type) : undefined;
  // The blocks to choose from (not a section of text, which is written in the text), with the image
  // when it is offered, in alphabetical order and as far as the search finds them. Only those the
  // template allows, and not one the text has as many of as it may.
  // An image by the template's most of them alone (a page's template does not name it among its blocks).
  const room = (b: SiteBlock) => {
    const max = template?.max?.[b.type];
    const have = open?.step === 'choose' ? (open.have ?? []).filter((t) => t === b.type).length : 0;
    return (b.type === IMAGE || !template?.blocks || template.blocks.includes(b.type)) && (max === undefined || have < max);
  };
  const offered =
    open?.step === 'choose'
      ? [...(open.image && room(image) ? [image] : []), ...list.filter((b) => !b.written && !b.former && room(b))].sort((a, b) =>
          byText(a.label, b.label),
        )
      : [];
  // The groups among them: the standard blocks first, then the apps' by their names. With only one there is
  // nothing to filter or order by.
  const rank = (g: string) => (standardGroups.includes(g) ? standardGroups.indexOf(g) : standardGroups.length);
  const groupNames = [...new Set(offered.map(groupOf))].sort((a, b) => rank(a) - rank(b) || byText(a, b));
  const grouped = groupNames.length > 1;
  const shownGroup = grouped && groupNames.includes(group) ? group : '';
  const shownSort = sort === 'group' && !grouped ? 'az' : sort;
  const q = plain(query.trim());
  const found = offered
    .filter((b) => plain(`${b.label} ${b.hint ?? ''}`).includes(q) && (!shownGroup || groupOf(b) === shownGroup))
    .sort((a, b) => (shownSort === 'za' ? -1 : 1) * byText(a.label, b.label));
  // Under the group's name, or A–Z or Z–A under the first letter of their names (headed, from HEADINGS_FROM).
  const headings =
    shownSort === 'group'
      ? groupNames
          .filter((g) => !shownGroup || g === shownGroup)
          .map((g) => ({ key: g as string | null, items: found.filter((b) => groupOf(b) === g) }))
          .filter((g) => g.items.length > 0)
      : headed(found, (b) => letterOf(b.label));
  const title =
    open?.step === 'row'
      ? (rowSpec.current?.headline ?? '')
      : open?.step === 'alt'
        ? t.blocks.picture.alt
        : open?.step === 'section'
          ? t.text.sectionSettings
          : block
            ? block.label
            : t.blocks.insert;
  const rowFields = open?.step === 'row' && rowSpec.current && (
    <FieldList
      fields={rowSpec.current.fields}
      value={values}
      onChange={(v) => {
        setValues(v as BlockProps);
        rowSpec.current?.onChange(v as BlockProps);
        if (rowSpec.current?.closes) done(null);
      }}
    />
  );
  const sectionSettings = (
    <SectionSettings
      values={sectionValues(values)}
      image={open?.step === 'section' && open.image}
      width={open?.step === 'section' && open.width}
      onChange={(next) => {
        setValues({ ...next });
        if (open?.step === 'section' && open.live) writeLive({ ...next });
      }}
    />
  );
  // A block's fields (or an image's), in a side sheet or the subpage.
  const blockFields = block && (
    <>
      {block?.edit && (
        <p className="mo-editor-block-dialog-note">
          <EditLink edit={block.edit} />
        </p>
      )}
      {block?.preview && <Preview>{preview(block.type, values, data)}</Preview>}
      <WrongField.Provider value={wrongField.field}>
        <FieldList
          fields={settingsFields(block!)}
          value={values}
          // Another image starts as Original, with no crop (image tools spec, decision 5).
          onChange={(v) =>
            changeFields(
              block!.type === IMAGE && (v as BlockProps).src !== values.src
                ? { ...(v as BlockProps), format: '', crop: null }
                : (v as BlockProps),
            )
          }
        />
      </WrongField.Provider>
      {block!.type === IMAGE && crop && !data.page && !!values.src && (
        // The aspect ratio is one row: its value and an arrow; it opens the crop view over the sheet, and Save there brings the new ratio and crop
        // back here (the sheet's own Save keeps them in the page: one change, one Save).
        <ul className="mo-editor-block-dialog-list">
          <ListItem
            headline={t.media.crop.ratio}
            count={String(values.format ?? '') || t.media.crop.original}
            arrow
            onClick={async () => {
              const next = await cropView({
                src: String(values.src),
                format: String(values.format ?? ''),
                crop: (values.crop as Cut) ?? null,
              });
              if (next) changeFields({ ...values, format: next.format, crop: next.crop });
            }}
          />
        </ul>
      )}
      {problem && <ProblemNote>{problem}</ProblemNote>}
    </>
  );
  // The pane beside the page (PaneHost.tsx): the block's fields, the section settings or the settings of a row, with Save (Insert) and Cancel
  // unless it is live (its headline and close button only). Fed on every render while its look is the side sheet.
  const inPane = look === 'side-sheet' && open && (open.step === 'section' || open.step === 'row' || block);
  const pane = usePane(
    inPane
      ? {
          headline: open.step === 'fields' && open.isNew ? t.blocks.insert : title,
          headlineId: headingId,
          beforeClose,
          opener: trigger.current,
          keepFocus: open.step === 'row',
          onBlur: () => steps.current.end(),
          actions:
            open.step === 'row' || open.live ? undefined : (
              <>
                <Button onClick={() => (open.step === 'fields' ? save(open.type) : saveSection())}>
                  {open.step === 'fields' && open.isNew ? t.blocks.insert : t.common.save}
                </Button>
                <Button kind="outlined" onClick={() => void leave()}>
                  {t.common.cancel}
                </Button>
              </>
            ),
          children: (
            <div className="mo-editor-block-dialog-fields">
              {open.step === 'row' ? rowFields : open.step === 'section' ? sectionSettings : blockFields}
            </div>
          ),
        }
      : null,
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
                  icon={materialIcon('swap_vert')}
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
              className="mo-keep mo-editor-block-dialog-search"
            />
            {shownGroup && (
              <div className="mo-keep mo-editor-block-dialog-filters">
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
                  <ListItem
                    key={b.type}
                    icon={b.icon}
                    headline={b.label}
                    supporting={b.hint}
                    onClick={() => (b.type === IMAGE ? done({ type: IMAGE, props: {} }) : pick(b.type))}
                  />
                )),
              ])}
              {!offered.length && <EmptyNote item>{t.blocks.noneHere}</EmptyNote>}
              {offered.length > 0 && !found.length && (
                <EmptyNote item>{query.trim() ? t.blocks.noneNamed(query.trim()) : t.common.noMatch}</EmptyNote>
              )}
            </SheetList>
          </>
        )}
        {look === 'sheet' && open?.step === 'row' && <SheetBody>{rowFields}</SheetBody>}
        {open?.step === 'alt' && (
          <>
            <SheetBody>
              <img src={safeImageSrc(shownAt(String(values.src ?? '')))} alt="" className="mo-editor-block-dialog-image" />
              <FieldList fields={altFields} value={values} onChange={(v) => setValues(v as BlockProps)} />
            </SheetBody>
            <SheetActions
              cancel={open.mode === 'new' ? t.media.altSkip : undefined}
              onCancel={() => (open.mode === 'new' ? done(SKIPPED) : void leave())}
              onDone={saveAlt}
              done={t.common.save}
            />
          </>
        )}
      </BottomSheet>
      {look === 'subpage' && ((block && open?.step === 'fields') || open?.step === 'section') && (
        // A block's fields (or a section's settings) on a compact window: a page of the editor over the form, as the crop view is (editor.css .mo-editor-block-page): the top app
        // bar with the back arrow and the block's name, the fields, and Save (Insert) in the bottom sheet. Back (the arrow, Esc, the browser's
        // back) with changes asks "Keep your changes?"; the form under it stays as it was.
        <dialog
          ref={pageDialog}
          className="mo-editor-block-page"
          tabIndex={-1}
          aria-labelledby={headingId}
          onCancel={(e) => {
            if (e.target !== e.currentTarget) return;
            e.preventDefault();
            void leave();
          }}
        >
          <TopAppBar>
            <div className="mo-editor-block-dialog-bar">
              <IconButton icon="arrow_back" label={t.common.backTo(back || t.forms.text)} onClick={() => void leave()} />
              <h1 id={headingId} className="mo-truncate mo-editor-block-dialog-title">
                {title}
              </h1>
            </div>
          </TopAppBar>
          <main className="mo-editor-block-page-main">
            <div className="mo-editor-block-dialog-fields">{open.step === 'section' ? sectionSettings : blockFields}</div>
          </main>
          <ActionSheet label={t.common.saveChanges}>
            <div className="mo-editor-block-dialog-actions">
              <Button kind="filled" onClick={() => (open.step === 'section' ? saveSection() : save(open.type))}>
                {open.step === 'fields' && open.isNew ? t.blocks.insert : t.common.save}
              </Button>
            </div>
          </ActionSheet>
        </dialog>
      )}
      {pane.portal}
      {pageAsk && (
        <FieldPageSheet
          key={pageAsk.title + pageAsk.value}
          field={pageAsk.field}
          value={pageAsk.value}
          title={pageAsk.title}
          onPick={(v) => {
            pageAsk.end(v);
            setPageAsk(null);
          }}
          onClosed={() => {
            pageAsk.end(null);
            setPageAsk(null);
          }}
        />
      )}
    </>
  );
  return [asker, element];
}
