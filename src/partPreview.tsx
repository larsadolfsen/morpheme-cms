// The preview of a part every page has (the header: HeaderSettings.tsx; the footer next) as the form has it now, at once
// and without saving: the site's front page with only that part changed (`swap`, on a copy of the page each time the form
// changes), on a phone and on a computer (lib/breakpoints.mjs), each frame cut to the part (PageFrame `part`). Exposes
// PartPreview. Uses pagePreview.tsx (siteShell, documentHtml, PREVIEW_WIDTH) and ui.tsx.
import { useEffect, useState } from 'react';
import { siteShell, documentHtml, PREVIEW_WIDTH } from './pagePreview';
import { EmptyNote, FieldGroup, FormField, PageFrame } from './ui';
import { t } from './i18n';

// A pause after the last change before the page is drawn again, so typing does not draw it at every key.
const SETTLE = 250;

/** `part`: its data-editor name on the site's pages ("header"); `swap`: puts what the form changes into a copy of the
 * page (a new function when the form changes). */
export function PartPreview({ part, swap }: { part: string; swap: (doc: Document) => void }) {
  const selector = `[data-editor="${part}"]`;
  const [shell, setShell] = useState<Document | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    siteShell('/', selector).then(setShell, (e) => setProblem(t.preview.failed((e as Error).message)));
  }, [selector]);

  useEffect(() => {
    if (!shell) return;
    let stopped = false;
    const timer = setTimeout(() => {
      const doc = shell.cloneNode(true) as Document;
      try {
        swap(doc);
      } catch (e) {
        return setProblem(t.preview.failed((e as Error).message));
      }
      documentHtml(doc).then((page) => !stopped && setHtml(page));
    }, SETTLE);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [shell, swap]);

  return (
    <FieldGroup label={t.preview.title}>
      {html ? (
        <>
          <FormField label={t.preview.phone}>
            <PageFrame html={html} width={PREVIEW_WIDTH.compact} title={t.preview.phone} part={selector} />
          </FormField>
          <FormField label={t.preview.computer}>
            <PageFrame html={html} width={PREVIEW_WIDTH.large} title={t.preview.computer} part={selector} />
          </FormField>
        </>
      ) : (
        <EmptyNote busy={!problem}>{problem || t.preview.making}</EmptyNote>
      )}
    </FieldGroup>
  );
}
