// A file in Filer as it is shown (Media.tsx, and Deleted.tsx when it was deleted): an image, a video
// to play, or a PDF to open and a zip file to download, each a button.
import { ArrowSquareOut, DownloadSimple, FilePdf, FileVideo, FileZip, type Icon } from '@phosphor-icons/react';
import { LinkButton } from './ui';
import { fileKindOf, type FileKind } from './images';
import { t } from './i18n';
import { capital, kindAndName } from './deploy';
import { safeImageSrc } from '../lib/safe-url.mjs';

/** The kind of a file in Filer, by its address: one in the folder of files, or else an image. */
export type Kind = 'image' | FileKind;
export const KINDS: Kind[] = ['image', 'pdf', 'video', 'zip'];
export const kindOf = (src: string): Kind => fileKindOf(src) ?? 'image';

/** A file's name for a screen reader: its kind and its file name, `PDF “report.pdf”` (a file name alone says nothing of what it is). */
export const fileLabel = (kind: Kind, name: string) => {
  return capital(kindAndName(t.media.kinds[kind].word, name));
};

/** The icon of a PDF, a video and a zip file, in the grid. */
export const fileIcons: Record<FileKind, Icon> = { pdf: FilePdf, video: FileVideo, zip: FileZip };

/** src: where the browser gets it (the site, or the bytes in this browser); name: its file name. */
export function FileView({ src, name }: { src: string; name: string }) {
  const kind = kindOf(name);
  const safe = safeImageSrc(src);
  if (!safe) return null;
  if (kind === 'image') return <img src={safe} alt="" className="mo-editor-file-preview mo-editor-file-preview-image" />;
  if (kind === 'video') return <video src={safe} controls preload="metadata" className="mo-editor-file-preview" />;
  return kind === 'pdf' ? (
    <LinkButton href={safe} target="_blank" rel="noopener" kind="outlined" icon={ArrowSquareOut}>
      {t.media.openPdf}
    </LinkButton>
  ) : (
    <LinkButton href={safe} download={name} kind="outlined" icon={DownloadSimple}>
      {t.media.download}
    </LinkButton>
  );
}
