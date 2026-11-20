// The images of Files as the "Image grid" can use them in the editor (BlockData.libraryImages): each image's address, and what its record holds
// (src/fileRecords.mjs): tags, base text, decorative mark, caption and the credit's name. Newest first, as the Library lists them.
import { publicPath } from '../../images';
import type { RepoFile } from '../../github';
import type { StoredRecord } from '../../fileRecords.mjs';
import type { ImageItem } from './view';

/** `media`: the images (env.media), `records`: the file records (recordsIn). */
export function libraryItems(media: RepoFile[], records: StoredRecord[]): ImageItem[] {
  const bySrc = new Map(records.map((stored) => [stored.record.src, stored.record]));
  return media.map((file) => {
    const src = publicPath(file.path);
    const record = bySrc.get(src);
    return {
      src,
      tags: record?.categories ?? [],
      ...(record?.alt ? { alt: record.alt } : {}),
      ...(record?.decorative ? { decorative: true } : {}),
      ...(record?.caption ? { caption: record.caption } : {}),
      ...(record?.credit ? { credit: record.credit.name } : {}),
    };
  });
}
