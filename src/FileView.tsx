// A file in Filer as it is shown (Media.tsx, and Deleted.tsx when it was deleted): a picture, a video
// to play, or a PDF to open and a zip file to download, each a button.
import { ArrowSquareOut, DownloadSimple, FilePdf, FileVideo, FileZip, type Icon } from '@phosphor-icons/react';
import { LinkButton } from './ui';
import { fileKindOf, type FileKind } from './images';
import { t } from './i18n';

/** The kind of a file in Filer, by its address: one in the folder of files, or else a picture. */
export type Kind = 'picture' | FileKind;
export const KINDS: Kind[] = ['picture', 'pdf', 'video', 'zip'];
export const kindOf = (src: string): Kind => fileKindOf(src) ?? 'picture';

/** The icon of a PDF, a video and a zip file, in the grid. */
export const fileIcons: Record<FileKind, Icon> = { pdf: FilePdf, video: FileVideo, zip: FileZip };

/** src: where the browser gets it (the site, or the bytes in this browser); name: its file name. */
export function FileView({ src, name }: { src: string; name: string }) {
  const kind = kindOf(name);
  if (kind === 'picture')
    return <img src={src} alt="" className="max-h-[45dvh] w-full rounded-xl bg-surface-container-high object-contain" />;
  if (kind === 'video')
    return <video src={src} controls preload="metadata" className="max-h-[45dvh] w-full rounded-xl bg-surface-container-high" />;
  return kind === 'pdf' ? (
    <LinkButton href={src} target="_blank" rel="noopener" kind="outlined" icon={ArrowSquareOut}>
      {t.media.openPdf}
    </LinkButton>
  ) : (
    <LinkButton href={src} download={name} kind="outlined" icon={DownloadSimple}>
      {t.media.download}
    </LinkButton>
  );
}
