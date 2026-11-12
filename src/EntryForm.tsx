// One blog post or page: its fields and its text, and "Save", which saves the file as a commit.
// Only what was changed is written: untouched fields keep their exact text, and the body is only
// rewritten by Milkdown when the text was edited (packages/editor/scripts/editor-roundtrip.mjs checks that this
// gives the same page). A new address (Adresse) moves the page or post, with a redirect from the
// old one (addresses.ts). The files in "Files" the page newly refers to get the page's tags in the same commit (autoTags.mjs).
// An earlier version (Versions.tsx) is opened as changes that are not saved,
// at the address the page or post has now. Its preview draft says whether it is a post (post, for the lead).
// The form's sections are listed as "on this page" in a card at the end of the form (large and wider only): SectionList in ui.tsx;
// which are open and the one in view: formSections.ts. A page's title and its H1 (the first heading of its text) are
// written together while they are the same (titleH1.mjs).
import { useEffect, useMemo, useRef, useState } from 'react';
import { slugify, slugOf, type Field, type MarkdownCollection } from './schema';
import { config, frontLeads, headingLooks, sectionLooks, sharing, standardPages, standardPaths } from '@site/editor';
import { apps, asWritten, placeOf, standardPageAt } from './site';
import { ConflictError, type Change, type RepoFile } from './github';
import { addressOf, moveRedirects, REDIRECTS, retarget } from './addresses';
import { changesOf, flatten, readAll, REDIRECT_FILES, setRedirect } from './redirectData';
import { TAB_ROUTES } from './Redirects';
import { choose } from './ask';
import { freeTitle } from '../lib/freeTitle.mjs';
import { offeredTemplatesOf, shownTemplate, templateFieldOf } from './templateField';
import { templateOf, templateWritten } from '../lib/page-template.mjs';
import { booleanRead, booleanWrite, readFields, splitFrontmatter, writeFields } from './frontmatter.mjs';
import MarkdownEditor, { type MarkdownHandle } from './MarkdownEditor';
import { useBlockDialog } from './BlockDialog';
import { blockHtml } from '../lib/blocks.mjs';
import { sectionBlocks } from './blocks';
import { looksOf, pageH1 } from './sections.mjs';
import { h1FromTitle, titleFromH1 } from './titleH1.mjs';
import { useFormSections } from './formSections';
import { sectionsWithFields } from './formSectionList.mjs';
import { publicPath, shownAt, useUploads } from './images';
import { filerAddresses, useMediaPicker } from './Media';
import { autoTagChanges, newlyUsed } from './autoTags.mjs';
import { recordsIn } from './fileRecords.mjs';
import { inUse, problemAt } from './check';
import { isOver, untilTime } from '../lib/notice.mjs';
import { splitPicture } from '../lib/crop.mjs';
import { asStandardTemplate, blockProblems, notOffered, siteBlocks } from './registry';
import { FieldInput, Fields, useWrongField, WrongField, type FieldContext } from './fields';
import { SearchPreview } from './SearchPreview';
import { searchedAs } from './googleResult.mjs';
import {
  atLeastNow,
  CheckList,
  FoldSection,
  FormColumns,
  LoadingIndicator,
  type NavigationItem,
  SectionList,
  SectionPane,
  SharePreview,
  useInView,
} from './ui';
import FormFrame, { savedStatus, useSavedAt } from './FormFrame';
import {
  clean,
  discard as discardWaiting,
  saveDraft,
  migrateScheduled,
  versionsOf,
  schedule,
  timeOf,
  draftPath,
  isDraftPage,
  published as isPublished,
  publish as publishPage,
  unpublish as unpublishPage,
} from '../lib/versions.mjs';
import { commitChanges } from './pageVersions.mjs';
import { isPagePath } from '../lib/autosave.mjs';
import { entryName, untouched } from '../lib/entryNames.mjs';
import { loadAutosave, restorable } from './autosave.mjs';
import { useAutosave, type AutosaveState } from './useAutosave';
import VersionSwitch, { WaitingNotice } from './VersionSwitch';
import { activeApps, versionSwitchOf } from './apps';
import { usePagePreview } from './pagePreview';
import { migrateStatus } from '../lib/status.mjs';
import { when } from './when';
import { savedOn, VersionList, VersionNotice, WithVersions, type ShownVersion } from './Versions';
import type { Env } from './App';
import { kindAndName, savedText } from './deploy';
import { siteT, siteText, t } from './i18n';
import { firstPicture, SEO_FIELDS, seoInputOf, seoRating, SHARE_FIELDS, sharedAs, type SeoCheck } from './seo';

// "Page settings" (a post's "Post settings"), the first section: the status (Draft, Published, Scheduled and the time
// for Scheduled), a page's title (its name in the lists and the menu; its H1 is in its text) and the template (Field.offered).
// A post's title is its H1, written above its text: at the top of "Content", as a heading of a collection that has one.
const TOP = ['title', 'heading'];
const STATUS = ['status', 'publishAt'];
// Under their own headings at the bottom: the Google texts, the keywords and the canonical address; then the picture, title
// and description when the page is shared.
const SEO = SEO_FIELDS;
const SHARE = SHARE_FIELDS;
// The sections of the form, under each other on one page, each folding in and out under its heading (FoldSection in
// ui.tsx): the settings (open from the start on a tablet or computer; folded on a phone, so the text is in reach), the
// text (open from the start), the other fields, those for search engines, those for social media, and the earlier
// versions (folded from the start, so the page is short; nothing is remembered till the next time). Its list (an "on
// this page" card at the end of the form, on large and wider screens only) opens one and scrolls to it, and marks the
// one in view. A field that keeps the form from being saved has its section opened and is scrolled to (FieldInput in
// fields.tsx).
type Section = 'settings' | 'content' | 'other' | 'seo' | 'share' | 'versions';
const sectionOf = (collection: MarkdownCollection, path: string): Section => {
  const name = path.split('.')[0];
  const settings =
    STATUS.includes(name) ||
    (!!collection.blocks && name === 'title') ||
    collection.fields.some((f) => f.name === name && f.offered === 'templates');
  return settings ? 'settings' : TOP.includes(name) ? 'content' : SEO.includes(name) ? 'seo' : SHARE.includes(name) ? 'share' : 'other';
};
// The section the next page or post opened starts at: "Search engines" when it is opened from "SEO rating"
// (SeoScores.tsx), else the text.
let opening: Section | null = null;
export const openAtSeo = () => {
  opening = 'seo';
};
// The fields of a section (the other fields are those of none of the others); in the settings the status first (narrow,
// Field.narrow), with its time, then the title.
const inSection = (collection: MarkdownCollection, id: Section) => (f: Field) => sectionOf(collection, f.name) === id;
const FIRST = [...STATUS, 'title'];
const rank = (f: Field) => (FIRST.includes(f.name) ? FIRST.indexOf(f.name) : FIRST.length);
const fieldsIn = (collection: MarkdownCollection, id: Section) =>
  collection.fields.filter(inSection(collection, id)).sort((a, b) => rank(a) - rank(b));

// A new file starts as a Draft (nothing goes live by accident); a blog post gets today's date; a page has the blocks its template
// starts it with (Template.start), e.g. "Book an appointment" at the end like the other pages, but not one that
// is turned off (off, "Block settings").
export const newMarkdown = (collection: MarkdownCollection, off: string[] = []): RepoFile => ({
  path: '',
  oid: '',
  text:
    collection.id === 'blog'
      ? `---\ndate: ${new Date().toLocaleDateString('sv')}\nstatus: "draft"\n---\n`
      : `---\nstatus: "draft"\n---\n${(collection.template?.start ?? [])
          .filter((type) => !off.includes(type))
          .map((type) => `\n${blockHtml(type)}\n`)
          .join('')}`,
});

// The address of a saved page or post: a page's own `path`, or else /<file name>/ (packages/editor/site/content.ts).
// '' for a new one.
// Where the redirects are, as the menu has it: "Content" › "Redirects" › "All redirects".
const redirectsPath = () => [placeOf('redirects'), t.common.parts.redirects, t.redirects.all].filter(Boolean).join(' › ');

function addressNow(collection: MarkdownCollection, file: RepoFile, data: Record<string, unknown>) {
  if (!file.path) return '';
  return (collection.id === 'pages' && data.path ? String(data.path) : '') || `/${slugOf(file.path, collection.folder)}/`;
}

function valuesOf(collection: MarkdownCollection, file: RepoFile): Record<string, unknown> {
  // A stored `unlisted` is read as published with `noindex` (lib/status.mjs); the next save writes that.
  const data = migrateStatus(readFields(splitFrontmatter(file.text).yaml));
  return Object.fromEntries(
    collection.fields.map((f) => {
      const v = data[f.name];
      if (f.name === 'path') return [f.name, addressNow(collection, file, data)];
      if (f.type === 'boolean') return [f.name, booleanRead(v, f.missing)];
      if (f.multiple) return [f.name, Array.isArray(v) ? v.map(String) : []];
      return [f.name, v == null ? '' : String(v)];
    }),
  );
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// The values as they are saved: a field only in use with another's value (Field.only: "Time" with
// "Scheduled") is empty without it, so it leaves the file; a switch that is on when its key is missing (Field.missing)
// leaves the file when it is on (booleanWrite); a field of the theme's templates (Field.offered) leaves it for the theme's
// default, `offered` (templateWritten).
const inForm = (fields: Field[], values: Record<string, unknown>, offered: string[]) =>
  Object.fromEntries(
    fields.map((f) => [
      f.name,
      !inUse(f, fields, values)
        ? ''
        : f.offered === 'templates'
          ? templateWritten(values[f.name], offered)
          : f.type === 'boolean'
            ? booleanWrite(values[f.name], f.missing)
            : values[f.name],
    ]),
  );

type Props = { collection: MarkdownCollection; file: RepoFile; env: Env };

// The form starts again with an earlier version, or with the one saved now.
export default function EntryForm(props: Props) {
  return (
    <WithVersions notify={props.env.notify}>
      {(version, onVersion) => <Form {...props} version={version} onVersion={onVersion} />}
    </WithVersions>
  );
}

function Form({
  collection,
  file,
  env,
  version,
  onVersion,
}: Props & { version: ShownVersion | null; onVersion: (v: ShownVersion | null) => void }) {
  // The page file as last loaded or saved (the live version, or a draft's), and its waiting version in src/drafts/ if it has one
  // (lib/versions.mjs). The form edits the waiting version when there is one.
  const [live, setLive] = useState(file);
  const [waiting, setWaiting] = useState<RepoFile | null>(() =>
    file.path ? (env.files.find((f) => f.path === draftPath(file.path)) ?? null) : null,
  );
  // The file as last loaded or saved; what the form compares with and writes on top of.
  const [base, setBase] = useState<RepoFile>(() => (waiting ? { ...file, text: waiting.text } : file));
  // Where the page or post is: a draft (or new), published, or published with changes waiting.
  const livePublished = !!live.path && isPublished(live.text);
  const state = !livePublished ? 'draft' : waiting ? 'waiting' : 'published';
  // The switch between the live page and the waiting changes: an installed app's (slot `versionSwitch`), else the core's.
  const Switch = versionSwitchOf(apps, activeApps(env.files)) ?? VersionSwitch;
  // Which version the form edits while changes wait: they (`waiting`), or the live page (`live`, to fix a mistake on it).
  const [editing, setEditing] = useState<'waiting' | 'live'>('waiting');
  const editsLive = editing === 'live' && !!waiting;
  // Starts again after changes were discarded: the text editor takes the text of the version it goes back to.
  const [era, setEra] = useState(0);
  // The text of an autosave put back when the page opened: the text editor starts with it (only in the era it was put back in).
  const [restoredBody, setRestoredBody] = useState<{ era: number; body: string } | null>(null);
  const eraNow = useRef(0);
  eraNow.current = era;
  const parts = useMemo(() => splitFrontmatter(base.text), [base]);
  const initial = useMemo(() => valuesOf(collection, base), [collection, base]);
  // An earlier version: its fields and text, at the address there is now.
  const [shown] = useState(() => version && splitFrontmatter(version.text));
  const [values, setValues] = useState(() =>
    version ? { ...valuesOf(collection, { ...base, text: version.text }), path: initial.path } : initial,
  );
  const [bodyChanged, setBodyChanged] = useState(() => !!shown && shown.body !== parts.body);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const text = useRef<MarkdownHandle>(null);
  // Where the page or post is on the site now.
  const url = String(initial.path);
  // Which of the site's blocks to put in the text, and their fields (pages only).
  // What can be put in: what the template allows, but not the blocks turned off under
  // "Block settings", nor those of an app not installed (those already in the text stay, and are
  // checked by the template alone when saved).
  const off = useMemo(() => notOffered(env.files), [env.files]);
  // A page chosen as a standard page ("Settings" › "Appearance" › "Default pages", packages/editor/defaults/standardPages.ts) has its
  // rules too (the blog page has "Blog posts"). The front page is written as it looks: the heading, text and picture of a
  // block as the text above its card (its lead), and its top ("Hero") first.
  const paths = standardPaths(env.files.find((f) => f.path === config.standardPages)?.text);
  const standard = url ? standardPages.find((p) => paths[p.key] === url) : undefined;
  const front = standard?.key === 'front';
  const template = useMemo(() => asStandardTemplate(collection.template, standard), [standard, collection]);
  const insertable = useMemo(
    () =>
      off.length ? { ...template, blocks: (template?.blocks ?? siteBlocks.map((b) => b.type)).filter((t) => !off.includes(t)) } : template,
    [off, template],
  );
  const [blockAsk, blockDialog] = useBlockDialog(
    useMemo(() => (front ? sectionBlocks(siteBlocks, frontLeads) : undefined), [front]),
    {
      lists: env.lists,
      testimonials: env.testimonials,
      site: env.site,
      relations: env.relations,
      path: url,
      // A standard page's blocks drawn as the theme draws them there (its editor/previews.tsx, by `<file>#<key>`).
      ...(standard ? { page: { file: `${config.standardPages}#${standard.key}`, values } } : {}),
    },
    insertable,
  );
  // When the file was last saved, shown in the top bar.
  const [savedAt, setSavedAt] = useSavedAt(env, file.path);

  const isNew = !live.path;
  // The templates the theme chosen offers, for the field `offered: 'templates'.
  const offered = useMemo(() => offeredTemplatesOf(env.files), [env.files]);
  const asSaved = useMemo(() => inForm(collection.fields, values, offered), [collection, values, offered]);
  const was = useMemo(() => inForm(collection.fields, initial, offered), [collection, initial, offered]);
  const changed = collection.fields.filter((f) => !same(asSaved[f.name], was[f.name]));
  const dirty = bodyChanged || changed.length > 0;

  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }));
  const notify = env.notify;
  // A page's title and its H1 (the first heading of its text, firstHeading.mjs) are written together while they are the
  // same or one of them is empty (titleH1.mjs): the title typed writes the H1 (a new one at the top of a text without), and
  // the H1 typed, pasted or undone writes the title. A page whose title is not its H1 keeps both. `title`: the title now,
  // also between a change and the next render, so the H1 written from it does not write it back.
  const title = useRef(String(values.title ?? ''));
  title.current = String(values.title ?? '');
  const onTitle = (typed: string) => {
    const before = title.current;
    title.current = typed;
    set('title', typed);
    const h1 = collection.blocks ? text.current?.h1() : undefined;
    // Only while the text has nothing but its H1 and blocks: a title typed never writes over text that is there.
    const next = h1 === undefined || !text.current?.bare() ? null : h1FromTitle(before, h1, typed);
    if (next != null) text.current?.setH1(next);
  };
  const onH1 = (now: string | null, before: string | null) => {
    const next = titleFromH1(title.current, before, now);
    if (next == null) return;
    title.current = next;
    set('title', next);
  };
  // A form that cannot be saved: why, as a message, and the field marked (useWrongField in fields.tsx), with its section
  // opened first (unfold, below).
  const wrongField = useWrongField(
    (text) => notify({ text, error: true }),
    (path) => unfold(sectionOf(collection, path)),
  );
  // The form's name, in the top bar and over the sections list (the "on this page" card, on large and wider screens).
  const formTitle = isNew ? collection.create! : String(initial.title || collection.singular);
  // Whether the form draws a field at all (field(), below): a section with none is not offered, in no list.
  const fieldShown = (f: Field) =>
    f.name !== 'status' &&
    f.name !== 'publishAt' &&
    inUse(f, collection.fields, values) &&
    !(f.name === 'title' && collection.blocks && isNew) &&
    !(f.offered && !templateFieldOf(f, env.files));
  const withFields = sectionsWithFields(collection.fields, (name) => sectionOf(collection, name), fieldShown);
  const has = (id: Section) => withFields.has(id);
  const post = collection.id === 'blog';
  const sections: NavigationItem[] = [
    ...(has('settings') ? [{ id: 'settings', label: post ? t.forms.sections.postSettings : t.forms.sections.pageSettings }] : []),
    { id: 'content', label: t.forms.sections.content },
    ...(has('other') ? [{ id: 'other', label: t.forms.otherFields }] : []),
    ...(has('seo') ? [{ id: 'seo', label: t.forms.seo }] : []),
    ...(has('share') ? [{ id: 'share', label: t.forms.share }] : []),
    ...(isNew ? [] : [{ id: 'versions', label: t.history.versions }]),
  ];
  const shows = (id: Section) => sections.some((s) => s.id === id);
  // The sections: which are open, at first the text, and the settings above it from a tablet up (on a phone they start
  // folded, so the text is in reach: its H1 writes the title), and "Search engines" when it is opened at it, `opening`;
  // the one in view, marked in the sections list; a tap there opens one and scrolls to it (formSections.ts).
  const [start] = useState<Section[]>(() => [
    ...(atLeastNow('medium') ? ['settings' as const] : []),
    'content',
    ...(opening === 'seo' ? ['seo' as const] : []),
  ]);
  const { section, steer, unfold, goTo, pick, sectionProps } = useFormSections<Section>(sections, start);
  const textBox = useRef<HTMLDivElement>(null);
  // Opened from "SEO rating" (SeoScores.tsx): straight to "Search engines" (open from the start, `open`).
  useEffect(() => {
    if (opening !== 'seo') return;
    opening = null;
    if (shows('seo')) goTo('seo');
  }, []);
  // The field marked as wrong is scrolled to by itself (FieldInput), its section opened (useWrongField) and marked in the
  // sections list.
  useEffect(() => {
    if (wrongField.field) steer(sectionOf(collection, wrongField.field.path));
  }, [wrongField.field?.at]);

  // The SEO rating at the top of "Search engines" (seo.ts), again with every change of a field while that is open and near
  // the screen (`seoBox`, what is in the section, is hidden while it is folded); the same for the preview of a shared link
  // at the top of "Social media" (its first picture in the text). The text is read from the editor when one of them is
  // opened or comes near the screen, and while it is there a moment after the text was last changed: not on every
  // keystroke, nor while they are folded or out of view (then the rating keeps what it had; it is worked out once from
  // the start, so it does not move what is under it when it comes into view).
  const seoBox = useRef<HTMLDivElement>(null);
  const seoNear = useInView(seoBox, '200px');
  const shareBox = useRef<HTMLDivElement>(null);
  const shareNear = useInView(shareBox, '200px');
  const textNear = seoNear || shareNear;
  const near = useRef(textNear);
  near.current = textNear;
  const [body, setBody] = useState(() => shown?.body ?? parts.body);
  const readBody = () => setBody(text.current?.markdown() ?? shown?.body ?? parts.body);
  const reading = useRef(0);
  useEffect(() => {
    if (textNear && bodyChanged) readBody();
  }, [textNear]);
  useEffect(() => () => clearTimeout(reading.current), []);
  // Autosave (src/useAutosave.ts): what is written is kept by the Worker (R2 caching) and moved to git when the form is left or idle: a
  // published page's changes as its waiting version, a draft page as the page file itself (it has no live version to protect, and stays a
  // draft whatever the text says), and a NEW page or post, which has no file yet, as a draft page file made then (`create`), named
  // `New page` until the H1 (a post's title) says another, and renamed with it (`to`). Not the live page being edited, an earlier version
  // or a new address. With R2 caching off the Worker says so and nothing is kept until `Save`, as before.
  const typedAddress = addressOf(String(values.path ?? ''), post ? 'post' : 'page');
  // The key of a new entry's autosave: a file name that never exists, so two new pages in two tabs do not overwrite each other.
  const [placeholder] = useState(() => `${collection.folder}/new-entry-${Math.random().toString(36).slice(2, 10)}.md`);
  // A draft made by autosave from a new entry in this form: until the address is written by hand, its name follows the H1.
  const [followsH1, setFollowsH1] = useState(false);
  const ownNames = useMemo(
    () =>
      new Set(
        env.files
          .filter((f) => f.path.startsWith(`${collection.folder}/`) && f.path.endsWith('.md'))
          .map((f) => slugOf(f.path, collection.folder))
          .filter((name) => !name.includes('/')),
      ),
    [env.files, collection],
  );
  const fileName = live.path ? slugOf(live.path, collection.folder) : '';
  // What the entry is called now (a new one, or a draft that follows the H1): the title, the file name, and whether the name is by hand.
  const target = entryName({
    create: collection.create ?? collection.singular,
    title: String(values.title ?? ''),
    typed: typedAddress && (isNew || typedAddress !== url) ? (typedAddress.split('/').at(-2) ?? '') : '',
    taken: (name) => name !== fileName && ownNames.has(name),
    slugify,
  });
  const targetPath = `${collection.folder}/${target.name}.md`;
  const autosaves =
    !version &&
    (isNew
      ? isPagePath(placeholder)
      : !editsLive &&
        (livePublished || !!waiting || isDraftPage(live.text)) &&
        isPagePath(live.path) &&
        (!typedAddress || typedAddress === url));
  // The text of the version as `Save` writes it, or null when it cannot be saved now.
  function autosaveText(): string | null {
    const given = isNew ? { ...values, title: target.title } : values;
    if (problemAt(collection.fields, given)) return null;
    const saved = inForm(collection.fields, given, offered);
    const written = (isNew ? collection.fields.filter((f) => !same(saved[f.name], []) && f.type !== 'readonly') : changed).filter(
      (f) => f.name !== 'path',
    );
    // A new page whose address was written by hand, and is not its file name, has it as its own `path` (as `Save` writes it).
    const own = isNew && !post && target.byHand && typedAddress !== `/${target.name}/` ? { path: typedAddress } : {};
    const yaml = writeFields(isNew ? '' : parts.yaml, { ...Object.fromEntries(written.map((f) => [f.name, saved[f.name]])), ...own });
    const markdown = bodyChanged ? text.current?.markdown() : null;
    const body = markdown == null ? parts.body : `\n${markdown.trim()}\n`;
    if (blockProblems(body, template, front ? frontLeads : undefined)[0]) return null;
    const next = `---\n${yaml}\n---\n${body}`;
    // A picture added is kept in the browser until `Save` uploads it, so a text with one cannot be kept elsewhere yet.
    return pictures.usedIn(next).length ? null : next;
  }
  // A new page nobody wrote in (or written in and erased again) is as the form opened it: nothing is kept and no file is made.
  const isUntouched = () =>
    untouched({
      changed: changed.filter((f) => f.name !== 'title' || String(values.title ?? '').trim() !== '').map((f) => f.name),
      bodyChanged,
      bare: text.current?.bare() ?? true,
      h1: text.current?.h1() ?? null,
      markdown: text.current?.markdown() ?? '',
      start: parts.body,
    });
  // The file the Worker made or moved, or the waiting version it made: taken as it is now, so the next `Save` does not clash with it.
  async function takeFlushed(wrote?: string) {
    try {
      if (isNew || (wrote && wrote !== live.path)) {
        const [file] = await env.load([wrote ?? live.path]);
        if (!file?.text) return;
        const was = live.path;
        const oldUrl = url;
        const taken = { ...file, path: file.path };
        // A new entry got the title it was written with (`New page`), as the file has it.
        const titled = isNew && !String(values.title ?? '').trim() ? target.title : null;
        if (titled) title.current = titled;
        setLive(taken);
        setBase((b) => ({ ...b, path: taken.path, oid: taken.oid }));
        if (isNew) setFollowsH1(!target.byHand);
        // The address in the form follows the file (a page's is its file name, until another is written).
        setValues((v) => ({
          ...v,
          ...(titled && !String(v.title ?? '').trim() ? { title: titled } : {}),
          path: String(v.path ?? '') === oldUrl || !v.path ? addressNow(collection, taken, {}) : v.path,
        }));
        env.onSaved(taken, { files: [], removed: was ? [was] : [] });
        autosave.touch();
        return;
      }
      if (isDraftPage(live.text) && !waiting) {
        const [file] = await env.load([live.path]);
        if (!file?.text) return;
        setLive(file);
        env.onSaved(file, { files: [], removed: [] });
        return;
      }
      const [file] = await env.load([draftPath(live.path)]);
      if (!file?.text) return;
      setWaiting(file);
      env.onSaved(live, { files: [file], removed: [] });
    } catch {}
  }
  const autosave = useAutosave({
    on: autosaves,
    path: isNew ? placeholder : live.path,
    dirty,
    text: autosaveText,
    flushed: takeFlushed,
    make: () =>
      isNew
        ? { create: true, to: targetPath }
        : followsH1 && !livePublished && !waiting && !target.byHand && targetPath !== live.path
          ? { to: targetPath }
          : {},
    skip: () => isNew && isUntouched(),
  });
  // A page opened with changes the Worker kept (the tab was closed, or the editor reloaded): put back, unless git's version is newer.
  useEffect(() => {
    if (!autosaves || isNew) return;
    const start = eraNow.current;
    let alive = true;
    void (async () => {
      const stored = await loadAutosave(live.path);
      if (!stored || !alive) return;
      const gitPath = waiting?.path ?? live.path;
      const at = await env.savedAt([gitPath]).then(
        (times) => times[gitPath],
        () => undefined,
      );
      if (!alive || eraNow.current !== start || !restorable(stored, base.text, at)) return;
      const file = { ...base, text: stored.text };
      setValues({ ...valuesOf(collection, file), path: initial.path });
      setRestoredBody({ era: start + 1, body: splitFrontmatter(stored.text).body });
      setEra(start + 1);
      setBodyChanged(true);
      setBody(splitFrontmatter(stored.text).body);
      notify({ text: t.forms.versions.autosave.restored });
      autosave.touch();
    })();
    return () => {
      alive = false;
    };
  }, []);
  // A field changed.
  useEffect(() => {
    if (dirty) autosave.touch();
  }, [values]);
  const onText = () => {
    setBodyChanged(true);
    autosave.touch();
    if (!near.current) return;
    clearTimeout(reading.current);
    reading.current = window.setTimeout(readBody, 600);
  };
  const lastRating = useRef<SeoCheck[] | null>(null);
  const rating = useMemo(
    () => (seoNear || !lastRating.current ? seoRating(seoInputOf(values, body, post, env.relations)) : lastRating.current),
    [seoNear, post, body, values, env.relations],
  );
  lastRating.current = rating;
  // The link as it is shared: as Base.astro writes it, from a page's H1 (pageH1) or a post's title, and its picture
  // (a post's "Picture at the top", else the first in the text; a page has its pictures in its text, and the front page shows
  // the site's picture, as Home.astro).
  const shared = {
    title: (!post && pageH1(body).heading) || String(values.title ?? ''),
    front,
    seoTitle: String(values.seoTitle ?? ''),
    seoDescription: String(values.seoDescription ?? ''),
    description: String(values.description ?? ''),
    site: sharing,
  };
  const card = sharedAs({
    ...shared,
    shareTitle: String(values.shareTitle ?? ''),
    shareDescription: String(values.shareDescription ?? ''),
    shareImage: String(values.shareImage ?? ''),
    image: front ? undefined : String(values.image ?? '') || firstPicture(body),
  });
  // The Google result (SearchPreview), at the address the page or post has now: the one typed in "URL" or, for a new
  // one without, /<title>/, as "Save" works it out; the front page is at /.
  const result = searchedAs(shared);
  const resultPath = front
    ? '/'
    : addressOf(String(values.path ?? ''), post ? 'post' : 'page') || (isNew ? `/${slugify(String(values.title ?? ''))}/` : url);

  // A picture is kept in the browser until "Save", which uploads it with the page. A file in "Files" the page refers to
  // now and did not in its last saved version (a picture, a PDF field, a link) gets the page's tags at "Save" (autoTags.mjs).
  const tagged = collection.fields.some((f) => f.name === 'categories' && f.type === 'relation' && f.to === 'categories');
  const pictures = useUploads(notify);
  const [pickImage, picker] = useMediaPicker(env.media, pictures);

  const fields: FieldContext = {
    relations: env.relations,
    lists: env.lists,
    testimonials: env.testimonials,
    site: env.site,
    pickImage,
    // A page's address, for what is shown on it (a button that opens a promotion); a new one has none yet.
    page: collection.id === 'pages' && url ? url : undefined,
  };

  // A new page or post without a title is called "New page", "New page 2" … (in the editor's language, `target`, above).
  const named = () => (isNew && !String(values.title ?? '').trim() ? { ...values, title: target.title } : values);

  // A new page or post whose title another file has: a dialog with the next free title (freeTitle.mjs), which the owner
  // may change; a title that is taken too is answered with the next free one. null: "Cancel". `also`: a title the
  // server says is taken, which this browser did not know.
  async function otherTitle(title: string, loaded: RepoFile[], also?: string) {
    const used = (candidate: string) => {
      const free = slugify(candidate);
      return (
        candidate === also ||
        !!env.taken(`/${free}/`, loaded) ||
        env.files.some((f) => f.path.startsWith(`${collection.folder}/`) && slugOf(f.path, collection.folder) === free)
      );
    };
    let proposal = freeTitle(title, used);
    let text = t.forms.entry.titleTakenText(post);
    for (;;) {
      const answer = await choose({
        title: t.forms.entry.titleTakenTitle,
        text,
        input: { label: t.forms.entry.titleLabel, value: proposal },
        choices: [{ value: 'save', label: t.common.save }],
      });
      if (!answer) return null;
      const chosen = answer.text.trim();
      if (!slugify(chosen)) text = t.forms.entry.titleNeedsLetters;
      else if (!used(chosen)) return chosen;
      else {
        proposal = freeTitle(chosen, used);
        text = t.forms.entry.titleStillTaken;
      }
    }
  }

  // The title the owner chose in that dialog, written to the form (and a page's H1), and the save made again with it.
  function saveTitled(
    chosen: string,
    values: Record<string, unknown>,
    intent: 'save' | 'publish' | 'schedule',
    at: string,
  ): Promise<unknown> {
    onTitle(chosen);
    return save(undefined, { ...values, title: chosen }, intent, at);
  }

  // `other`: an address chosen in the dialog for a taken one (below), saved instead of the one typed.
  // `intent` 'publish': also puts it on the website (a draft is published, waiting changes replace the live version);
  // 'schedule': keeps it as a waiting version that goes live at `at` (Danish time, "2026-11-20T08:00").
  async function save(other?: string, values = named(), intent: 'save' | 'publish' | 'schedule' = 'save', at = ''): Promise<unknown> {
    if (wrongField.stop(problemAt(collection.fields, values))) return;
    // A standard page is on the site: it cannot be a draft or wait for its time.
    if (
      standard &&
      (asSaved.status === 'draft' || asSaved.status === 'scheduled') &&
      wrongField.stop({ text: t.forms.entry.standardPage(siteText(standard.label), standardPageAt(standard.key)), path: 'status' })
    )
      return;
    const slug = slugify(values.title as string);
    if (isNew && !slug) return notify({ text: t.forms.entry.titleNeedsLetters, error: true });
    // The address: the one typed, or for a new one /<title>/. A post's is its file name; a page's
    // is its file name too when new, and its own `path` when that is another.
    // A draft made by autosave whose name follows the H1 and has not caught up yet moves to its name now, with no redirect (it was never
    // on the site), and the file moves with it.
    const renaming =
      followsH1 &&
      !isNew &&
      !livePublished &&
      !waiting &&
      !version &&
      !target.byHand &&
      intent !== 'schedule' &&
      other === undefined &&
      targetPath !== live.path;
    const typed = addressOf(other ?? (renaming ? `/${target.name}/` : String(values.path ?? '')), post ? 'post' : 'page');
    const address = typed || (isNew ? `/${slug}/` : url);
    const moved = !isNew && address !== url;
    if (moved && intent === 'schedule') return notify({ text: t.forms.versions.scheduleWithAddress, error: true });
    // A new address takes its redirect at once, so it cannot wait with the changes: they are published or discarded first.
    if (moved && waiting) return notify({ text: t.forms.versions.addressWaiting, error: true });
    const name = post || isNew || renaming ? address.split('/').at(-2)! : slugOf(base.path, collection.folder);
    const path = isNew || renaming || (post && moved) ? `${collection.folder}/${name}.md` : base.path;
    // A new page or post, or a new address: not where another page is, or an address the site sends on
    // elsewhere (the files of the redirects as they are now, redirectData.ts).
    let loaded: RepoFile[] = [];
    if (isNew || (moved && !renaming))
      try {
        loaded = await env.load(REDIRECT_FILES);
      } catch (e) {
        return notify({ text: t.forms.entry.redirectsNotLoaded((e as Error).message), error: true });
      }
    const reason = isNew || (moved && !renaming) ? env.taken(address, loaded) : null;
    // An address the site sends on elsewhere: the owner is told where to, and chooses to remove the redirect
    // (saved with the page) or another address.
    const freeing = !!reason?.redirect;
    if (reason?.redirect) {
      const { name, via } = reason.redirect;
      const answer = await choose({
        title: t.forms.entry.takenTitle(address),
        text: t.forms.entry.takenText(address, name, via, post),
        choices: [
          { value: 'free', label: t.forms.entry.freeAndSave },
          { value: 'other', label: t.forms.entry.pickOther },
        ],
      });
      if (!answer) return;
      if (answer.choice === 'other') {
        const next = await choose({
          title: t.forms.entry.otherTitle,
          text: t.forms.entry.otherText(post),
          input: { label: t.forms.address, value: address },
          choices: [{ value: 'save', label: t.common.save }],
        });
        const chosen = next && addressOf(next.text, post ? 'post' : 'page');
        if (!next) return;
        if (!chosen) return notify({ text: t.forms.writeAddress, error: true });
        set('path', chosen);
        return save(chosen);
      }
    } else if (reason && isNew && !typed) {
      const chosen = await otherTitle(String(values.title), loaded);
      return chosen ? saveTitled(chosen, values, intent, at) : undefined;
    } else if (reason)
      return notify({
        text: t.forms.entry.taken(reason.text, !!typed, post),
        error: true,
      });

    if (
      path !== base.path &&
      env.files.some(
        (f) => f.path !== base.path && slugOf(f.path, collection.folder) === name && f.path.startsWith(`${collection.folder}/`),
      )
    ) {
      if (isNew && !typed) {
        const chosen = await otherTitle(String(values.title), loaded);
        return chosen ? saveTitled(chosen, values, intent, at) : undefined;
      }
      return notify({ text: t.forms.entry.fileExists(name), error: true });
    }

    // A new file gets all its filled-in fields in the order of the form; an existing one only the changed. As saved:
    // the values given (a new one without a title has its name, "New page 1", named()), not only those in the form.
    const saved = inForm(collection.fields, values, offered);
    const written = (isNew ? collection.fields.filter((f) => !same(saved[f.name], []) && f.type !== 'readonly') : changed).filter(
      (f) => f.name !== 'path',
    );
    const own = !post && ((moved && !renaming) || (isNew && address !== `/${name}/`)) ? { path: address } : {};
    const yaml = writeFields(isNew ? '' : parts.yaml, { ...Object.fromEntries(written.map((f) => [f.name, saved[f.name]])), ...own });
    const markdown = bodyChanged ? text.current?.markdown() : null;
    if (isNew && !markdown?.trim()) {
      goTo('content', textBox.current);
      return notify({ text: t.forms.entry.empty(post), error: true });
    }
    const body = markdown == null ? parts.body : `\n${markdown.trim()}\n`;
    // The blocks in the text by their own fields and the template, as the site checks them before it is built.
    const [wrongBlock] = blockProblems(body, template, front ? frontLeads : undefined);
    if (wrongBlock) {
      goTo('content', textBox.current);
      return notify({ text: wrongBlock, error: true });
    }
    let next = `---\n${yaml}\n---\n${body}`;

    // The redirects (redirectData.ts): a freed address no longer sends on (those that went on through it
    // first go straight to where it sent them), the old address sends on to the new one, the new
    // address is the page's (the editor's own redirect from it goes), and none sends on through another.
    let redirectChanges: Change[] = [];
    if (isNew || (moved && !renaming)) {
      let all = readAll(loaded);
      if (freeing) {
        const flat = flatten(all);
        if (typeof flat === 'string') return notify({ text: flat, error: true });
        all = setRedirect(flat, address, null);
      }
      const own = moveRedirects(all.own, moved ? url : null, address);
      if (typeof own === 'string') return notify({ text: own, error: true });
      const flat = flatten({ ...all, own });
      if (typeof flat === 'string') return notify({ text: flat, error: true });
      redirectChanges = changesOf(flat, loaded);
    }
    // The links to the old address everywhere, and the posts picked in the blocks on the pages (by their file name).
    const others: RepoFile[] = [];
    if (moved) {
      next = retarget(next, url, address);
      const was = slugOf(base.path, collection.folder);
      for (const f of env.files) {
        if (f.path === base.path || f.path === REDIRECTS || !/\.(md|json)$/.test(f.path)) continue;
        let changedText = retarget(f.text, url, address);
        if (post && f.path.startsWith(`${config.folders.pages}/`)) changedText = pickedRenamed(changedText, was, name);
        if (changedText !== f.text) others.push({ ...f, text: changedText });
      }
    }
    // A published page's `Save`, and `Schedule`, keep the changes as a waiting version (so does `Save` on a draft that has one);
    // `Publish`, and a draft's `Save`, write the page file.
    const scheduling = intent === 'schedule';
    const viaDraft = scheduling || (!isNew && !moved && !version && !editsLive && intent === 'save' && (livePublished || !!waiting));
    // Writing the page file from the waiting version (published now) takes its file away.
    const foldWaiting = !!waiting && !viaDraft && intent === 'publish';
    // A page on the stored status Scheduled (an older site) becomes a draft when it is scheduled again.
    const legacy = scheduling && !isNew ? migrateScheduled({ path: live.path, text: live.text })[0] : undefined;
    const legacyText = legacy ? (legacy.text ?? '') : undefined;
    if (intent === 'publish') next = clean(next);
    if (intent === 'save' && next === base.text && !moved && !redirectChanges.length) {
      setBodyChanged(false);
      return notify({ text: t.forms.nothingToSave });
    }
    // Pictures that were added and are still used.
    const used = pictures.usedIn(next);
    const removed = base.path && path !== base.path ? [base.path] : [];
    // The page's tags to the files in "Files" it newly refers to (the text as last saved against the text now), in the same commit.
    const recordChanges = tagged
      ? autoTagChanges(
          recordsIn(env.files, config.fileRecords),
          config.fileRecords,
          newlyUsed(isNew ? '' : intent === 'publish' ? live.text : base.text, next, [
            ...new Set([...filerAddresses(env.files), ...used.map((u) => publicPath(u.path))]),
          ]),
          Array.isArray(saved.categories) ? (saved.categories as string[]) : [],
        )
      : [];
    // The waiting version: the text of the form without `status`, with the time it already has.
    const waitingPath = viaDraft ? draftPath(isNew ? path : live.path) : '';
    const asDraft = (text: string) =>
      saveDraft({ path: isNew ? path : live.path, text, drafts: waiting ? { waiting: waiting.text } : {} }, next)[0].text ?? '';
    const draftText = viaDraft ? asDraft(isNew ? next : live.text) : '';
    const waitingText =
      viaDraft && scheduling
        ? (schedule({ path: isNew ? path : live.path, text: next, drafts: { waiting: draftText } }, at)[0].text ?? '')
        : draftText;
    const changes: Change[] = viaDraft
      ? [
          { path: waitingPath, content: waitingText, oid: waiting?.oid || null },
          // A new page is made, as a draft, with its waiting version; one on the stored Scheduled becomes a draft.
          ...(isNew ? [{ path, content: next, oid: null }] : []),
          ...(legacyText !== undefined ? [{ path: live.path, content: legacyText, oid: live.oid || null }] : []),
          ...used.map((u) => ({ path: u.path, content: u.bytes, oid: null })),
        ]
      : [
          { path, content: next, oid: path === base.path ? live.oid || null : null },
          ...removed.map((p) => ({ path: p, content: null, oid: live.oid })),
          ...(foldWaiting && waiting ? [{ path: waiting.path, content: null, oid: waiting.oid }] : []),
          ...others.map((f) => ({ path: f.path, content: f.text, oid: f.oid })),
          ...redirectChanges,
          ...used.map((u) => ({ path: u.path, content: u.bytes, oid: null })),
          ...recordChanges,
        ];
    const what = `"${slugOf(path, collection.folder)}"`;
    const singular = asWritten(collection).singular;
    const message = moved
      ? siteT.forms.commit.move(asWritten(collection).singular, url, address)
      : scheduling
        ? siteT.forms.versions.commit.schedule(singular, what, at.replace('T', ' '))
        : viaDraft
          ? siteT.forms.versions.commit.saveChanges(singular, what)
          : intent === 'publish'
            ? siteT.forms.versions.commit.publish(singular, what)
            : isNew
              ? siteT.forms.commit.create(asWritten(collection).create!, what)
              : version
                ? siteT.history.commit.restoreVersion(`${asWritten(collection).singular} ${what}`, savedOn(version))
                : siteT.forms.commit.editOne(asWritten(collection).singular, what);
    const entry = kindAndName(collection.singular, String(values.title ?? '').trim() || name);
    const change = moved
      ? t.app.changes.moved(entry, address)
      : intent === 'publish'
        ? t.forms.versions.published(entry)
        : isNew
          ? t.app.changes.created(entry)
          : version
            ? t.app.changes.restored(entry)
            : t.app.changes.edited(entry);
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      // A waiting version changes nothing on the website, so it is not waited for; a new page file is made too.
      const oids = await env.commit(message, changes, change, !viaDraft || isNew || legacyText !== undefined);
      if (viaDraft) {
        // Kept as a waiting version: the page file, and so the website, is as it was.
        const draft = { path: waitingPath, oid: oids[waitingPath], text: waitingText };
        const kept = isNew
          ? { path, oid: oids[path], text: next }
          : legacyText !== undefined
            ? { ...live, oid: oids[live.path], text: legacyText }
            : live;
        pictures.markSaved(used);
        setLive(kept);
        setWaiting(draft);
        setBase({ ...kept, text: waitingText });
        setValues(valuesOf(collection, { ...kept, text: waitingText }));
        setBodyChanged(false);
        setSavedAt(new Date());
        env.onSaved(kept, { files: [draft], removed: [] });
        notify({ text: scheduling ? t.forms.versions.savedScheduled(timeText(at)) : t.forms.versions.savedWaiting });
        return true;
      }
      const saved = { path, oid: oids[path], text: next };
      setLive(saved);
      if (intent === 'publish') setFollowsH1(false);
      if (foldWaiting) setWaiting(null);
      pictures.markSaved(used);
      setBase(saved);
      setValues(valuesOf(collection, saved));
      setBodyChanged(false);
      setSavedAt(new Date());
      env.onSaved(saved, {
        files: [
          ...others.map((f) => ({ ...f, oid: oids[f.path] })),
          // The editor's own redirects are among its files (the others are loaded when needed).
          ...redirectChanges
            .filter((c) => c.path === REDIRECTS)
            .map((c) => ({ path: REDIRECTS, oid: oids[REDIRECTS], text: String(c.content) })),
          ...recordChanges
            .filter((c) => typeof c.content === 'string')
            .map((c) => ({ path: c.path, oid: oids[c.path], text: String(c.content) })),
        ],
        removed: [...removed, ...(foldWaiting && waiting ? [waiting.path] : [])],
      });
      notify({ text: savedText(change), kind: 'saved' });
      // The version is now the one saved: the form as usual again.
      if (version) onVersion(null);
      // A new address: the owner is told, in a dialog that stays until it is closed, that the old one now
      // sends on to it, and where the redirects are.
      if (moved && !renaming) {
        void choose({
          title: t.forms.entry.movedTitle,
          text: t.forms.entry.movedText(address, url, post, redirectsPath()),
          choices: [
            { value: 'ok', label: t.forms.entry.ok },
            { value: 'see', label: t.forms.entry.seeRedirects },
          ],
          cancel: false,
        }).then((seen) => seen?.choice === 'see' && (location.hash = TAB_ROUTES.redirects));
      }
      return true;
    } catch (e) {
      // The server has a file with that name that this browser did not know: the same dialog as for a title it knows.
      if (e instanceof ConflictError && e.exists && isNew && !typed) {
        const chosen = await otherTitle(String(values.title), loaded, String(values.title));
        if (chosen) {
          setSaving(false);
          return saveTitled(chosen, values, intent, at);
        }
        return;
      }
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  // What the page or post is called in messages and commits.
  const nameForMessages = () => {
    const what = `"${slugOf(live.path, collection.folder)}"`;
    const entry = kindAndName(collection.singular, String(initial.title ?? '').trim() || slugOf(live.path, collection.folder));
    return { what, entry, singular: asWritten(collection).singular };
  };
  // Saves the files of an action that is not a save of the form (`Unpublish`, `Discard draft`) and keeps what the form holds in step.
  async function act(message: string, changes: Change[], change: string, onSite: boolean, done: (oids: Record<string, string>) => void) {
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, changes, change, onSite);
      done(oids);
      setSavedAt(new Date());
      notify({ text: onSite ? savedText(change) : change, ...(onSite ? { kind: 'saved' as const } : {}) });
      return true;
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }
  // `Publish`: what is unsaved goes with it.
  async function publishNow() {
    // The live version changed after the waiting changes were saved: publishing replaces it, so the owner is asked first.
    if (waiting && livePublished && (await liveChangedAfter())) {
      const answer = await choose({
        title: t.forms.versions.overwriteTitle,
        text: t.forms.versions.overwriteText(post),
        choices: [{ value: 'publish', label: t.forms.versions.publish }],
      });
      if (!answer) return;
    }
    return save(undefined, named(), 'publish');
  }
  // Whether the page file was saved after the waiting version (when each was last saved; not known: no).
  async function liveChangedAfter() {
    if (!waiting) return false;
    try {
      const at = await env.savedAt([live.path, waiting.path]);
      const [l, w] = [at[live.path], at[waiting.path]];
      return !!l && !!w && l > w;
    } catch {
      return false;
    }
  }
  // `Unpublish`: the page file becomes a draft; changes that wait stay.
  async function unpublishNow() {
    if (standard) return notify({ text: t.forms.versions.standardPage, error: true });
    const answer = await choose({
      title: t.forms.versions.unpublishTitle(post),
      text: t.forms.versions.unpublishText(post),
      choices: [{ value: 'unpublish', label: t.forms.versions.unpublish }],
    });
    if (!answer) return;
    const { what, entry, singular } = nameForMessages();
    const changes = commitChanges(unpublishPage({ path: live.path, text: live.text, drafts: waiting ? { waiting: waiting.text } : {} }), [
      live,
    ]);
    await act(siteT.forms.versions.commit.unpublish(singular, what), changes, t.forms.versions.unpublished(entry), true, (oids) => {
      const saved = { path: live.path, oid: oids[live.path], text: String(changes[0].content) };
      setLive(saved);
      if (!waiting) {
        setBase(saved);
        setValues(valuesOf(collection, saved));
      }
      env.onSaved(saved, { files: [], removed: [] });
    });
  }
  // `Discard draft`: the waiting version goes, and the form is the page on the website again.
  async function discardNow() {
    if (!waiting) return;
    const answer = await choose({
      title: t.forms.versions.discardTitle,
      text: t.forms.versions.discardText(nameForMessages().entry),
      choices: [{ value: 'discard', label: t.forms.versions.discardDraft }],
    });
    if (!answer) return;
    const { what, entry, singular } = nameForMessages();
    const changes = commitChanges(discardWaiting({ path: live.path, text: live.text, drafts: { waiting: waiting.text } }), [live, waiting]);
    await act(siteT.forms.versions.commit.discard(singular, what), changes, t.forms.versions.discarded(entry), false, () => {
      setWaiting(null);
      setEditing('waiting');
      setBase(live);
      setValues(valuesOf(collection, live));
      setBodyChanged(false);
      setBody(splitFrontmatter(live.text).body);
      setEra((n) => n + 1);
      env.onSaved(live, { files: [], removed: [waiting.path] });
    });
  }
  // The switch: edits the live page or the waiting changes; what is unsaved is asked about first.
  async function switchTo(id: string) {
    const to = id === 'live' ? 'live' : 'waiting';
    if (!waiting || to === (editsLive ? 'live' : 'waiting')) return;
    if (dirty) {
      const answer = await choose({
        title: t.forms.versions.switchTitle,
        text: t.forms.versions.switchText,
        choices: [{ value: 'switch', label: t.forms.versions.switchAction }],
      });
      if (!answer) return;
    }
    const shownFile = to === 'live' ? live : { ...live, text: waiting.text };
    setEditing(to);
    setBase(shownFile);
    setValues(valuesOf(collection, shownFile));
    setBodyChanged(false);
    setBody(splitFrontmatter(shownFile.text).body);
    setEra((n) => n + 1);
  }
  // When the waiting version goes live, if it has a time.
  const scheduledAt = waiting ? timeOf(waiting.text) : undefined;
  // `Schedule`: a date and a time to pick; what is unsaved is saved as the waiting version with it.
  async function scheduleNow() {
    const answer = await choose({
      title: t.forms.versions.scheduleTitle,
      text: t.forms.versions.scheduleText(post),
      input: { label: t.forms.versions.scheduleTime, value: scheduledAt ?? '', type: 'datetime' },
      choices: [{ value: 'schedule', label: t.forms.versions.schedule }],
    });
    if (!answer) return;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(answer.text) || isOver(answer.text))
      return notify({ text: t.forms.versions.scheduleNeedsFuture, error: true });
    return save(undefined, named(), 'schedule', answer.text);
  }
  // `Cancel schedule`: the waiting version stays, without its time.
  async function cancelSchedule() {
    if (!waiting) return;
    const { what, entry, singular } = nameForMessages();
    const changes = commitChanges(schedule({ path: live.path, text: live.text, drafts: { waiting: waiting.text } }, null), [live, waiting]);
    await act(
      siteT.forms.versions.commit.cancelSchedule(singular, what),
      changes,
      t.forms.versions.scheduledCancelled(entry),
      false,
      (oids) => {
        const draft = { path: waiting.path, oid: oids[waiting.path], text: String(changes[0].content) };
        setWaiting(draft);
        env.onSaved(live, { files: [draft], removed: [] });
      },
    );
  }
  const scheduleRows = [
    { label: t.forms.versions.schedule, onClick: scheduleNow },
    ...(scheduledAt ? [{ label: t.forms.versions.cancelSchedule, onClick: cancelSchedule }] : []),
  ];
  const discardRow = waiting ? [{ label: t.forms.versions.discardDraft, onClick: discardNow }] : [];
  const publishBar = editsLive
    ? {
        onPublish: publishNow,
        actions: [...(dirty ? [] : [{ label: t.forms.versions.unpublish, onClick: unpublishNow }]), ...discardRow],
      }
    : state === 'draft'
      ? { label: t.forms.versions.publish, onPublish: publishNow, actions: [...scheduleRows, ...discardRow] }
      : {
          ...(state === 'waiting' || dirty ? { label: t.forms.versions.publish } : {}),
          onPublish: publishNow,
          actions: [...scheduleRows, ...(dirty ? [] : [{ label: t.forms.versions.unpublish, onClick: unpublishNow }]), ...discardRow],
        };

  // "Preview": the page or post with what is changed in the form; a new one, or one whose layout is changed in the
  // form (a field with `layout`, the template), in the page of another one of its kind saved with that layout, with
  // all of the form put in it (pagePreview.tsx).
  const [openPreview, previewSheet] = usePagePreview();
  const showPreview = () =>
    openPreview(() => {
      const layout = collection.fields.filter((f) => f.layout);
      const relaid = !isNew && changed.some((f) => f.layout);
      const sameLayout = (data: Record<string, unknown>) =>
        layout.every((f) =>
          f.offered === 'templates'
            ? templateOf({ template: data[f.name] }, offered) === templateOf({ template: values[f.name] }, offered)
            : f.type === 'boolean'
              ? booleanRead(data[f.name], f.missing) === (values[f.name] === true)
              : String(data[f.name] || '') === String(values[f.name] || ''),
        );
      const changes = (...names: string[]) => isNew || relaid || changed.some((f) => names.includes(f.name));
      const others =
        isNew || relaid
          ? env.files
              .filter((f) => f.path.startsWith(`${collection.folder}/`) && f.path.endsWith('.md') && f.path !== base.path)
              .map((f) => ({ f, data: readFields(splitFrontmatter(f.text).yaml) }))
              .filter(({ data }) => sameLayout(data))
              .map(({ f, data }) => addressNow(collection, f, data))
              .slice(0, 5)
          : [];
      const markdown = bodyChanged ? text.current?.markdown() : null;
      // A page's H1 is at the top of its text (pageH1); a blog post's is its title.
      const h1 = collection.blocks ? pageH1(markdown ?? parts.body) : undefined;
      return {
        shell: isNew || (relaid && others.length) ? others : url,
        heading: h1?.heading ?? (changes('title', 'heading') ? String(values.heading || named().title) : undefined),
        headingHtml: h1?.html,
        // A post has a picture field (a page has its pictures in its text); the preview splits only a post's lead.
        post: collection.fields.some((f) => f.name === 'image'),
        // A post's picture at the top.
        image:
          collection.fields.some((f) => f.name === 'image') && changes('image', 'imageAlt', 'imageDecorative')
            ? values.image
              ? { src: String(values.image), alt: values.imageDecorative === true ? '' : String(values.imageAlt ?? '') }
              : null
            : undefined,
        body: isNew || relaid || markdown != null ? (markdown ?? parts.body) : undefined,
        data: { lists: env.lists, testimonials: env.testimonials, site: env.site, relations: env.relations, path: url },
      };
    });

  // A post planned for a time gets that day as its date, so it comes out as the newest.
  const onChange = (f: Field, v: unknown) => {
    set(f.name, v);
    if (f.name === 'publishAt' && /^\d{4}-\d{2}-\d{2}T/.test(String(v)) && collection.fields.some((d) => d.name === 'date'))
      set('date', String(v).slice(0, 10));
  };
  // The fields in use (Field.only).
  // A field of the theme's templates (Field.offered) shows the options the theme offers, and while only one is left that
  // one, not changed here (templateFieldOf). A page's title writes its H1 (onTitle).
  const field = (f: Field) => {
    // Draft or published is no field: `Publish`, `Unpublish` and the status line say it (a stored `scheduled` is migrated with `Schedule`).
    if (f.name === 'status' || f.name === 'publishAt') return false;
    if (!inUse(f, collection.fields, values)) return false;
    // A new page has no title field: its H1 is its title, typed in the text (the field comes with the saved page).
    if (f.name === 'title' && collection.blocks && isNew) return false;
    const shown = f.offered ? templateFieldOf(f, env.files, values[f.name]) : f;
    if (!shown) return false;
    const value = f.offered ? shownTemplate(shown, values[f.name]) : values[f.name];
    const change = f.name === 'title' ? (v: unknown) => onTitle(String(v ?? '')) : (v: unknown) => onChange(f, v);
    return <FieldInput key={f.name} field={shown} value={value} onChange={change} />;
  };

  return (
    <Fields.Provider value={fields}>
      <WrongField.Provider value={wrongField.field}>
        <FormFrame
          title={formTitle}
          back={{ href: `#list/${collection.id}`, label: collection.label }}
          status={versionStatus({
            state,
            editsLive,
            scheduledAt,
            savedAt,
            saving,
            deleting,
            isNew,
            autosave: autosaves && dirty ? autosave.state : undefined,
          })}
          publish={publishBar}
          view={isNew ? undefined : url}
          dirty={dirty}
          saving={saving || deleting}
          deleting={deleting}
          onSave={() => save()}
          onPreview={showPreview}
          onDelete={collection.deletable && !isNew ? () => env.remove(collection, live, setDeleting) : undefined}
          deleteLabel={t.forms.deleteOne(collection.singular)}
          saveLabel={t.forms.versions.saveDraft}
        >
          {version && <VersionNotice version={version} onCurrent={() => onVersion(null)} />}
          {waiting && !isNew && (
            <>
              <Switch
                entry={{ path: live.path, collection: collection.id, title: String(initial.title ?? ''), post }}
                versions={versionsOf({ path: live.path, text: live.text, drafts: { waiting: waiting.text } })}
                editing={editsLive ? 'live' : 'waiting'}
                busy={saving || deleting}
                onEdit={(id) => void switchTo(id)}
                publish={() => publishNow()}
                schedule={(at) => (at === null ? cancelSchedule() : save(undefined, named(), 'schedule', at))}
                unpublish={unpublishNow}
                discard={() => discardNow()}
              />
              <WaitingNotice
                editsLive={editsLive}
                when={scheduledAt ? timeText(scheduledAt) : undefined}
                busy={saving || deleting}
                onDiscard={() => void discardNow()}
              />
            </>
          )}
          <FormColumns
            sticky
            main={
              <>
                {shows('settings') && (
                  <FoldSection {...sectionProps('settings')}>{fieldsIn(collection, 'settings').map(field)}</FoldSection>
                )}
                <FoldSection {...sectionProps('content')}>
                  {fieldsIn(collection, 'content').map(field)}
                  <div ref={textBox} className="scroll-mt-[calc(1rem+env(safe-area-inset-top))]">
                    <span className="mb-1 block font-medium">{t.forms.text}</span>
                    <MarkdownEditor
                      key={era}
                      ref={text}
                      value={(restoredBody?.era === era ? restoredBody.body : undefined) ?? shown?.body ?? parts.body}
                      onChange={onText}
                      addImage={pickImage}
                      blocks={collection.blocks ? blockAsk : undefined}
                      h1={!!collection.blocks}
                      startFocused={isNew}
                      onH1={collection.blocks ? onH1 : undefined}
                      sheet={blockAsk}
                      looks={
                        front
                          ? (items) =>
                              looksOf(items, { file: `${config.standardPages}#front`, leads: frontLeads, sectionLooks, headingLooks })
                          : undefined
                      }
                      sections={front}
                      frame
                    />
                  </div>
                </FoldSection>
                {shows('other') && <FoldSection {...sectionProps('other')}>{fieldsIn(collection, 'other').map(field)}</FoldSection>}
                {shows('seo') && (
                  <FoldSection {...sectionProps('seo')}>
                    <div ref={seoBox} className="space-y-6">
                      {rating.length > 0 && <CheckList title={t.forms.seoRating.title} items={rating} />}
                      <SearchPreview
                        domain={config.domain}
                        path={resultPath}
                        siteName={sharing.name}
                        title={result.title}
                        description={result.description}
                        date={post ? String(values.date ?? '') : undefined}
                        keyword={String(values.keyword ?? '')}
                      />
                      {fieldsIn(collection, 'seo').map(field)}
                    </div>
                  </FoldSection>
                )}
                {shows('share') && (
                  <FoldSection {...sectionProps('share')}>
                    <div ref={shareBox} className="space-y-6">
                      <SharePreview
                        image={shownAt(splitPicture(card.image).src)}
                        domain={config.domain}
                        title={card.title}
                        description={card.description}
                      />
                      {fieldsIn(collection, 'share').map(field)}
                    </div>
                  </FoldSection>
                )}
                {shows('versions') && (
                  <FoldSection {...sectionProps('versions')}>
                    <VersionList env={env} path={base.path} oid={base.oid} onPick={onVersion} />
                  </FoldSection>
                )}
              </>
            }
            pane={
              <SectionPane caption={t.forms.sections.title} title={formTitle}>
                <SectionList title={t.forms.sections.title} items={sections} value={section} onChange={pick} />
              </SectionPane>
            }
          />
        </FormFrame>
        {blockDialog}
        {picker}
        {previewSheet}
      </WrongField.Provider>
    </Fields.Provider>
  );
}

// A time as the owner reads it ("Nov 20 at 8:00 AM"), from the Danish time the file has.
const timeText = (local: string) => when(new Date(untilTime(local) ?? 0));

// The top bar's line under the title: what the page is on the website, and when it was last changed.
function versionStatus({
  state,
  editsLive,
  scheduledAt,
  savedAt,
  saving,
  deleting,
  isNew,
  autosave,
}: {
  state: 'draft' | 'published' | 'waiting';
  /** The live page is being edited while changes wait. */
  editsLive?: boolean;
  /** When the waiting version goes live ("2026-11-20T08:00"), if it has a time. */
  scheduledAt?: string;
  savedAt?: Date | null;
  saving: boolean;
  deleting?: boolean;
  isNew?: boolean;
  /** Changes to a page that can wait are not saved yet: how autosave is doing (useAutosave.ts). */
  autosave?: AutosaveState;
}) {
  if (deleting || saving) return savedStatus({ savedAt, saving, deleting, isNew });
  if (autosave === 'saving') return <LoadingIndicator>{t.forms.versions.autosave.saving}</LoadingIndicator>;
  if (autosave) return t.forms.versions.autosave[autosave];
  if (isNew) return savedStatus({ savedAt, saving, deleting, isNew });
  if (editsLive) return t.forms.versions.editingLive;
  if (scheduledAt && untilTime(scheduledAt) !== null) return t.forms.versions.scheduledLine(timeText(scheduledAt));
  if (state === 'draft') return t.forms.versions.draftLine;
  if (state === 'waiting') return t.forms.versions.waitingLine;
  return savedAt ? t.forms.versions.publishedLine(when(savedAt)) : undefined;
}

// A page's text with a post's new file name in its blocks with blog posts ("Blog posts", `picked`).
const pickedRenamed = (text: string, was: string, name: string) =>
  text.replace(/^<div data-block="posts".*$/gm, (line) => line.replaceAll(`&quot;${was}&quot;`, `&quot;${name}&quot;`));
