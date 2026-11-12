// "Notice": a short notice in a box with the accent along its left edge (.block-notice in ../blocks.css). What it shows
// comes from its contract (@morphemecms/cms/src/standard/notice/view.ts); on the site it also has the time it expires,
// for the script after it.
import { useInText } from '@morphemecms/cms/src/standard/view';
import type { NoticeView } from '@morphemecms/cms/src/standard/notice/view';

export default function Notice({ view }: { view: NoticeView }) {
  return (
    <aside className={useInText('block-notice')} data-until={view.until ?? undefined}>
      <p dangerouslySetInnerHTML={{ __html: view.html }} />
    </aside>
  );
}
