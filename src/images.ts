// Pictures added in the editor. Before upload they are made at most 2000 px and WebP (JPEG in
// browsers that cannot write WebP, like Safari), as the old editor did; packages/editor/scripts/responsive-images.mjs
// makes the smaller sizes when the site is built. They go in public/images/uploads/<year>/<month>/
// like imported pictures, and are saved in the same commit as the page that uses them (on
// their own from Filer, Media.tsx). PDFs, videos and zip files, from Filer, are saved as they are, in
// public/filer/ (prepareFile).
import { useState } from 'react';
import { slugify } from './schema';
import { sourceColorsOf } from '../lib/dynamic-colors';
import { config } from '@site/config';
import type { Status } from './FormFrame';
import { t } from './i18n';

const MAX = 2000;

// url: a temporary address of the picture in this browser, shown until the site is rebuilt.
export type Upload = { url: string; path: string; bytes: Uint8Array; saved: boolean };

// The pictures made ready in this visit, by their address on the site: shown from the browser
// (shownAt), as the site has them only once it has been rebuilt.
const fresh = new Map<string, string>();
export const shownAt = (src: string) => fresh.get(src) ?? src;
// A picture renamed in this visit is shown from its old address until the site is rebuilt.
export const showMoved = (from: string, to: string) => fresh.set(to, shownAt(from));

/** What a file in the site's folder of files is, by its ending: a PDF, a video or a zip file. */
export type FileKind = 'pdf' | 'video' | 'zip';

// The endings of each kind, with the type a browser shows it as.
const ENDINGS: Record<string, [FileKind, string]> = {
  pdf: ['pdf', 'application/pdf'],
  mp4: ['video', 'video/mp4'],
  m4v: ['video', 'video/mp4'],
  mov: ['video', 'video/quicktime'],
  webm: ['video', 'video/webm'],
  zip: ['zip', 'application/zip'],
};
const endingOf = (name: string) => /\.([^./]+)$/.exec(name)?.[1].toLowerCase() ?? '';

/** A file's kind by its name or address, or null for one that is not a PDF, a video or a zip file. */
export const fileKindOf = (name: string): FileKind | null => ENDINGS[endingOf(name)]?.[0] ?? null;

/** The type a browser shows a file as, by its name ('' for a picture). */
export const typeOf = (name: string) => ENDINGS[endingOf(name)]?.[1] ?? '';

// A picked file's ending: its own, or for one without it the first of its type ("Guide" from a phone,
// application/pdf, as pdf); '' for another kind of file.
const pickedEnding = (file: File) =>
  ENDINGS[endingOf(file.name)] ? endingOf(file.name) : (Object.keys(ENDINGS).find((e) => ENDINGS[e][1] === file.type) ?? '');

/** A picked file's kind, by its ending or else its type, or null for one that is not a PDF, a video or a zip file. */
export const pickedKindOf = (file: File): FileKind | null => ENDINGS[pickedEnding(file)]?.[0] ?? null;

/** A file picked on the phone or computer: a picture, or (`all`, in Filer) a picture, a PDF, a video or a
 * zip file. */
export function pickImage(all = false): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = all
      ? ['image/*', ...new Set(Object.values(ENDINGS).map(([, type]) => type)), ...Object.keys(ENDINGS).map((e) => `.${e}`)].join(',')
      : 'image/*';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/** The colours in a picture that are best as a source colour (dynamic colour, sourceColorsOf), best first: one on the
 * phone or computer (it is not uploaded), or one at an address of the editor's own. Read small, which is enough and quick. */
export async function colorsInPicture(file: Blob): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return sourceColorsOf(context.getImageData(0, 0, canvas.width, canvas.height).data);
}

export async function prepareImage(file: File): Promise<Upload> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => {
    throw new Error(t.app.pictureNotOpened);
  });
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));
  let blob = await encode('image/webp');
  if (blob?.type !== 'image/webp') blob = await encode('image/jpeg');
  if (!blob) throw new Error(t.app.pictureNotReady);

  const now = new Date();
  const folder = `${config.folders.media}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  // A short random ending, so two pictures called IMG_1234 do not get the same name.
  const name = `${slugify(file.name.replace(/\.[^.]*$/, '')) || 'billede'}-${Math.random().toString(36).slice(2, 6)}`;
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const upload = {
    url: URL.createObjectURL(blob),
    path: `${folder}/${name}.${ext}`,
    bytes: new Uint8Array(await blob.arrayBuffer()),
    saved: false,
  };
  fresh.set(publicPath(upload.path), upload.url);
  return upload;
}

/** The most a PDF, a video or a zip file may weigh, in MB: it goes to GitHub in one request with the commit. */
export const FILE_MAX_MB = 10;

/** A PDF, a video or a zip file as it is, in the site's folder of files (`config.folders.files`, /filer/ on
 * the site), named by its own name as an address ("Stress guide.pdf" as stress-guide.pdf, the ending in
 * small letters), with -2, -3 … when the name is taken (`taken`: the paths there are). */
export async function prepareFile(file: File, taken: string[]): Promise<Upload> {
  if (file.size > FILE_MAX_MB * 1024 * 1024) throw new Error(t.media.tooBig(FILE_MAX_MB));
  const folder = config.folders.files;
  const stem = slugify(file.name.replace(/\.[^.]*$/, '')) || 'fil';
  const ending = pickedEnding(file);
  let path = `${folder}/${stem}.${ending}`;
  for (let n = 2; taken.includes(path); n++) path = `${folder}/${stem}-${n}.${ending}`;
  const upload = { url: URL.createObjectURL(file), path, bytes: new Uint8Array(await file.arrayBuffer()), saved: false };
  fresh.set(publicPath(upload.path), upload.url);
  return upload;
}

// The address of an uploaded picture on the site.
export const publicPath = (path: string) => path.replace(/^public/, '');

// The pictures added in a form (a page, a fixed page), kept in the browser until "Gem", which saves
// them in the same commit. upload: pick one and make it ready; added: those not saved yet, newest
// first (offered in the gallery, MediaPicker.tsx); saving: the pictures a text uses.
export function useUploads(notify: (status: Status) => void) {
  const [uploads, setUploads] = useState<Upload[]>([]);

  async function upload(): Promise<Upload | null> {
    const file = await pickImage();
    if (!file) return null;
    notify({ text: t.app.preparingPicture });
    try {
      const prepared = await prepareImage(file);
      setUploads((u) => [...u, prepared]);
      notify(null);
      return prepared;
    } catch (e) {
      notify({ text: (e as Error).message, error: true });
      return null;
    }
  }

  const added = uploads.filter((u) => !u.saved).reverse();
  /** The pictures not saved yet that a text uses. */
  const usedIn = (text: string) => uploads.filter((u) => !u.saved && text.includes(publicPath(u.path)));
  const markSaved = (pictures: Upload[]) => setUploads((all) => all.map((u) => (pictures.includes(u) ? { ...u, saved: true } : u)));

  return { upload, added, usedIn, markSaved };
}

export type Uploads = ReturnType<typeof useUploads>;
