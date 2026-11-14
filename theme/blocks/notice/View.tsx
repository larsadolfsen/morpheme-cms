// "Notice": a short notice on a filled card (Card, .block-notice in ../blocks.css), the accent along its left edge on a
// theme that draws it. What it shows comes from its contract (@morphemecms/cms/src/standard/notice/view.ts); on the site it
// also has the time it expires, for the script after it.
import { useInText } from '@morphemecms/cms/src/standard/view';
import type { NoticeView } from '@morphemecms/cms/src/standard/notice/view';
import Card from '@theme/ui/Card';

export default function Notice({ view }: { view: NoticeView }) {
  return (
    <Card as="aside" kind="filled" className={useInText('block-notice')} data-until={view.until ?? undefined}>
      <p dangerouslySetInnerHTML={{ __html: view.html }} />
    </Card>
  );
}
