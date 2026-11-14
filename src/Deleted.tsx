// "Deleted …" behind the clock in the top bar of a list that can be deleted from (blog posts, tags,
// promotions, prices, testimonials) and of "Files": what was deleted from its folder in the last commits that changed it
// (github.ts deletedFiles), newest first, with when and by whom. Tapping one asks, then brings it back
// in one commit, under its old name: a page or post at its old address (not when another has it, or
// the site sends it on, which it says, and where to), a price or testimonial last in the list. A
// file from "Files" is shown in a sheet first (FileView.tsx; a PDF, a video or a zip file with its icon
// and name over it), with "Restore" under it, and comes back with its record of tags (fileRecords.mjs) when it
// was deleted together with it and no live record has its address. "Restore" shows the loading indicator while it restores.
import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react';
import Screen from './Screen';
import { Button, IconButton, listClass, BottomSheet, SheetTitle, EmptyNote, SheetBody, ProblemNote, ListItem } from './ui';
import { useSelection } from './useSelection';
import SelectionBar from './SelectionBar';
import { fileKindOf, publicPath, typeOf } from './images';
import { deletedRecordFor, recordsIn } from './fileRecords.mjs';
import { fileIcons, FileView, kindOf } from './FileView';
import { ask } from './ask';
import { REDIRECT_FILES } from './redirectData';
import { slugOf, type Collection } from './schema';
import { asWritten, collections } from './site';
import { ConflictError, type DeletedFile, type RepoFile } from './github';
import type { Env } from './App';
import { when } from './when';
import { kindAndName, nameOf, savedText } from './deploy';
import { config, siteName } from '@site/editor';
import { locale, siteT, t } from './i18n';

/** The collections whose lists have "Deleted …" (the clock in the top bar): those that can be deleted from. */
export const restorable = (c: Collection) => c.kind !== 'files' && !!c.deletable;

const MEDIA = config.folders.media;
/** The folder of PDFs, videos and zip files, deleted from under "Files" too. */
const FILES: string | undefined = (config.folders as { files?: string }).files;

// "today at 1:42 PM" as "Today at 1:42 PM".
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

const fileName = (path: string) => path.split('/').pop() ?? path;
const lower = (s: string) => s.charAt(0).toLocaleLowerCase(locale) + s.slice(1);

/** What a restore needs, loaded once (Deleted `context`), and what it makes: the changes, or the reason it cannot come back. */
type Context = { redirects?: Awaited<ReturnType<Env['load']>>; records: DeletedFile[] };
type Prepared =
  { changes: { path: string; content: string | Uint8Array; oid: string | null }[]; content: string | Uint8Array } | { taken: string };

export default function Deleted({ id, files, env }: { id: string; files: RepoFile[]; env: Env }) {
  // The files from "Files" (images, PDFs, videos, zip files), not a list's.
  const images = id === 'files';
  const collection = images ? undefined : collections.find((c) => c.id === id && restorable(c));
  const folder = images ? MEDIA : collection && collection.kind !== 'files' ? collection.folder : '';
  const [deleted, setDeleted] = useState<DeletedFile[] | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  // True only while a restore runs (not while `open` fetches the bytes); the sheet's button shows busy for it.
  const [restoring, setRestoring] = useState(false);
  const [restoringMany, setRestoringMany] = useState(false);
  // The file shown in the sheet, and its bytes as an address the <img> can show.
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<{ file: DeletedFile; src: string; bytes: Uint8Array } | null>(null);

  useEffect(() => {
    if (!folder) return;
    // Under "Files", the images' and the other files' together, newest first.
    const folders = images && FILES ? [folder, FILES] : [folder];
    Promise.all(folders.map((f) => env.deleted(f, { text: !images })))
      .then((all) => setDeleted(all.flat().sort((a, b) => +new Date(b.at) - +new Date(a.at))))
      .catch((e) => setProblem(t.history.deletedNotLoaded((e as Error).message)));
  }, [folder]);

  // Selecting is the main activity here, so each row always shows its checkbox and a tap selects it (Material's Selection page:
  // "checkboxes are always visible when selection is the primary activity"); Restore and, for a file, Preview are in the top bar.
  const selection = useSelection({ order: deleted?.map((f) => f.path) ?? [], enabled: !!deleted, spaceStarts: true, primary: true });

  if (!folder)
    return (
      <Screen title={t.app.notFound} back={{ href: '#', label: siteName }}>
        <EmptyNote>{t.app.nothingAt(`deleted/${id}`)}</EmptyNote>
      </Screen>
    );

  const label = images ? t.history.files : collection!.label;
  const back = images ? { href: '#files', label: t.common.parts.media } : { href: `#list/${id}`, label: collection!.label };

  async function open(file: DeletedFile) {
    if (!images) return restore(file);
    setBusy(true);
    try {
      const bytes = await env.bytes(file.oid);
      const type = typeOf(file.path);
      setShown({ file, bytes, src: URL.createObjectURL(new Blob([bytes as BlobPart], type ? { type } : undefined)) });
      dialog.current?.showModal();
    } catch (e) {
      env.notify({ text: t.history.notRestored((e as Error).message), error: true });
    } finally {
      setBusy(false);
    }
  }

  // What a restore needs from the repository, loaded once for all the files restored together: the redirects as they are now
  // (a page's or post's address may be taken) and the records of tags deleted with files.
  async function context(): Promise<Context> {
    return {
      redirects: !images && collection!.kind === 'markdown' ? await env.load(REDIRECT_FILES) : undefined,
      records: images ? await env.deleted(config.fileRecords, { text: true }) : [],
    };
  }

  // The changes that bring a deleted file back, or why it cannot come back (`taken`: its address is taken now). `extra`: how many
  // are restored before it in the same commit (a list entry goes last in the list, after those).
  async function prepare(file: DeletedFile, ctx: Context, bytes?: Uint8Array, extra = 0): Promise<Prepared> {
    let content: string | Uint8Array = file.text;
    if (images) content = bytes ?? (await env.bytes(file.oid));
    else if (collection!.kind === 'markdown') {
      // A post's address is its file name; not when another page or post has it now, or the site
      // sends it on elsewhere (the redirects as they are now).
      const address = `/${slugOf(file.path, collection!.folder)}/`;
      const taken = env.taken(address, ctx.redirects!);
      if (taken) return { taken: taken.text };
    } else if (collection!.kind === 'folder' && collection!.orderable) {
      // Last in the list, as a new one; `order` is the first key, as in the other files.
      const { order: _, ...rest } = JSON.parse(file.text) as Record<string, unknown>;
      content = `${JSON.stringify({ order: env.nextOrder(collection!) + extra, ...rest }, null, 2)}\n`;
    }
    // A file from "Files" comes back with its record of tags: the one deleted in the same commit (same time).
    const changes: { path: string; content: string | Uint8Array; oid: string | null }[] = [{ path: file.path, content, oid: null }];
    if (images) {
      const record = deletedRecordFor(publicPath(file.path), file.at, ctx.records, recordsIn(files, config.fileRecords));
      if (record) changes.push({ path: record.path, content: record.text, oid: null });
    }
    return { changes, content };
  }

  async function restore(file: DeletedFile, bytes?: Uint8Array) {
    const name = nameOf(collection, file);
    if (!images && !(await ask(t.history.restoreAsk(name), t.history.restore))) return;
    setBusy(true);
    setRestoring(true);
    env.notify({ text: t.history.restoring });
    try {
      const made = await prepare(file, await context(), bytes);
      if ('taken' in made) return env.notify({ text: t.history.restoreTaken(made.taken), error: true });
      const { changes, content } = made;
      const what = images ? siteT.media.kinds[kindOf(file.path)].word : asWritten(collection!).singular;
      const change = t.app.changes.restored(kindAndName(images ? t.media.kinds[kindOf(file.path)].word : collection!.singular, name));
      const oids = await env.commit(
        siteT.history.commit.restoreDeleted(what, `"${images ? fileName(file.path) : slugOf(file.path, folder)}"`),
        changes,
        change,
      );
      env.onSaved(
        { path: file.path, oid: oids[file.path], text: typeof content === 'string' ? content : '' },
        changes.length > 1
          ? { files: changes.slice(1).map((c) => ({ path: c.path, oid: oids[c.path], text: String(c.content) })), removed: [] }
          : undefined,
      );
      setDeleted((all) => all?.filter((f) => f.path !== file.path) ?? null);
      dialog.current?.close();
      env.notify({ text: savedText(change), kind: 'saved', edit: images ? undefined : { to: file.path, text: t.history.open } });
    } catch (e) {
      env.notify({
        text: e instanceof ConflictError ? e.message : t.history.notRestored((e as Error).message),
        error: true,
        kind: 'failed',
      });
    } finally {
      setBusy(false);
      setRestoring(false);
    }
  }

  // The selected items, restored in one commit (after asking). A page or post whose address is taken now is left out and named, and
  // stays selected; the restored ones leave the selection, and selecting goes on while any is left.
  async function restoreSelected() {
    const picked = (deleted ?? []).filter((f) => selection.keys.includes(f.path));
    const what = images ? t.history.files : lower(collection!.label);
    if (!picked.length || !(await ask(t.history.restoreMany(picked.length, what), t.history.restore))) return;
    setBusy(true);
    setRestoringMany(true);
    env.notify({ text: t.history.restoring });
    try {
      const ctx = await context();
      const changes: { path: string; content: string | Uint8Array; oid: string | null }[] = [];
      const first: DeletedFile[] = [];
      const left: string[] = [];
      for (const file of picked) {
        const made = await prepare(file, ctx, undefined, first.length);
        if ('taken' in made) left.push(nameOf(collection, file));
        else {
          first.push(file);
          changes.push(...made.changes);
        }
      }
      if (left.length)
        env.notify({
          text: t.history.notRestoredSome(left.length, left.slice(0, 3).join(', ') + (left.length > 3 ? '…' : '')),
          error: true,
          kind: 'failed',
        });
      if (!first.length) return;
      const change = t.app.changes.restored(`${first.length} ${what}`);
      const oids = await env.commit(
        siteT.history.commit.restoreMany(first.length, images ? siteT.history.files : asWritten(collection!).label.toLowerCase()),
        changes,
        change,
      );
      env.onSaved(
        { path: changes[0].path, oid: oids[changes[0].path], text: typeof changes[0].content === 'string' ? changes[0].content : '' },
        {
          files: changes.slice(1).map((c) => ({ path: c.path, oid: oids[c.path], text: typeof c.content === 'string' ? c.content : '' })),
          removed: [],
        },
      );
      setDeleted((all) => all?.filter((f) => !first.includes(f)) ?? null);
      env.notify({ text: t.history.restoredMany(first.length, what), kind: 'saved' });
      // The restored ones are gone from the list, so they leave the selection by themselves.
      if (!left.length) selection.removed();
    } catch (e) {
      env.notify({
        text: e instanceof ConflictError ? e.message : t.history.notRestored((e as Error).message),
        error: true,
        kind: 'failed',
      });
    } finally {
      setBusy(false);
      setRestoringMany(false);
    }
  }

  // A PDF's or zip file's icon, over its name in the sheet (an image and a video show themselves).
  const shownKind = shown && fileKindOf(shown.file.path);
  const ShownIcon = shownKind && shownKind !== 'video' ? fileIcons[shownKind] : null;

  return (
    <Screen
      title={selection.selecting ? t.library.selectedCount(selection.count) : t.history.deletedOf(label)}
      wide
      back={back}
      selection={
        selection.selecting ? (
          <SelectionBar
            count={selection.count}
            total={selection.total}
            onSelectAll={(all) => (all ? selection.selectAll() : selection.unselectAll())}
            onClose={selection.clear}
          >
            {images && selection.count === 1 && (
              <Button kind="text" disabled={busy} onClick={() => open((deleted ?? []).find((f) => selection.keys.includes(f.path))!)}>
                {t.history.preview}
              </Button>
            )}
            <IconButton
              icon={ArrowCounterClockwise}
              label={t.history.restoreSelected(selection.count)}
              disabled={busy}
              busy={restoringMany}
              onClick={restoreSelected}
            />
          </SelectionBar>
        ) : undefined
      }
    >
      <p className="mb-4 text-on-surface-variant">{t.history.deletedNote}</p>
      {problem && <ProblemNote>{problem}</ProblemNote>}
      {!deleted && !problem && <EmptyNote busy>{t.history.loadingDeleted}</EmptyNote>}
      {deleted && (
        <ul className={listClass}>
          {deleted.map((f) => (
            <ListItem
              key={f.path}
              {...selection.row(f.path)}
              disabled={busy}
              headline={nameOf(collection, f)}
              supporting={capital(t.history.deletedAt(when(f.at), f.by))}
              truncate
            />
          ))}
          {!deleted.length && <EmptyNote item>{t.history.noneDeleted}</EmptyNote>}
        </ul>
      )}
      <BottomSheet
        ref={dialog}
        onClose={(e) => {
          if (e.target !== e.currentTarget) return;
          if (shown) URL.revokeObjectURL(shown.src);
          setShown(null);
        }}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <SheetTitle title={shown ? fileName(shown.file.path) : ''} onClose={() => dialog.current?.close()} />
        {shown && (
          <SheetBody>
            {ShownIcon && (
              <p className="flex items-center gap-3 font-medium">
                <ShownIcon size={36} className="shrink-0 text-on-surface-variant" />
                <span className="min-w-0 break-all">{fileName(shown.file.path)}</span>
              </p>
            )}
            <FileView src={shown.src} name={fileName(shown.file.path)} />
            <p className="text-sm text-on-surface-variant">{capital(t.history.deletedAt(when(shown.file.at), shown.file.by))}</p>
            <Button busy={restoring} disabled={busy} onClick={() => restore(shown.file, shown.bytes)}>
              {t.history.restore}
            </Button>
          </SheetBody>
        )}
      </BottomSheet>
    </Screen>
  );
}
