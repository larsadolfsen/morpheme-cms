// "Files" under "Content": the images uploaded to the site (public/images/uploads/<year>/<month>/,
// imported or added in the editor, images.ts) and the PDFs, videos and zip files (the site's files folder, public/files/,
// /files/ on the site), newest first, with search, the order (newest, oldest, by name), a month or year,
// the type (Billeder, PDF'er, Videoer, Zip-filer) and whether a page uses them (Gallery). A file that is
// not an image is a square with its icon and name. Tapping one opens a sheet from the bottom with the
// file (FileView.tsx), its file name and where it is used, each a link to that page or post, or
// "Delete image" (…) when nothing uses it (also not the site's own code, /editor/code-images.json). Its
// name, under the title, can be changed with the pencil after it (not one the site's code uses),
// saved with the tick: the file moves, the pages that use it get the new address in the same commit,
// and the old address sends on to it (addresses.ts). The FAB uploads a new file, saved at once. The same
// images (not the other files) are the gallery an image is chosen from in the forms (useMediaPicker).
// The buttons that run (add, rename, delete, upload new) show the loading indicator while they do.
// The funnel in Filer also filters by a tag (fileTagFilter.mjs; only tags some file has).
// The clock in the top bar, "Deleted files", opens the files that were deleted (Deleted.tsx).
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ArrowsDownUp, CalendarBlank, Check, ClockCounterClockwise, PencilSimple, Trash, UploadSimple, X } from '@phosphor-icons/react';
import { moveRedirects, REDIRECTS } from './addresses';
import { changesOf, flatten, readAll, REDIRECT_FILES } from './redirectData';
import { ask } from './ask';
import { dateName, headed, letterOf } from './Sheet';
import { CreateFab } from './CreateFab';
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
  useAtLeast,
  EmptyNote,
  FilterChip,
  Notice,
  SheetBody,
  ListItem,
  type Pickable,
} from './ui';
import type { Env } from './App';
import type { RepoFile } from './github';
import { fixedName, slugify } from './schema';
import { config, siteName } from '@site/editor';
import { apps, collections } from './site';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { fileKindOf, pickedKindOf, pickImage, prepareFile, prepareImage, publicPath, showMoved, shownAt, type Uploads } from './images';
import { fileIcons, FileView, KINDS, kindOf, type Kind } from './FileView';
import MediaTags from './MediaTags';
import MediaProviderPicker from './MediaProviderPicker';
import { providerFile, trackProviderDownload, type MediaItem } from './mediaProviders';
import { activeApps, mediaProvidersOf } from './apps';
import { deleteRecord, recordsIn, renameRecord } from './fileRecords.mjs';
import { tagFilterOptions, tagIndex, withTag } from './fileTagFilter.mjs';
import { kindAndName, savedText } from './deploy';
import { locale, siteT, t } from './i18n';
import { settings } from '../site/settings';
import { useLongPress } from '@theme/ui/longPress';
import { useSelection } from './useSelection';
import SelectionBar from './SelectionBar';
import { mediaDeletion } from './mediaDelete.mjs';
import { AnyIcon } from './icon';
import { SiteChip } from './themeUi';

export const MEDIA = config.folders.media;

/** The folder of PDFs, videos and zip files (/files/ on the site; the site's setting, found when it is built). */
export const FILES: string = settings.filesFolder;

/** The uploaded images among the files, newest first (by their folder, then name). */
export const mediaOf = (files: RepoFile[]) =>
  files.filter((f) => f.path.startsWith(`${MEDIA}/`)).sort((a, b) => b.path.localeCompare(a.path, locale));

/** The PDFs, videos and zip files among the files, by name. */
export const filesOf = (files: RepoFile[]) =>
  FILES
    ? files.filter((f) => f.path.startsWith(`${FILES}/`) && fileKindOf(f.path)).sort((a, b) => a.path.localeCompare(b.path, locale))
    : [];

/** The addresses on the site of every file Filer lists: the images, then the PDFs, videos and zip files. */
export const filerAddresses = (files: RepoFile[]): string[] => [...mediaOf(files), ...filesOf(files)].map((f) => publicPath(f.path));

// What a file that uses an image or another file is called: a page's or post's title, a fixed page's name, an
// entry's as its list shows it (a pop-up); null for a file the editor does not open (the list of
// image sizes, image-manifest.json).
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

// An image's file name without its folder, and split from its ending ("foto", ".webp").
const fileName = (src: string) => src.split('/').pop() ?? '';
const stemOf = (src: string) => fileName(src).replace(/\.[^.]*$/, '');
const endingOf = (src: string) => fileName(src).slice(stemOf(src).length);

// A text with an image's address changed to another: wherever it stands (Markdown, HTML, JSON), but
// not a longer file name that starts with it.
const readdress = (text: string, from: string, to: string) =>
  text.replace(new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`, 'g'), to);

// The small copies of the images the site has (thumbnails.json, made when it is built), by their
// address; {} when they could not be asked (then the images themselves are shown).
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

// An image in the grid, fetched only when it is about to be scrolled into view (a screen's height
// before), and as its small copy when there is one: an image from this visit (shownAt) as it is,
// a renamed one by its old address. The image itself, if the copy cannot be fetched.
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
      <Icon size={36} className="shrink-0 text-on-surface-variant" />
      <span className="line-clamp-2 text-xs break-all text-on-surface-variant">{nameOfSrc(src)}</span>
    </span>
  );
}

/** What the grid needs of a selection (useSelection): whether it is selecting, which tiles are selected, and the marks a tile is found by. */
type TileSelection = ReturnType<typeof useSelection>;

// One square of the grid. It opens the file with a tap; where the grid can be selected, a long press with a touch (or Space on a
// focused tile) starts selecting, and a mouse shows a round mark at the tile's top-left corner on hover, on every tile once one
// is selected (Material's Selection page, the photo grid: an empty circle off, a filled one with a check on; the tile's own
// surface does not change). While selecting a tap or a click toggles the tile instead of opening it. The mark is drawn only
// by the theme's tokens, and is not a control of its own for the keyboard or a screen reader (the tile is: role=checkbox).
function Tile({
  src,
  thumbs,
  picked,
  onPick,
  selection,
}: {
  src: string;
  thumbs: Record<string, string> | null;
  picked?: string | null;
  onPick: (src: string) => void;
  selection?: TileSelection;
}) {
  const made = selection?.row(src);
  const row = made && 'selectable' in made ? made : undefined;
  const selecting = !!selection?.selecting;
  const selected = !!row?.selected;
  const press = useLongPress(row ? () => row.onSelectedChange?.() : undefined, selecting, row?.onSelectDrag);
  return (
    <li className={`group relative ${selecting ? 'select-none [-webkit-touch-callout:none]' : ''}`}>
      <button
        type="button"
        data-media-tile=""
        className={`block aspect-square w-full touch-manipulation overflow-hidden rounded-lg bg-surface-container-high ${src === picked && !selecting ? 'ring-offset-bg ring-2 ring-primary ring-offset-2' : ''}`}
        aria-label={nameOfSrc(src)}
        {...(selecting
          ? { role: 'checkbox', 'aria-checked': selected }
          : { 'aria-pressed': picked === undefined ? undefined : src === picked })}
        onClick={() => onPick(src)}
        {...press}
        {...(row ? { 'data-selection': row['data-selection'], 'data-selection-key': row['data-selection-key'] } : {})}
      >
        {fileKindOf(src) ? <FileTile src={src} /> : <Thumb src={src} thumbs={thumbs} />}
      </button>
      {row && (
        <span
          aria-hidden="true"
          data-tile-mark={selected ? 'on' : 'off'}
          className={`absolute top-0 left-0 flex size-12 items-center justify-center transition-opacity duration-(--motion-effects-duration) ease-(--motion-ease) ${
            selecting
              ? 'opacity-100'
              : 'pointer-events-none opacity-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100'
          }`}
          onClick={() => row.onSelectedChange?.()}
        >
          <span
            className={`flex size-6 items-center justify-center rounded-full ring-2 ring-surface ${
              selected ? 'bg-primary text-on-primary' : 'border-2 border-outline bg-surface'
            }`}
          >
            {selected && <AnyIcon name="check" size={16} />}
          </span>
        </span>
      )}
    </li>
  );
}

// The images (and the other files) as squares, by their address on the site: three to four in a row
// on a phone, as many as there is room for on a computer. picked: the one shown beside the grid (Filer
// on a computer), marked. selection: the grid's selection (Filer), see Tile.
function Grid({
  srcs,
  picked,
  onPick,
  selection,
}: {
  srcs: string[];
  picked?: string | null;
  onPick: (src: string) => void;
  selection?: TileSelection;
}) {
  const [thumbs, setThumbs] = useState<Record<string, string> | null>(null);
  useEffect(() => void thumbnails().then(setThumbs), []);
  return (
    <ul className="grid grid-cols-3 gap-1.5 medium:grid-cols-4 expanded:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] expanded:gap-2">
      {srcs.map((src) => (
        <Tile key={src} src={src} thumbs={thumbs} picked={picked} onPick={onPick} selection={selection} />
      ))}
    </ul>
  );
}

type Sort = 'new' | 'old' | 'name';
const SORTS: Sort[] = ['new', 'old', 'name'];
const SORT_KEY = 'editor-media-sort';
const nameOfSrc = (src: string) => src.split('/').pop()!;
// The month an image was uploaded, as "2025-06" (its folder), or '' outside such a folder.
const monthOf = (src: string) => {
  const m = /\/(\d{4})\/(\d{2})\/[^/]+$/.exec(src);
  return m ? `${m[1]}-${m[2]}` : '';
};
/** The images with search, their order and the filters, and the month between them when they are
 * in the order of their dates, the first letter when by name. used: the files a page uses (Filer): then
 * the funnel opens a sheet with the filters by use and by type, and by tag when tags is given (each file's
 * tags, from tagIndex) and some file has one of the tagOptions. picked: the file shown beside it. */
function Gallery({
  srcs,
  used,
  tags,
  tagOptions = [],
  picked,
  onPick,
  selection,
  onShown,
}: {
  srcs: string[];
  used?: Set<string>;
  tags?: Map<string, string[]>;
  tagOptions?: Pickable[];
  picked?: string | null;
  onPick: (src: string) => void;
  /** The grid's selection (Filer): its tiles can be selected. */
  selection?: TileSelection;
  /** Told the addresses shown, top to bottom, when they change (the selection's order of tiles). */
  onShown?: (srcs: string[]) => void;
}) {
  // All the files, not only images (Filer), with their type.
  const all = !!used;
  // In Filer, kept for coming back to it (from a file's page); in a picker, from the start each time.
  const [kind, setKind] = useKept<'' | Kind>(all ? 'files-type' : null, '');
  const [query, setQuery] = useKept(all ? 'files-search' : null, '');
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'new';
  });
  const [date, setDate] = useKept(all ? 'files-date' : null, '');
  const [use, setUse] = useKept<'' | 'used' | 'unused'>(all ? 'files-use' : null, '');
  const [tag, setTag] = useKept(all ? 'files-tag' : null, '');

  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }

  // The years and months there are images from, newest first.
  const months = [...new Set(srcs.map(monthOf))].sort().reverse();
  const years = [...new Set(months.filter(Boolean).map((m) => m.slice(0, 4)))];
  // The types there are files of (and the one chosen); the filter by type only when there are two or more.
  const kinds = KINDS.filter((k) => k === kind || srcs.some((src) => kindOf(src) === k));
  // The tags some file has (and the one chosen), for the filter by tag.
  const tagChoices = tags ? tagFilterOptions(tags, tagOptions, tag) : [];
  const withTagged = tags ? new Set(withTag(srcs, tags, tag)) : null;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = srcs
    .filter((src) => words.every((w) => nameOfSrc(src).toLowerCase().includes(w)))
    .filter((src) => !date || monthOf(src) === date || monthOf(src).startsWith(`${date}-`))
    .filter((src) => !use || used?.has(src) === (use === 'used'))
    .filter((src) => !kind || kindOf(src) === kind)
    .filter((src) => !withTagged || withTagged.has(src))
    .sort((a, b) =>
      sort === 'name'
        ? nameOfSrc(a).localeCompare(nameOfSrc(b), locale)
        : (sort === 'new' ? -1 : 1) * (monthOf(a).localeCompare(monthOf(b)) || nameOfSrc(a).localeCompare(nameOfSrc(b), locale)),
    );
  // By month in the order of the dates, by the first letter by name (headed, from HEADINGS_FROM).
  const groups = headed(shown, (src) => (sort === 'name' ? letterOf(nameOfSrc(src)) : monthOf(src)));
  const order = groups.flatMap((g) => g.items);
  const orderKey = order.join('\n');
  useEffect(() => onShown?.(order), [orderKey]);
  const chips = [
    date && { label: dateName(date), clear: () => setDate('') },
    use && { label: use === 'used' ? t.media.inUse : t.common.notInUse, clear: () => setUse('') },
    kind && { label: t.media.kinds[kind].plural, clear: () => setKind('') },
    tag && { label: tagOptions.find((o) => o.value === tag)?.label ?? tag, clear: () => setTag('') },
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
              selected={!!use || !!kind || !!tag}
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
                tagChoices.length > 0 && {
                  title: t.media.tagFilter,
                  value: tag,
                  options: [{ value: '', label: t.media.allTags }, ...tagChoices],
                  onChange: setTag,
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
      {selection?.selecting && (
        <div className="mt-3 flex">
          {/* Material's photo grid: a count with a cross above the grid; the cross, or the count, unselects all. */}
          <SiteChip
            kind="input"
            selected
            label={String(selection.count)}
            removeLabel={t.media.clearSelection(selection.count)}
            onRemove={selection.clear}
            onClick={selection.clear}
          />
        </div>
      )}
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
          {g.key !== null && (
            <h2 className="mb-2 text-sm font-medium text-on-surface-variant">{sort === 'name' ? g.key : dateName(g.key)}</h2>
          )}
          <Grid srcs={g.items} picked={picked} onPick={onPick} selection={selection} />
        </section>
      ))}
      {!shown.length && <EmptyNote>{all ? t.media.noFiles : t.media.noImages}</EmptyNote>}
    </div>
  );
}

/** Asks for an image from the gallery, or a new one (kept with the form's images, images.ts, and
 * saved with it); its address on the site, or null. The sheet goes on top of a block's sheet. With `files` (the site's files),
 * each source of images an installed app adds (a media provider) is a tab beside the site's own images; an image from it
 * is kept with its credit, which is saved with the image. */
export function useMediaPicker(media: RepoFile[], images: Uploads, files: RepoFile[] = []): [() => Promise<string | null>, ReactElement] {
  const dialog = useRef<HTMLDialogElement>(null);
  const answer = useRef<(src: string | null) => void>(() => {});
  const srcs = [...new Set([...images.added, ...mediaOf(media)].map((f) => publicPath(f.path)))];
  const providers = mediaProvidersOf(apps, activeApps(files));
  const [source, setSource] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const provider = providers.find((p) => `${p.app}/${p.id}` === source);

  const done = (src: string | null) => {
    answer.current(src);
    answer.current = () => {};
    dialog.current?.close();
  };
  const ask = () =>
    new Promise<string | null>((resolve) => {
      answer.current = resolve;
      setProblem(null);
      dialog.current?.showModal();
    });

  async function pickFrom(item: MediaItem) {
    if (!provider) return;
    setAdding(true);
    setProblem(null);
    try {
      const upload = await images.addFile(await providerFile(provider, item), { ...item.credit, source: provider.label });
      trackProviderDownload(provider, item);
      done(publicPath(upload.path));
    } catch (e) {
      setProblem((e as Error).message === 'image' ? t.media.providers.failed : (e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  const element = (
    <BottomSheet
      ref={dialog}
      aria-label={t.media.pick}
      onClose={(e) => e.target === e.currentTarget && done(null)}
      onClick={(e) => e.target === dialog.current && done(null)}
    >
      <SheetTitle title={t.media.pick} onClose={() => done(null)} />
      <SheetBody>
        {providers.length ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.media.pick}>
            <FilterChip selected={!provider} onClick={() => setSource(null)}>
              {t.media.providers.own}
            </FilterChip>
            {providers.map((p) => (
              <FilterChip key={`${p.app}/${p.id}`} selected={provider === p} onClick={() => setSource(`${p.app}/${p.id}`)}>
                {p.label}
              </FilterChip>
            ))}
          </div>
        ) : null}
        {provider ? (
          <>
            {problem ? (
              <Notice role="alert" title={problem}>
                {null}
              </Notice>
            ) : null}
            <MediaProviderPicker
              key={`${provider.app}/${provider.id}`}
              provider={provider}
              busy={adding || images.uploading}
              onPick={(item) => void pickFrom(item)}
            />
          </>
        ) : (
          <>
            <Button
              kind="outlined"
              icon={UploadSimple}
              busy={images.uploading}
              onClick={async () => {
                const added = await images.upload();
                if (added) done(publicPath(added.path));
              }}
            >
              {t.media.uploadNew}
            </Button>
            <Gallery srcs={srcs} onPick={done} />
          </>
        )}
      </SheetBody>
    </BottomSheet>
  );
  return [ask, element];
}

// The images the site's own code uses (its design, e.g. the front page and a portrait), as it
// was built; null until known, or when it could not be asked (then nothing can be deleted).
let inCode: Promise<string[] | null> | null = null;
const codeImages = () =>
  (inCode ??= fetch('/editor/code-images.json')
    .then((r) => (r.ok ? (r.json() as Promise<string[]>) : null))
    .catch(() => null));

// open: the address of a file to show picked at once (the route files/<address>); ignored when no such file exists.
export default function Media({ files, env, open }: { files: RepoFile[]; env: Env; open?: string }) {
  // The images and the other files.
  const images = [...mediaOf(files), ...filesOf(files)];
  const [code, setCode] = useState<string[] | null>(null);
  useEffect(() => void codeImages().then(setCode), []);
  // The addresses of the images some page, post or fixed page uses (its text has the address), or
  // the site's own code.
  const used = useMemo(() => {
    const texts = files
      .filter((f) => f.text && !f.path.startsWith(`${MEDIA}/`) && !(FILES && f.path.startsWith(`${FILES}/`)) && nameOf(f) !== null)
      .map((f) => f.text);
    return new Set(images.map((p) => publicPath(p.path)).filter((src) => code?.includes(src) || texts.some((t) => t.includes(src))));
  }, [files, code]);
  // Each file's tags, for the filter by tag.
  const tags = useMemo(() => tagIndex(recordsIn(files, config.fileRecords)), [files]);
  const dialog = useRef<HTMLDialogElement>(null);
  const opened = open && images.some((p) => publicPath(p.path) === open) ? open : null;
  const [src, setSrc] = useState<string | null>(opened);
  // On a computer the file picked is beside the grid; on a phone in a sheet.
  const wide = useAtLeast('expanded');
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
  // Opened at a file on a phone: the sheet opens with the screen.
  useEffect(() => {
    if (opened && !wide) dialog.current?.showModal();
  }, []);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Several files selected (a long press on a phone, Space or the mark on hover on a computer): one delete for all.
  // Not before it is known which files the site's code uses (then nothing can be deleted).
  const [order, setOrder] = useState<string[]>([]);
  const selection = useSelection({ order, enabled: !!code, spaceStarts: true });
  const [deletingMany, setDeletingMany] = useState(false);
  const [name, setName] = useState(opened ? stemOf(opened) : '');
  const [renaming, setRenaming] = useState(false);
  // The name being changed: the field shown instead of the pencil after the name.
  const [editing, setEditing] = useState(false);
  // A new file, saved on its own at once (with a page, an image is saved with the page instead): a
  // PDF, a video or a zip file as it is, an image made ready as in the forms.
  async function add() {
    const file = await pickImage(!!FILES);
    if (!file) return;
    const kind = pickedKindOf(file);
    if (!kind && !file.type.startsWith('image/')) return env.notify({ text: t.media.notAFile, error: true });
    setAdding(true);
    if (!kind) env.notify({ text: t.media.preparing });
    try {
      const image = kind
        ? await prepareFile(
            file,
            files.map((f) => f.path),
          )
        : await prepareImage(file);
      env.notify({ text: t.common.saving });
      const name = image.path.split('/').pop()!;
      const change = t.app.changes.added(kindAndName(t.media.kinds[kind ?? 'image'].word, name));
      const oids = await env.commit(
        siteT.media.commit.add(siteT.media.kinds[kind ?? 'image'].word, name),
        [{ path: image.path, content: image.bytes, oid: null }],
        change,
      );
      env.onSaved({ path: image.path, oid: oids[image.path], text: '' });
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setAdding(false);
    }
  }

  // A file nothing uses, deleted at once in its own commit (after asking), with its record of tags.
  async function remove(src: string) {
    const file = images.find((p) => publicPath(p.path) === src);
    if (!file || !(await ask(t.media.kinds[kindOf(src)].deleteAsk, t.common.delete))) return;
    setDeleting(true);
    env.notify({ text: t.common.deleting });
    try {
      const change = t.app.changes.deleted(kindAndName(t.media.kinds[kindOf(src)].word, fileName(src)));
      const record = deleteRecord(recordsIn(files, config.fileRecords), src);
      await env.commit(
        siteT.media.commit.delete(siteT.media.kinds[kindOf(src)].word, src.split('/').pop()!),
        [{ path: file.path, content: null, oid: file.oid }, ...(record ? [record] : [])],
        change,
      );
      env.forget([file.path, ...(record ? [record.path] : [])]);
      closeFile();
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.media.notDeleted((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setDeleting(false);
    }
  }

  // The selected files that no page and no code uses, deleted in one commit (after asking) with their records of tags.
  // A file in use is kept, named in a message, and stays selected; the deleted ones leave the selection.
  async function removeSelected() {
    const records = recordsIn(files, config.fileRecords);
    const { deleted, kept, changes } = mediaDeletion(selection.keys, {
      fileOf: (src) => images.find((p) => publicPath(p.path) === src),
      isUsed: (src) => used.has(src),
      records,
    });
    if (kept.length) {
      const shown = kept.slice(0, 3).map(fileName).join(', ');
      env.notify({
        text: t.media.keptFiles(kept.length, selection.keys.length, kept.length > 3 ? `${shown}…` : shown),
        error: true,
        kind: 'failed',
      });
    }
    if (!deleted.length || !(await ask(t.media.deleteFiles(deleted.length), t.common.delete))) return;
    setDeletingMany(true);
    env.notify({ text: t.common.deleting });
    try {
      const change = t.app.changes.deleted(`${deleted.length} ${deleted.length === 1 ? 'file' : 'files'}`);
      await env.commit(siteT.media.commit.deleteMany(deleted.length), changes, change);
      env.forget(changes.map((c) => c.path));
      env.notify({ text: t.media.deletedFiles(deleted.length), kind: 'saved' });
      // The deleted ones are gone from the grid, so they leave the selection by themselves; the kept ones stay, and the mode
      // stays on while any is left.
      if (!kept.length) selection.removed();
    } catch (e) {
      env.notify({ text: t.media.notDeleted((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setDeletingMany(false);
    }
  }

  // A new name for an image, saved at once in one commit: the file under its new name (same folder
  // and ending), the old one deleted, the texts with its address changed, the redirect and the file's record of tags (same
  // record file, its address changed).
  async function rename(src: string) {
    const file = images.find((p) => publicPath(p.path) === src);
    const stem = slugify(name);
    if (!file || !stem || name === stemOf(src) || stem === stemOf(src)) return;
    const path = `${file.path.slice(0, file.path.lastIndexOf('/'))}/${stem}${endingOf(src)}`;
    const to = publicPath(path);
    if (files.some((f) => f.path === path)) return env.notify({ text: t.media.nameTaken, error: true });
    const texts = files
      .filter(
        (f) =>
          f.text &&
          f.path !== REDIRECTS &&
          !f.path.startsWith(`${MEDIA}/`) &&
          !f.path.startsWith(`${config.fileRecords}/`) &&
          f.text.includes(src),
      )
      .map((f) => ({ ...f, text: readdress(f.text, src, to) }));
    const record = renameRecord(recordsIn(files, config.fileRecords), src, to);
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
          ...(record ? [record] : []),
        ],
        change,
      );
      showMoved(src, to);
      env.onSaved(
        { path, oid: oids[path], text: '' },
        {
          files: [...texts, ...moved, ...(record ? [{ path: record.path, oid: '', text: String(record.content) }] : [])].map((f) => ({
            ...f,
            oid: oids[f.path],
          })),
          removed: [file.path],
        },
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

  // The pages, posts and fixed pages whose text has the image's address.
  const usedBy = src
    ? files.flatMap((f) => {
        const name = f.text.includes(src) && nameOf(f);
        return name ? [{ path: f.path, name }] : [];
      })
    : [];

  // What is shown about a file: its name (changed with the pencil), the file, where it is used and
  // "Delete". On a computer beside the grid (SideSheet), on a phone in the sheet.
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
              <span className="mr-1 text-on-surface-variant">{endingOf(src)}</span>
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
                busy={renaming}
                disabled={renaming || name === stemOf(src) || !slugify(name) || slugify(name) === stemOf(src)}
              />
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1 break-words text-on-surface-variant">{fileName(src)}</span>
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
          <p className="text-on-surface-variant">{t.media.noPages}</p>
        )}
      </div>
      <MediaTags key={src} src={src} files={files} env={env} />
      {code && !used.has(src) && (
        <Button kind="outlined" icon={Trash} busy={deleting} disabled={deleting} onClick={() => remove(src)}>
          {t.media.kinds[kindOf(src)].delete}
        </Button>
      )}
    </>
  );

  return (
    <Screen
      title={selection.selecting ? t.library.selectedCount(selection.count) : t.common.parts.media}
      wide
      back={{ href: '#', label: siteName }}
      selection={
        selection.selecting ? (
          <SelectionBar count={selection.count} onClose={selection.clear} kind="actions">
            <IconButton
              icon={Trash}
              label={t.library.deleteSelected(selection.count)}
              disabled={deletingMany}
              busy={deletingMany}
              onClick={removeSelected}
            />
          </SelectionBar>
        ) : undefined
      }
      actions={
        <>
          <IconButton
            icon={ClockCounterClockwise}
            label={t.history.deletedOf(t.history.files)}

            onClick={() => (location.hash = 'deleted/files')}
          />
        </>
      }
    >
      <div className="expanded:flex expanded:items-start expanded:gap-6">
        <div className="min-w-0 flex-1">
          <Gallery
            srcs={filerAddresses(files)}
            used={used}
            tags={tags}
            tagOptions={env.relations.categories}
            picked={wide ? src : undefined}
            selection={selection}
            onShown={setOrder}
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
      <CreateFab label={t.media.add} busy={adding} disabled={adding} onClick={add} />
    </Screen>
  );
}
