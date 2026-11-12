// What the editor draws of an H1 or H2 section of a page or blog post: the dotted line at the start of each H2 section
// (data-section-part=start), and, for a section with a colour, a box round all its parts as the site draws it
// (data-section-box=start|middle|end|only and data-section-color on each top-level node), and the picture behind it (a picture
// box behind its parts, sized by placeBackdrops; data-section-width when it goes across the whole window). editor.css draws them. Exposes sectionFrame (a
// Milkdown plugin). Uses lib/section-ranges.mjs, src/sectionBackdrop.mjs, src/sectionState.mjs and src/images.ts.
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet, type EditorView } from '@milkdown/kit/prose/view';
import { drawnAddress, isSafePicture } from '../lib/section-marker.mjs';
import { partKind, sectionPart, sectionRanges } from '../lib/section-ranges.mjs';
import { shownAt } from './images';
import { backdropBox } from './sectionBackdrop.mjs';
import { sectionOf } from './sectionState.mjs';

type Range = { from: number; to: number };

// The picture behind a section: a box behind its parts, sized to them by placeBackdrops (not editable text).
function pictureStrip(src: string, alt: string, color: string | null, width: string | null, last: number): HTMLElement {
  const strip = document.createElement('div');
  strip.className = 'editor-section-picture';
  if (color) strip.dataset.color = color;
  if (width === 'full') strip.dataset.width = 'full';
  strip.dataset.last = String(last);
  strip.contentEditable = 'false';
  // Only an address the marker's validator accepts is drawn (lib/section-marker.mjs): a path on the site or an https address.
  if (!isSafePicture(src)) return strip;
  // The address drawn is rebuilt and checked again here, right before it is set (drawnAddress): a path on the site, an https address, or the
  // browser's own blob address of a picture made in this visit (shownAt), written again from the allowed characters only.
  const img = document.createElement('img');
  const drawn = drawnAddress(shownAt(src), location.origin);
  if (drawn === null) return strip;
  img.src = drawn;
  img.setAttribute('alt', alt);
  img.draggable = false;
  strip.append(img);
  return strip;
}

/** The decorations of a document's sections. */
function sectionDecorations(doc: Node): Decoration[] {
  const parts: { node: Node; pos: number }[] = [];
  doc.forEach((node, pos) => void parts.push({ node, pos }));
  const nodes = parts.map(({ node }) => node);
  const ranges: Range[] = sectionRanges(nodes.map((node) => ({ kind: partKind(node.type.name, node.attrs.level) })));
  return ranges.flatMap((range) => {
    const first = nodes[range.from];
    const heading = first.type.name === 'eyebrow' ? nodes[range.from + 1] : first;
    const isH2 = heading?.type.name === 'heading' && heading.attrs.level === 2;
    const { color, picture, alt, width } = sectionOf(nodes, range);
    const boxed = !!color || !!picture;
    const out: Decoration[] = [];
    parts.slice(range.from, range.to + 1).forEach(({ node, pos }, i) => {
      const index = range.from + i;
      const attrs: Record<string, string> = {};
      // Only an H2 section has a line (an H1 starts the page, a label before the heading is part of its section).
      if (isH2 && index === range.from) attrs['data-section-part'] = 'start';
      if (boxed) {
        attrs['data-section-box'] = sectionPart(index, range);
        if (color) attrs['data-section-color'] = color;
        if (width === 'full') attrs['data-section-width'] = 'full';
        if (picture) attrs['data-section-picture'] = '';
      }
      if (Object.keys(attrs).length) out.push(Decoration.node(pos, pos + node.nodeSize, attrs));
    });
    if (picture)
      out.push(
        Decoration.widget(parts[range.from].pos, () => pictureStrip(picture, alt ?? '', color, width, parts[range.to].pos), {
          side: -1,
          key: `picture:${picture}:${alt}:${color}:${width}:${parts[range.to].pos}`,
        }),
      );
    return out;
  });
}

// Puts each picture box over its section: from the top of its first part to the bottom of its last (the box is absolute in the text).
function placeBackdrops(view: EditorView) {
  const host = view.dom as HTMLElement;
  const hostRect = host.getBoundingClientRect();
  host.querySelectorAll<HTMLElement>(':scope > .editor-section-picture').forEach((strip) => {
    const first = strip.nextElementSibling as HTMLElement | null;
    let last: HTMLElement | null = null;
    try {
      last = view.nodeDOM(Number(strip.dataset.last)) as HTMLElement | null;
    } catch {
      last = null;
    }
    if (!first || !last || !('getBoundingClientRect' in last)) return;
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const box = backdropBox(a, b, hostRect, {
      full: strip.dataset.width === 'full',
      bleed: parseFloat(getComputedStyle(host.parentElement ?? host).paddingLeft) || 0,
    });
    Object.assign(strip.style, { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` });
  });
}

/** on: false for a fixed page's text (MarkdownEditor's `sections`), whose headings are the names of its sections: no frame. */
export const sectionFrame = (on: boolean) =>
  $prose(
    () =>
      new Plugin({
        props: { decorations: on ? ({ doc }) => DecorationSet.create(doc, sectionDecorations(doc)) : () => null },
        view: (view) => {
          let frame = 0;
          const place = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => placeBackdrops(view));
          };
          const resize = new ResizeObserver(place);
          resize.observe(view.dom);
          place();
          return { update: place, destroy: () => (resize.disconnect(), cancelAnimationFrame(frame)) };
        },
      }),
  );
