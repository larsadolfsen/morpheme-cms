// "Filer" under "Indhold": the pictures uploaded to the site (public/images/uploads/<year>/<month>/,
// imported or added in the editor, images.ts) and the PDFs, videos and zip files (public/filer/,
// /filer/ on the site), newest first, with search, the order (newest, oldest, by name), a month or year,
// the type (Billeder, PDF'er, Videoer, Zip-filer) and whether a page uses them (Gallery). A file that is
// not a picture is a square with its icon and name. Tapping one opens a sheet from the bottom with the
// file (FileView.tsx), its file name and where it is used, each a link to that page or post, or
// "Slet billede" (…) when nothing uses it (also not the site's own code, /editor/code-images.json). Its
// name, under the title, can be changed with the pencil after it (not one the site's code uses),
// saved with the tick: the file moves, the pages that use it get the new address in the same commit,
// and the old address sends on to it (addresses.ts). "+" uploads a new file, saved at once. The same
// pictures (not the other files) are the gallery a picture is chosen from in the forms (useMediaPicker).
// The clock in the top bar, "Slettede filer", opens the files that were deleted (Deleted.tsx).
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  ArrowsDownUp,
  CalendarBlank,
  Check,
  ClockCounterClockwise,
  PencilSimple,
  Plus,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { moveRedirects, REDIRECTS } from './addresses';
import { changesOf, flatten, readAll, REDIRECT_FILES } from './redirectData';
import { ask } from './ask';
import { dateName, headed, letterOf } from './Sheet';
import Screen from './Screen';
import {
  Button,
  InputChip,
  Choice,
  Filters,
  IconButton,
  TextField,
  listClass,
  SupportingText,
  SearchRow,
  useKept,
  BottomSheet,
  SheetTitle,
  SideSheet,
  useWide,
  EmptyNote,
  SheetBody,
  ListItem,
} from './ui';
import type { Env } from './App';
import type { RepoFile } from './github';
import { fixedName, slugify } from './schema';
import { config, siteName } from '@site/editor';
import { collections } from './site';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { fileKindOf, pickedKindOf, pickImage, prepareFile, prepareImage, publicPath, showMoved, shownAt, type Uploads } from './images';
import { fileIcons, FileView, KINDS, kindOf, type Kind } from './FileView';
import { kindAndName, savedText } from './deploy';
import { locale, siteT, t } from './i18n';

export const MEDIA = config.folders.media;

/** The folder of PDFs, videos and zip files (/filer/ on the site), when the site has one. */
export const FILES: string | undefined = (config.folders as { files?: string }).files;

/** The uploaded pictures among the files, newest first (by their folder, then name). */
export const mediaOf = (files: RepoFile[]) =>
  files.filter((f) => f.path.startsWith(`${MEDIA}/`)).sort((a, b) => b.path.localeCompare(a.path, locale));

/** The PDFs, videos and zip files among the files, by name. */
export const filesOf = (files: RepoFile[]) =>
  FILES
    ? files.filter((f) => f.path.startsWith(`${FILES}/`) && fileKindOf(f.path)).sort((a, b) => a.path.localeCompare(b.path, locale))
    : [];

// What a file that uses a picture or another file is called: a page's or post's title, a fixed page's name, an
// entry's as its list shows it (a pop-up); null for a file the editor does not open (the list of
// picture sizes, image-manifest.json).
function nameOf(file: RepoFile): string | null {
  for (const c of collections)
    if (c.kind === 'files') {
      const own = c.files.find((f) => f.file === file.path);
      if (own) return fixedName(own, file.text);
    } else if (c.kind === 'folder' && file.path.startsWith(`${c.folder}/`) && file.path.endsWith('.json')) {
      try {
        return c.summary(JSON.parse(file.text)) || fileName(file.path);
      } catch {
        return null;
      }
    }
  if ([config.folders.pages, config.folders.blog].some((d) => file.path.startsWith(`${d}/`)) && file.path.endsWith('.md'))
    return String(readFields(splitFrontmatter(file.text).yaml).title ?? file.path);
  return null;
}

// A picture's file name without its folder, and split from its ending ("foto", ".webp").
const fileName = (src: string) => src.split('/').pop() ?? '';
const stemOf = (src: string) => fileName(src).replace(/\.[^.]*$/, '');
const endingOf = (src: string) => fileName(src).slice(stemOf(src).length);

// A text with a picture's address changed to another: wherever it stands (Markdown, HTML, JSON), but
// not a longer file name that starts with it.
const readdress = (text: string, from: string, to: string) =>
  text.replace(new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'g'), to);

// The small copies of the pictures the site has (thumbnails.json, made when it is built), by their
// address; {} when they could not be asked (then the pictures themselves are shown).
let small: Promise<Record<string, string>> | null = null;
const thumbnails = () =>
  (small ??= fetch('/editor/thumbnails.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : {}))
    .catch(() => ({})));

// The nearest box around an element that scrolls (the sheet's), or null for the page.
function scrollerOf(el: Element) {
  for (let box = el.parentElement; box && box !== document.body; box = box.parentElement)
    if (/auto|scroll/.test(getComputedStyle(box).overflowY)) return box;
  return null;
}

// A picture in the grid, fetched only when it is about to be scrolled into view (a screen's height
// before), and as its small copy when there is one: a picture from this visit (shownAt) as it is,
// a renamed one by its old address. The picture itself, if the copy cannot be fetched.
function Thumb({ src, thumbs }: { src: string; thumbs: Record<string, string> | null }) {
  const ref = useRef<HTMLImageElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (!img || !('IntersectionObserver' in window)) return setNear(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setNear(true);
        observer.disconnect();
      },
      { root: scrollerOf(img), rootMargin: '100% 0px' },
    );
    observer.observe(img);
    return () => observer.disconnect();
  }, []);
  const shown = shownAt(src);
  const thumb = !failed && thumbs?.[shown];
  return (
    <img
      ref={ref}
      src={near && thumbs ? thumb || shown : undefined}
      alt=""
      decoding="async"
      className="editor-fade-in size-full object-cover transition-transform duration-(--motion-spatial-duration) ease-(--motion-ease) group-hover:scale-105"
      onLoad={(e) => e.currentTarget.setAttribute('data-loaded', '')}
      onError={() => thumb && setFailed(true)}
    />
  );
}

// A PDF, a video or a zip file in the grid: its icon and its name.
function FileTile({ src }: { src: string }) {
  const Icon = fileIcons[fileKindOf(src)!];
  return (
    <span className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center">
      <Icon size={36} className="shrink-0 text-muted" />
      <span className="line-clamp-2 text-xs break-all text-muted">{nameOfSrc(src)}</span>
    </span>
  );
}

// The pictures (and the other files) as squares, by their address on the site: three to four in a row
// on a phone, as many as there is room for on a computer. picked: the one shown beside the grid (Filer
// on a computer), marked.
function Grid({ srcs, picked, onPick }: { srcs: string[]; picked?: string | null; onPick: (src: string) => void }) {
  const [thumbs, setThumbs] = useState<Record<string, string> | null>(null);
  useEffect(() => void thumbnails().then(setThumbs), []);
  return (
    <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] md:gap-2">
      {srcs.map((src) => (
        <li key={src}>
          <button
            type="button"
            className={`group block aspect-square w-full overflow-hidden rounded-lg bg-tint ${src === picked ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}
            aria-label={nameOfSrc(src)}
            aria-pressed={picked === undefined ? undefined : src === picked}
            onClick={() => onPick(src)}
          >
            {fileKindOf(src) ? <FileTile src={src} /> : <Thumb src={src} thumbs={thumbs} />}
          </button>
        </li>
      ))}
    </ul>
  );
}

type Sort = 'new' | 'old' | 'name';
const SORTS: Sort[] = ['new', 'old', 'name'];
const SORT_KEY = 'editor-media-sort';
const nameOfSrc = (src: string) => src.split('/').pop()!;
// The month a picture was uploaded, as "2025-06" (its folder), or '' outside such a folder.
const monthOf = (src: string) => {
  const m = /\/(\d{4})\/(\d{2})\/[^/]+$/.exec(src);
  return m ? `${m[1]}-${m[2]}` : '';
};
/** The pictures with search, their order and the filters, and the month between them when they are
 * in the order of their dates, the first letter when by name. used: the files a page uses (Filer): then
 * the funnel opens a sheet with both filters, by use and by type. picked: the file shown beside it. */
function Gallery({
  srcs,
  used,
  picked,
  onPick,
}: {
  srcs: string[];
  used?: Set<string>;
  picked?: string | null;
  onPick: (src: string) => void;
}) {
  // All the files, not only pictures (Filer), with their type.
  const all = !!used;
  // In Filer, kept for coming back to it (from a file's page); in a picker, from the start each time.
  const [kind, setKind] = useKept<'' | Kind>(all ? 'filer-type' : null, '');
  const [query, setQuery] = useKept(all ? 'filer-soeg' : null, '');
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'new';
  });
  const [date, setDate] = useKept(all ? 'filer-dato' : null, '');
  const [use, setUse] = useKept<'' | 'used' | 'unused'>(all ? 'filer-brug' : null, '');

  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }

  // The years and months there are pictures from, newest first.
  const months = [...new Set(srcs.map(monthOf))].sort().reverse();
  const years = [...new Set(months.filter(Boolean).map((m) => m.slice(0, 4)))];
  // The types there are files of (and the one chosen); the filter by type only when there are two or more.
  const kinds = KINDS.filter((k) => k === kind || srcs.some((src) => kindOf(src) === k));
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = srcs
    .filter((src) => words.every((w) => nameOfSrc(src).toLowerCase().includes(w)))
    .filter((src) => !date || monthOf(src) === date || monthOf(src).startsWith(`${date}-`))
    .filter((src) => !use || used?.has(src) === (use === 'used'))
    .filter((src) => !kind || kindOf(src) === kind)
    .sort((a, b) =>
      sort === 'name'
        ? nameOfSrc(a).localeCompare(nameOfSrc(b), locale)
        : (sort === 'new' ? -1 : 1) * (monthOf(a).localeCompare(monthOf(b)) || nameOfSrc(a).localeCompare(nameOfSrc(b), locale)),
    );
  // By month in the order of the dates, by the first letter by name (headed, from HEADINGS_FROM).
  const groups = headed(shown, (src) => (sort === 'name' ? letterOf(nameOfSrc(src)) : monthOf(src)));
  const chips = [
    date && { label: dateName(date), clear: () => setDate('') },
    use && { label: use === 'used' ? t.media.inUse : t.common.notInUse, clear: () => setUse('') },
    kind && { label: t.media.kinds[kind].plural, clear: () => setKind('') },
  ].filter((c) => !!c);

  return (
    <div>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={all ? t.media.searchAll : t.media.searchLabel}
        sort={
          <Choice
            title={t.media.sort}
            icon={ArrowsDownUp}
            value={sort}
            options={SORTS.map((value) => ({ value, label: t.media.sorts[value] }))}
            onChange={pickSort}
          />
        }
        filter={
          all && (
            <Filters
              title={t.media.filter}
              selected={!!use || !!kind}
              groups={[
                {
                  title: t.media.use,
                  value: use,
                  options: [
                    { value: '', label: t.media.all },
                    { value: 'used', label: t.media.inUse },
                    { value: 'unused', label: t.common.notInUse },
                  ],
                  onChange: (v: string) => setUse(v as typeof use),
                },
                kinds.length > 1 && {
                  title: t.media.kind,
                  value: kind,
                  options: [
                    { value: '', label: t.media.allKinds },
                    ...kinds.map((value) => ({ value, label: t.media.kinds[value].plural })),
                  ],
                  onChange: (v: string) => setKind(v as typeof kind),
                },
              ].filter((g) => !!g)}
            />
          )
        }
        date={
          <Choice
            title={t.media.date}
            icon={CalendarBlank}
            value={date}
            selected={!!date}
            options={[
              { value: '', label: t.media.allDates },
              ...years.flatMap((year) => [
                { value: year, label: t.media.wholeYear(year), group: year },
                ...months.filter((m) => m.startsWith(`${year}-`)).map((m) => ({ value: m, label: dateName(m), group: year })),
              ]),
            ]}
            onChange={setDate}
          />
        }
      />
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <InputChip key={c.label} removeLabel={t.media.removeFilter(c.label)} onRemove={c.clear}>
              {c.label}
            </InputChip>
          ))}
        </div>
      )}
      {groups.map((g) => (
        <section key={g.key ?? 'all'} className="mt-4">
          {g.key !== null && <h2 className="mb-2 text-sm font-medium text-muted">{sort === 'name' ? g.key : dateName(g.key)}</h2>}
          <Grid srcs={g.items} picked={picked} onPick={onPick} />
        </section>
      ))}
      {!shown.length && <EmptyNote>{all ? t.media.noFiles : t.media.noPictures}</EmptyNote>}
    </div>
  );
}

/** Asks for a picture from the gallery, or a new one (kept with the form's pictures, images.ts, and
 * saved with it); its address on the site, or null. The sheet goes on top of a block's sheet. */
export function useMediaPicker(media: RepoFile[], pictures: Uploads): [() => Promise<string | null>, ReactElement] {
  const dialog = useRef<HTMLDialogElement>(null);
  const answer = useRef<(src: string | null) => void>(() => {});
  const srcs = [...new Set([...pictures.added, ...mediaOf(media)].map((f) => publicPath(f.path)))];

  const done = (src: string | null) => {
    answer.current(src);
    answer.current = () => {};
    dialog.current?.close();
  };
  const ask = () =>
    new Promise<string | null>((resolve) => {
      answer.current = resolve;
      dialog.current?.showModal();
    });

  const element = (
    <BottomSheet
      ref={dialog}
      aria-label={t.media.pick}
      onClose={(e) => e.target === e.currentTarget && done(null)}
      onClick={(e) => e.target === dialog.current && done(null)}
    >
      <SheetTitle title={t.media.pick} onClose={() => done(null)} />
      <SheetBody>
        <Button
          kind="outlined"

          wide
          icon={UploadSimple}
          onClick={async () => {
            const added = await pictures.upload();
            if (added) done(publicPath(added.path));
          }}
        >
          {t.media.uploadNew}
        </Button>
        <Gallery srcs={srcs} onPick={done} />
      </SheetBody>
    </BottomSheet>
  );
  return [ask, element];
}

// The pictures the site's own code uses (its design, e.g. the front page and a portrait), as it
// was built; null until known, or when it could not be asked (then nothing can be deleted).
let inCode: Promise<string[] | null> | null = null;
const codeImages = () =>
  (inCode ??= fetch('/editor/code-images.json')
    .then((r) => (r.ok ? (r.json() as Promise<string[]>) : null))
    .catch(() => null));

export default function Media({ files, env }: { files: RepoFile[]; env: Env }) {
  // The pictures and the other files.
  const pictures = [...mediaOf(files), ...filesOf(files)];
  const [code, setCode] = useState<string[] | null>(null);
  useEffect(() => void codeImages().then(setCode), []);
  // The addresses of the pictures some page, post or fixed page uses (its text has the address), or
  // the site's own code.
  const used = useMemo(() => {
    const texts = files
      .filter((f) => f.text && !f.path.startsWith(`${MEDIA}/`) && !(FILES && f.path.startsWith(`${FILES}/`)) && nameOf(f) !== null)
      .map((f) => f.text);
    return new Set(pictures.map((p) => publicPath(p.path)).filter((src) => code?.includes(src) || texts.some((t) => t.includes(src))));
  }, [files, code]);
  const dialog = useRef<HTMLDialogElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  // On a computer the file picked is beside the grid; on a phone in a sheet.
  const wide = useWide();
  const closeFile = () => {
    if (dialog.current?.open) dialog.current.close();
    else setSrc(null);
  };
  // The window gets wide or narrow (a phone turned) while a file is picked: it moves from the sheet to
  // the panel or back, and stays picked.
  const moving = useRef(false);
  useEffect(() => {
    if (!src) return;
    if (wide && dialog.current?.open) {
      moving.current = true;
      dialog.current.close();
    } else if (!wide && !dialog.current?.open) dialog.current?.showModal();
  }, [wide]);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState(false);
  // The name being changed: the field shown instead of the pencil after the name.
  const [editing, setEditing] = useState(false);
  // A new file, saved on its own at once (with a page, a picture is saved with the page instead): a
  // PDF, a video or a zip file as it is, a picture made ready as in the forms.
  async function add() {
    const file = await pickImage(!!FILES);
    if (!file) return;
    const kind = pickedKindOf(file);
    if (!kind && !file.type.startsWith('image/')) return env.notify({ text: t.media.notAFile, error: true });
    setAdding(true);
    if (!kind) env.notify({ text: t.media.preparing });
    try {
      const picture = kind
        ? await prepareFile(
            file,
            files.map((f) => f.path),
          )
        : await prepareImage(file);
      env.notify({ text: t.common.saving });
      const name = picture.path.split('/').pop()!;
      const change = t.app.changes.added(kindAndName(t.media.kinds[kind ?? 'picture'].word, name));
      const oids = await env.commit(
        siteT.media.commit.add(siteT.media.kinds[kind ?? 'picture'].word, name),
        [{ path: picture.path, content: picture.bytes, oid: null }],
        change,
      );
      env.onSaved({ path: picture.path, oid: oids[picture.path], text: '' });
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setAdding(false);
    }
  }

  // A file nothing uses, deleted at once in its own commit (after asking).
  async function remove(src: string) {
    const file = pictures.find((p) => publicPath(p.path) === src);
    if (!file || !(await ask(t.media.kinds[kindOf(src)].deleteAsk, t.common.delete))) return;
    setDeleting(true);
    env.notify({ text: t.common.deleting });
    try {
      const change = t.app.changes.deleted(kindAndName(t.media.kinds[kindOf(src)].word, fileName(src)));
      await env.commit(
        siteT.media.commit.delete(siteT.media.kinds[kindOf(src)].word, src.split('/').pop()!),
        [{ path: file.path, content: null, oid: file.oid }],
        change,
      );
      env.forget([file.path]);
      closeFile();
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.media.notDeleted((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setDeleting(false);
    }
  }

  // A new name for a picture, saved at once in one commit: the file under its new name (same folder
  // and ending), the old one deleted, the texts with its address changed and the redirect.
  async function rename(src: string) {
    const file = pictures.find((p) => publicPath(p.path) === src);
    const stem = slugify(name);
    if (!file || !stem || name === stemOf(src) || stem === stemOf(src)) return;
    const path = `${file.path.slice(0, file.path.lastIndexOf('/'))}/${stem}${endingOf(src)}`;
    const to = publicPath(path);
    if (files.some((f) => f.path === path)) return env.notify({ text: t.media.nameTaken, error: true });
    const texts = files
      .filter((f) => f.text && f.path !== REDIRECTS && !f.path.startsWith(`${MEDIA}/`) && f.text.includes(src))
      .map((f) => ({ ...f, text: readdress(f.text, src, to) }));
    setRenaming(true);
    env.notify({ text: t.common.saving });
    try {
      // The redirects (redirectData.ts): the old address sends on to the new one, and those that sent to
      // the old address send straight to the new one (no chain).
      const loaded = await env.load(REDIRECT_FILES);
      const all = readAll(loaded);
      const own = moveRedirects(all.own, src, to);
      if (typeof own === 'string') return env.notify({ text: own, error: true });
      const flat = flatten({ ...all, own });
      if (typeof flat === 'string') return env.notify({ text: flat, error: true });
      const redirectChanges = changesOf(flat, loaded);
      const moved = redirectChanges.filter((c) => c.path === REDIRECTS).map((c) => ({ path: REDIRECTS, oid: '', text: String(c.content) }));
      const bytes = await env.bytes(file.oid, shownAt(src));
      const change = t.app.changes.renamed(kindAndName(t.media.kinds[kindOf(src)].word, fileName(src)), fileName(to));
      const oids = await env.commit(
        siteT.media.commit.rename(siteT.media.kinds[kindOf(src)].word, fileName(src), fileName(to)),
        [
          { path, content: bytes, oid: null },
          { path: file.path, content: null, oid: file.oid },
          ...texts.map((f) => ({ path: f.path, content: f.text, oid: files.find((x) => x.path === f.path)!.oid })),
          ...redirectChanges,
        ],
        change,
      );
      showMoved(src, to);
      env.onSaved(
        { path, oid: oids[path], text: '' },
        { files: [...texts, ...moved].map((f) => ({ ...f, oid: oids[f.path] })), removed: [file.path] },
      );
      setSrc(to);
      setName(stem);
      setEditing(false);
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setRenaming(false);
    }
  }

  // The pages, posts and fixed pages whose text has the picture's address.
  const usedBy = src
    ? files.flatMap((f) => {
        const name = f.text.includes(src) && nameOf(f);
        return name ? [{ path: f.path, name }] : [];
      })
    : [];

  // What is shown about a file: its name (changed with the pencil), the file, where it is used and
  // "Slet". On a computer beside the grid (SideSheet), on a phone in the sheet.
  const details = (src: string) => (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          rename(src);
        }}
      >
        <label htmlFor="media-name" className="block font-medium">
          {t.media.name}
        </label>
        <div className="flex min-h-11 items-center gap-1">
          {editing ? (
            <>
              <TextField
                id="media-name"
                className="min-w-0 flex-1"
                value={name}
                autoFocus
                autoComplete="off"
                onChange={(e) => setName(e.target.value)}
              />
              <span className="mr-1 text-muted">{endingOf(src)}</span>
              <IconButton
                icon={X}
                label={t.common.cancel}
                onClick={() => {
                  setName(stemOf(src));
                  setEditing(false);
                }}
              />
              <IconButton
                type="submit"
                icon={Check}
                label={t.media.saveName}
                kind="filled"
                disabled={renaming || name === stemOf(src) || !slugify(name) || slugify(name) === stemOf(src)}
              />
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1 break-words text-muted">{fileName(src)}</span>
              {code && !code.includes(src) && (
                <IconButton icon={PencilSimple} label={t.media.kinds[kindOf(src)].rename} onClick={() => setEditing(true)} />
              )}
            </>
          )}
        </div>
        {editing && name !== stemOf(src) && slugify(name) && slugify(name) !== name && (
          <SupportingText className="mt-1">{t.media.savedAs(`${slugify(name)}${endingOf(src)}`)}</SupportingText>
        )}
      </form>
      <FileView src={shownAt(src)} name={fileName(src)} />
      <div>
        <p className="mb-1 font-medium">{t.media.usedOn}</p>
        {usedBy.length || code?.includes(src) ? (
          <ul className={listClass}>
            {usedBy.map((f) => (
              <ListItem key={f.path} href={`#${f.path}`} onClick={closeFile} headline={f.name} />
            ))}
            {code?.includes(src) && <ListItem tone="muted" headline={t.media.siteDesign} />}
          </ul>
        ) : (
          <p className="text-muted">{t.media.noPages}</p>
        )}
      </div>
      {code && !used.has(src) && (
        <Button kind="outlined" wide icon={Trash} disabled={deleting} onClick={() => remove(src)}>
          {deleting ? t.common.deleting : t.media.kinds[kindOf(src)].delete}
        </Button>
      )}
    </>
  );

  return (
    <Screen
      title={t.common.parts.media}
      wide
      back={{ href: '#', label: siteName }}
      actions={
        <>
          <IconButton
            icon={ClockCounterClockwise}
            label={t.history.deletedOf(t.history.files)}

            onClick={() => (location.hash = 'slettet/filer')}
          />
          <IconButton icon={Plus} label={t.media.add} disabled={adding} onClick={add} />
        </>
      }
    >
      <div className="md:flex md:items-start md:gap-6">
        <div className="min-w-0 flex-1">
          <Gallery
            srcs={pictures.map((p) => publicPath(p.path))}
            used={used}
            picked={wide ? src : undefined}
            onPick={(src) => {
              setSrc(src);
              setName(stemOf(src));
              setEditing(false);
              if (!wide) dialog.current?.showModal();
            }}
          />
        </div>
        {wide && src && (
          <SideSheet title={fileName(src)} onClose={closeFile}>
            {details(src)}
          </SideSheet>
        )}
      </div>
      <BottomSheet
        ref={dialog}
        onClose={(e) => {
          if (e.target !== e.currentTarget) return;
          if (moving.current) moving.current = false;
          else setSrc(null);
        }}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <SheetTitle title={src ? fileName(src) : ''} onClose={() => dialog.current?.close()} />
        {!wide && src && <SheetBody>{details(src)}</SheetBody>}
      </BottomSheet>
    </Screen>
  );
}
