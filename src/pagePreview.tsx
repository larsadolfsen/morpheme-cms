// "Preview" (FormFrame.tsx): a page or a blog post as it looks on the site with what is in its form
// now, at once and without saving, full screen (a Material 3 full-screen dialog, hiding the rest of the editor), at each
// of the site's window sizes or any width (PreviewScreen.tsx).
//
// The page as it is on the site gives everything around what the form changes: the header, the footer,
// the layout and the site's CSS. The site's layouts mark what the form changes (data-editor): the
// heading, the picture at the top (a blog post's), the text, and the place at the end of the page where the layout
// puts a block that ends the text (data-editor="end", with its type in data-editor-block). Only what
// was changed is put in, so the rest is exactly as on the site. The text is the site's Markdown
// (Astro's pipeline, with the HTML written in it), and its blocks are drawn as in the editor
// (registry.tsx preview), with the site's classes; a coloured section, and a coloured H1 with the text up to the first H2 (pageH1Panel.mjs), is a panel as on the site (lib/text-sections.mjs).
//
// Exposes pageDocument, usePagePreview and PageDraft, and for the preview of a part every page has (partPreview.tsx) siteShell,
// documentHtml, htmlOf and PREVIEW_WIDTH.
//
// The page is shown in a frame without scripts (sandbox), so nothing of the site runs on the editor's
// address, where its login is kept, and its links lead nowhere. A new page or post is shown in the
// page of another one. As on the site but for this: a changed text has the pictures themselves (not
// the sizes the build makes), its words are not yet links to other pages (packages/editor/site/autolinks.mjs), and
// a video written in it as HTML is the video.
//
// A post's text starts with its lead, a paragraph drawn larger and before the picture (data-editor="lead",
// theme/layouts/PostLayout.astro; lib/lead.mjs). The preview splits the text the same way, for a post only (postLead.mjs).
import { useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { parseBlock, splitBlocks } from '../lib/blocks.mjs';
import { introOf, sectionClass, sectionsOf } from '../lib/text-sections.mjs';
import { h1Section, withoutH1 } from '../lib/without-h1.mjs';
import { BREAKPOINTS, type Breakpoint } from '../lib/breakpoints.mjs';
import { processor } from '../lib/markdown';
import { splitPicture } from '../lib/crop.mjs';
import { isPostPage, leadFill } from './postLead.mjs';
import { preview as drawBlock, siteBlocks } from './registry';
import { shownAt } from './images';
import { pageH1 } from './sections.mjs';
import { setH1Panel } from './pageH1Panel.mjs';
import type { BlockData } from './blocks';
import { PreviewScreen } from './PreviewScreen';
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
  /** A blog post (not a page): only its text starts with a lead. */
  post?: boolean;
  /** The text, in Markdown with its blocks. */
  body?: string;
  /** What the blocks are drawn with. */
  data: BlockData;
};

// The text as the site makes it (Astro's Markdown, ../lib/markdown.ts), with the site's plugins (packages/editor/astro.mjs)
// but those that read the site's files.
const markdownHtml = async (markdown: string) => String(await processor.process(markdown));

/** What React draws (a block, a part of the header drawn with the theme's components), as HTML. */
export function htmlOf(drawn: ReactNode) {
  if (!drawn) return '';
  const box = document.createElement('div');
  const root = createRoot(box);
  flushSync(() => root.render(drawn));
  const html = box.innerHTML;
  root.unmount();
  return html;
}

// A block drawn as in the editor, as HTML.
const blockHtml = (type: string, props: Record<string, unknown>, data: BlockData) => htmlOf(drawBlock(type, props, data));

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

/** The first of the site's pages (their addresses) that has a part (`has`, a selector), without its scripts and with its own
 * addresses as on the site, for a frame (PageFrame); a link in it opens nothing (target, and no popups in the frame).
 * Also for the preview of a part on every page (partPreview.tsx). */
export async function siteShell(addresses: string | string[], has: string): Promise<Document> {
  for (const address of [addresses].flat()) {
    const doc = await sitePage(address);
    if (!doc.querySelector(has)) continue;
    doc.querySelectorAll('script').forEach((s) => s.remove());
    const base = doc.createElement('base');
    base.href = new URL(address, location.href).href;
    base.target = '_blank';
    doc.head.prepend(base);
    return doc;
  }
  throw new Error(t.preview.notHere);
}

/** A page made ready (siteShell) as HTML for a frame, with the pictures made ready in this visit in it. */
export async function documentHtml(doc: Document): Promise<string> {
  await Promise.all(
    [...doc.querySelectorAll('img')].map(async (img) => img.setAttribute('src', await inline(img.getAttribute('src') ?? ''))),
  );
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

/** The page with the draft in it, as HTML for a frame (PageFrame). */
export async function pageDocument(draft: PageDraft): Promise<string> {
  const doc = await siteShell(draft.shell, '[data-editor="text"]');

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
    // A page's H1 at the top of its text is drawn in its own place above (draft.heading), as on the site; the colour of its
    // section (the marker before it) puts the heading and the text up to the first H2 in one panel (setH1Panel).
    const whole = isPostPage(draft) ? '' : await markdownHtml(draft.body);
    const h1Settings = h1Section(whole);
    let html = isPostPage(draft) ? await markdownHtml(pageH1(draft.body).rest) : withoutH1(whole);
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
    // A post's lead goes before its picture (or before its text when it has none), as in PostLayout.astro.
    const { lead, rest } = leadFill(html, isPostPage(draft));
    let leadBox = doc.querySelector('[data-editor="lead"]');
    if (!lead) leadBox?.remove();
    else {
      if (!leadBox) {
        // The text's own tag and class plus post-lead, as the layout does (a theme may replace the layout).
        leadBox = doc.createElement(text.tagName);
        leadBox.setAttribute('data-editor', 'lead');
        leadBox.className = `${text.className} post-lead`;
        (doc.querySelector('[data-editor="image"]') ?? text).before(leadBox);
      }
      leadBox.innerHTML = lead;
    }
    const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const types = siteBlocks.map((b) => b.type);
    const runs = (part: string) =>
      sectionsOf(part)
        .map((run) => {
          const inner = splitBlocks(run.html, types)
            .map((p) => ('html' in p ? p.html : blockHtml(p.type, p.props, draft.data)))
            .join('');
          if (run.color === null) return inner;
          const picture = run.picture
            ? `<img class="text-section-image" src="${attr(shownAt(run.picture))}" alt="${attr(run.alt ?? '')}">`
            : '';
          return `<section class="${sectionClass(run.color, run)}">${picture}${inner}</section>`;
        })
        .join('');
    // With a column beside the text the panel holds the heading only, as on the site.
    const { intro, rest: below } = h1Settings && !text.closest('[data-side]') ? introOf(rest) : { intro: '', rest };
    setH1Panel(doc, h1Settings, runs(intro), h1Settings?.picture ? shownAt(h1Settings.picture) : undefined);
    text.innerHTML = runs(below);
  }
  return documentHtml(doc);
}

/** The width of the page at each size in a part's preview (partPreview.tsx): the narrowest window the size has, so its
 * tightest layout is seen; compact at a common phone's. */
export const PREVIEW_WIDTH: Record<Breakpoint, number> = { ...BREAKPOINTS, compact: 390 };

// In the full-screen Preview the site's section lines (the dotted line at the start of an H2 section and round a coloured one) show
// only under the pointer, so the page looks as the site does the rest of the time.
const HOVER_LINES = `<style data-editor-preview>
[data-editor="text"] :is(h2, section):hover { outline: 2px dotted color-mix(in srgb, currentColor 40%, transparent); outline-offset: 0.5rem; }
</style>`;

/** The full-screen Preview (a Material 3 full-screen dialog), and how to open it with a draft (made when it opens). */
export function usePagePreview(): [(draft: () => PageDraft | null) => void, ReactNode] {
  const dialog = useRef<HTMLDialogElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const run = useRef(0);

  function open(make: () => PageDraft | null) {
    const draft = make();
    if (!draft) return;
    const n = ++run.current;
    setHtml(null);
    setProblem('');
    dialog.current?.showModal();
    pageDocument(draft).then(
      (page) => n === run.current && setHtml(page.replace('</head>', `${HOVER_LINES}</head>`)),
      (e) => n === run.current && setProblem(t.preview.failed((e as Error).message)),
    );
  }

  const close = () => dialog.current?.close();
  const screen = (
    <dialog ref={dialog} className="editor-preview-screen" aria-label={t.preview.title} onClose={() => run.current++}>
      <PreviewScreen html={html} message={problem || t.preview.making} title={t.preview.title} onClose={close} />
    </dialog>
  );
  return [open, screen];
}
