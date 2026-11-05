// "Slettede …" behind the clock in the top bar of a list that can be deleted from (blog posts, tags,
// promotions, prices, testimonials) and of "Filer": what was deleted from its folder in the last commits that changed it
// (github.ts deletedFiles), newest first, with when and by whom. Tapping one asks, then brings it back
// in one commit, under its old name: a page or post at its old address (not when another has it, or
// the site sends it on, which it says, and where to), a price or testimonial last in the list. A
// file from "Filer" is shown in a sheet first (FileView.tsx; a PDF, a video or a zip file with its icon
// and name over it), with "Gendan" under it, and comes back with its record of tags (fileRecords.mjs) when it
// was deleted together with it and no live record has its address. "Gendan" shows the loading indicator while it restores.
import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise } from '@phosphor-icons/react';
import Screen from './Screen';
import { Button, listClass, BottomSheet, SheetTitle, EmptyNote, SheetBody, ProblemNote, ListItem } from './ui';
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

/** The collections whose lists have "Slettede …" (the clock in the top bar): those that can be deleted from. */
export const restorable = (c: Collection) => c.kind !== 'files' && !!c.deletable;

const MEDIA = config.folders.media;
/** The folder of PDFs, videos and zip files, deleted from under "Filer" too. */
const FILES: string | undefined = (config.folders as { files?: string }).files;

// "i dag kl. 13.42" as "I dag kl. 13.42".
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

const fileName = (path: string) => path.split('/').pop() ?? path;

export default function Deleted({ id, files, env }: { id: string; files: RepoFile[]; env: Env }) {
  // The files from "Filer" (pictures, PDFs, videos, zip files), not a list's.
  const pictures = id === 'files';
  const collection = pictures ? undefined : collections.find((c) => c.id === id && restorable(c));
  const folder = pictures ? MEDIA : collection && collection.kind !== 'files' ? collection.folder : '';
  const [deleted, setDeleted] = useState<DeletedFile[] | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  // True only while a restore runs (not while `open` fetches the bytes); the sheet's button shows busy for it.
  const [restoring, setRestoring] = useState(false);
  // The file shown in the sheet, and its bytes as an address the <img> can show.
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<{ file: DeletedFile; src: string; bytes: Uint8Array } | null>(null);

  useEffect(() => {
    if (!folder) return;
    // Under "Filer", the pictures' and the other files' together, newest first.
    const folders = pictures && FILES ? [folder, FILES] : [folder];
    Promise.all(folders.map((f) => env.deleted(f, { text: !pictures })))
      .then((all) => setDeleted(all.flat().sort((a, b) => +new Date(b.at) - +new Date(a.at))))
      .catch((e) => setProblem(t.history.deletedNotLoaded((e as Error).message)));
  }, [folder]);

  if (!folder)
    return (
      <Screen title={t.app.notFound} back={{ href: '#', label: siteName }}>
        <EmptyNote>{t.app.nothingAt(`deleted/${id}`)}</EmptyNote>
      </Screen>
    );

  const label = pictures ? t.history.files : collection!.label;
  const back = pictures ? { href: '#files', label: t.common.parts.media } : { href: `#list/${id}`, label: collection!.label };

  async function open(file: DeletedFile) {
    if (!pictures) return restore(file);
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

  async function restore(file: DeletedFile, bytes?: Uint8Array) {
    const name = nameOf(collection, file);
    if (!pictures && !(await ask(t.history.restoreAsk(name), t.history.restore))) return;
    setBusy(true);
    setRestoring(true);
    env.notify({ text: t.history.restoring });
    try {
      let content: string | Uint8Array = file.text;
      if (pictures) content = bytes ?? (await env.bytes(file.oid));
      else if (collection!.kind === 'markdown') {
        // A post's address is its file name; not when another page or post has it now, or the site
        // sends it on elsewhere (the redirects as they are now).
        const address = `/${slugOf(file.path, collection!.folder)}/`;
        const taken = env.taken(address, await env.load(REDIRECT_FILES));
        if (taken) return env.notify({ text: t.history.restoreTaken(taken.text), error: true });
      } else if (collection!.kind === 'folder' && collection!.orderable) {
        // Last in the list, as a new one; `order` is the first key, as in the other files.
        const { order: _, ...rest } = JSON.parse(file.text) as Record<string, unknown>;
        content = `${JSON.stringify({ order: env.nextOrder(collection!), ...rest }, null, 2)}\n`;
      }
      // A file from "Filer" comes back with its record of tags: the one deleted in the same commit (same time).
      const changes: { path: string; content: string | Uint8Array; oid: string | null }[] = [{ path: file.path, content, oid: null }];
      if (pictures) {
        const deletedRecords = await env.deleted(config.fileRecords, { text: true });
        const record = deletedRecordFor(publicPath(file.path), file.at, deletedRecords, recordsIn(files, config.fileRecords));
        if (record) changes.push({ path: record.path, content: record.text, oid: null });
      }
      const what = pictures ? siteT.media.kinds[kindOf(file.path)].word : asWritten(collection!).singular;
      const change = t.app.changes.restored(kindAndName(pictures ? t.media.kinds[kindOf(file.path)].word : collection!.singular, name));
      const oids = await env.commit(
        siteT.history.commit.restoreDeleted(what, `"${pictures ? fileName(file.path) : slugOf(file.path, folder)}"`),
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
      env.notify({ text: savedText(change), kind: 'saved', edit: pictures ? undefined : { to: file.path, text: t.history.open } });
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

  // A PDF's or zip file's icon, over its name in the sheet (a picture and a video show themselves).
  const shownKind = shown && fileKindOf(shown.file.path);
  const ShownIcon = shownKind && shownKind !== 'video' ? fileIcons[shownKind] : null;

  return (
    <Screen title={t.history.deletedOf(label)} wide back={back}>
      <p className="mb-4 text-muted">{t.history.deletedNote}</p>
      {problem && <ProblemNote>{problem}</ProblemNote>}
      {!deleted && !problem && <EmptyNote busy>{t.history.loadingDeleted}</EmptyNote>}
      {deleted && (
        <ul className={listClass}>
          {deleted.map((f) => (
            <ListItem
              key={f.path}
              onClick={() => open(f)}
              disabled={busy}
              headline={nameOf(collection, f)}
              supporting={capital(t.history.deletedAt(when(f.at), f.by))}
              truncate
              arrow={ArrowCounterClockwise}
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
                <ShownIcon size={36} className="shrink-0 text-muted" />
                <span className="min-w-0 break-all">{fileName(shown.file.path)}</span>
              </p>
            )}
            <FileView src={shown.src} name={fileName(shown.file.path)} />
            <p className="text-sm text-muted">{capital(t.history.deletedAt(when(shown.file.at), shown.file.by))}</p>
            <Button busy={restoring} disabled={busy} onClick={() => restore(shown.file, shown.bytes)}>
              {t.history.restore}
            </Button>
          </SheetBody>
        )}
      </BottomSheet>
    </Screen>
  );
}
