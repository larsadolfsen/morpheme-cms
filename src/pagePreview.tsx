// "Forhåndsvis" (FormFrame.tsx): a page or a blog post as it looks on the site with what is in its form
// now, at once and without saving, in a sheet, as wide as a phone or a computer.
//
// The page as it is on the site gives everything around what the form changes: the header, the footer,
// the layout and the site's CSS. The site's layouts mark what the form changes (data-editor): the
// heading, the picture at the top (a blog post's), the text, and the place at the end of the page where the layout
// puts a block that ends the text (data-editor="end", with its type in data-editor-block). Only what
// was changed is put in, so the rest is exactly as on the site. The text is the site's Markdown
// (Astro's pipeline, with the HTML written in it), and its blocks are drawn as in the editor
// (registry.tsx preview), with the site's classes.
//
// The page is shown in a frame without scripts (sandbox), so nothing of the site runs on the editor's
// address, where its login is kept, and its links lead nowhere. A new page or post is shown in the
// page of another one. As on the site but for this: a changed text has the pictures themselves (not
// the sizes the build makes), its words are not yet links to other pages (packages/editor/site/autolinks.mjs), and
// a video written in it as HTML is the video.
import { useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { DeviceMobile, Desktop } from '@phosphor-icons/react';
import { parseBlock, splitBlocks } from '../lib/blocks.mjs';
import { processor } from '../lib/markdown';
import { splitPicture } from '../lib/crop.mjs';
import { preview as drawBlock, siteBlocks } from './registry';
import { shownAt } from './images';
import { pageH1 } from './sections.mjs';
import type { BlockData } from './blocks';
import { PageFrame, BottomSheet, SegmentedButton, SheetTitle } from './ui';
import { t } from './i18n';

/** What a form puts in the page: undefined leaves it as it is on the site. */
export type PageDraft = {
  /** The page on the site to show it in (its address); for a new one, others like it, the first
   * that can be. */
  shell: string | string[];
  heading?: string;
  /** The heading as HTML with its colours, when a word in it has one (pageH1 in sections.mjs). */
  headingHtml?: string;
  /** The picture at the top (a blog post's); null: none. */
  image?: { src: string; alt: string } | null;
  /** The text, in Markdown with its blocks. */
  body?: string;
  /** What the blocks are drawn with. */
  data: BlockData;
};

// The text as the site makes it (Astro's Markdown, ../lib/markdown.ts), with the site's plugins (packages/editor/astro.mjs)
// but those that read the site's files.
const markdownHtml = async (markdown: string) => String(await processor.process(markdown));

// A block drawn as in the editor, as HTML.
function blockHtml(type: string, props: Record<string, unknown>, data: BlockData) {
  const drawn: ReactNode = drawBlock(type, props, data);
  if (!drawn) return '';
  const box = document.createElement('div');
  const root = createRoot(box);
  flushSync(() => root.render(drawn));
  const html = box.innerHTML;
  root.unmount();
  return html;
}

// A picture made ready in this visit, which the site does not have yet (images.ts shownAt), in the
// page itself.
async function inline(src: string) {
  const here = shownAt(src);
  if (here === src) return src;
  const blob = await (await fetch(here)).blob();
  return new Promise<string>((done) => {
    const reader = new FileReader();
    reader.onload = () => done(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

// The page on the site, as a document. From the editor's own address too (EDITOR_HOST), which serves
// it with this header (packages/editor/worker/editor-host.js).
async function sitePage(address: string) {
  const res = await fetch(address, { headers: { 'x-editor-preview': '1' } });
  if (!res.ok) throw new Error(t.preview.pageNotLoaded(res.status));
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}

/** The page with the draft in it, as HTML for a frame (PageFrame). */
export async function pageDocument(draft: PageDraft): Promise<string> {
  let doc: Document | null = null;
  let shell = '';
  for (const address of [draft.shell].flat()) {
    const page = await sitePage(address);
    if (page.querySelector('[data-editor="text"]')) {
      doc = page;
      shell = address;
      break;
    }
  }
  if (!doc) throw new Error(t.preview.notHere);
  doc.querySelectorAll('script').forEach((s) => s.remove());
  // Its own addresses as on the site; a link opens nothing (target, and no popups in the frame).
  const base = doc.createElement('base');
  base.href = new URL(shell, location.href).href;
  base.target = '_blank';
  doc.head.prepend(base);

  const heading = doc.querySelector('[data-editor="heading"]');
  if (heading && draft.headingHtml) heading.innerHTML = draft.headingHtml;
  else if (heading && draft.heading !== undefined) heading.textContent = draft.heading;

  const top = doc.querySelector('[data-editor="image"]');
  if (top && draft.image !== undefined) {
    const { src } = splitPicture(draft.image?.src ?? '');
    // The layout leaves out a picture that is also in the text (heroImage in packages/editor/site/images.mjs).
    if (!src || (draft.body ?? '').includes(src)) top.remove();
    else {
      top.querySelectorAll('source').forEach((s) => s.remove());
      const img = top.querySelector('img');
      if (img) {
        for (const a of ['srcset', 'sizes', 'width', 'height']) img.removeAttribute(a);
        img.src = src;
        img.alt = draft.image!.alt;
      }
    }
  }

  if (draft.body !== undefined) {
    // A page's H1 at the top of its text is drawn in its own place above (draft.heading), as on the site.
    let html = await markdownHtml(pageH1(draft.body).rest);
    // A block that ends the text, where the layout puts it.
    const end = doc.querySelector('[data-editor="end"]');
    const type = end?.getAttribute('data-editor-block');
    const last = type ? html.match(new RegExp(`<div data-block="${type}"(?: data-props="[^"]*")?\\s*></div>\\s*$`)) : null;
    const block = last && parseBlock(last[0]);
    if (end && block && !block.props.hidden) {
      html = html.slice(0, last!.index);
      end.innerHTML = blockHtml(block.type, block.props, draft.data);
    } else end?.remove();
    const text = doc.querySelector('[data-editor="text"]')!;
    text.innerHTML = splitBlocks(
      html,
      siteBlocks.map((b) => b.type),
    )
      .map((p) => ('html' in p ? p.html : blockHtml(p.type, p.props, draft.data)))
      .join('');
  }

  await Promise.all(
    [...doc.querySelectorAll('img')].map(async (img) => img.setAttribute('src', await inline(img.getAttribute('src') ?? ''))),
  );
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

type WindowSizeClass = 'compact' | 'medium' | 'expanded' | 'large' | 'xlarge';
const WINDOW_SIZES: Record<WindowSizeClass, { width: number; label: string }> = {
  compact: { width: 390, label: 'Compact' },
  medium: { width: 700, label: 'Medium' },
  expanded: { width: 1024, label: 'Expanded' },
  large: { width: 1280, label: 'Large' },
  xlarge: { width: 1600, label: 'Extra Large' },
};

/** The sheet with the preview, and how to open it with a draft (made when it opens). */
export function usePagePreview(): [(draft: () => PageDraft | null) => void, ReactNode] {
  const dialog = useRef<HTMLDialogElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const [device, setDevice] = useState<WindowSizeClass>('compact');
  const run = useRef(0);

  function open(make: () => PageDraft | null) {
    const draft = make();
    if (!draft) return;
    const n = ++run.current;
    setHtml(null);
    setProblem('');
    dialog.current?.showModal();
    pageDocument(draft).then(
      (page) => n === run.current && setHtml(page),
      (e) => n === run.current && setProblem(t.preview.failed((e as Error).message)),
    );
  }

  const close = () => dialog.current?.close();
  const sheet = (
    <BottomSheet
      full
      ref={dialog}
      aria-label={t.preview.title}
      onClick={(e) => e.target === dialog.current && close()}
      onClose={() => run.current++}
    >
      <SheetTitle title={t.preview.title} onClose={close} />
      <div className="px-5 pb-3">
        <SegmentedButton
          label={t.preview.device}
          value={device}
          options={[
            { value: 'compact', label: 'Compact (390px)', icon: DeviceMobile },
            { value: 'medium', label: 'Medium (700px)', icon: DeviceMobile },
            { value: 'expanded', label: 'Expanded (1024px)', icon: Desktop },
            { value: 'large', label: 'Large (1280px)', icon: Desktop },
            { value: 'xlarge', label: 'Extra Large (1600px)', icon: Desktop },
          ]}
          onChange={setDevice}
        />
      </div>
      {html ? (
        <PageFrame html={html} width={WINDOW_SIZES[device].width} title={t.preview.title} />
      ) : (
        <p className="px-5 text-muted">{problem || t.preview.making}</p>
      )}
    </BottomSheet>
  );
  return [open, sheet];
}
