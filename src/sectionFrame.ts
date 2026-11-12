// What the editor draws of an H1 or H2 section of a page or blog post: the dotted line at the start of each H2 section
// (data-section-part=start), and, for a section with a colour, a box round all its parts as the site draws it
// (data-section-box=start|middle|end|only and data-section-color on each top-level node), and the picture behind it (a picture
// strip at its top, data-section-width when it goes across the whole window). editor.css draws them. Exposes sectionFrame (a
// Milkdown plugin). Uses lib/section-ranges.mjs, src/sectionState.mjs and src/images.ts.
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { isSafePicture, rebuiltAddress } from '../lib/section-marker.mjs';
import { partKind, sectionPart, sectionRanges } from '../lib/section-ranges.mjs';
import { shownAt } from './images';
import { sectionOf } from './sectionState.mjs';

type Range = { from: number; to: number };

// The picture behind a section, as a strip at the top of its box (not editable text).
function pictureStrip(src: string, alt: string): HTMLElement {
  const strip = document.createElement('div');
  strip.className = 'editor-section-picture';
  strip.contentEditable = 'false';
  // Only an address the marker's validator accepts is drawn (lib/section-marker.mjs): a path on the site or an https address.
  if (!isSafePicture(src)) return strip;
  // The address drawn is rebuilt and checked again here, right before it is set: a path on the site, an https address, or the
  // browser's own blob address of a picture made in this visit (shownAt), never a script or data address.
  const url = new URL(shownAt(src), location.origin);
  const img = document.createElement('img');
  let address: string | null = null;
  if (url.origin === location.origin && url.pathname.startsWith('/') && !url.pathname.startsWith('//')) address = url.pathname + url.search;
  else if (url.protocol === 'https:' || url.protocol === 'blob:') address = url.href;
  // Written again from the allowed characters only (lib/section-marker.mjs), so nothing of the original string is assigned.
  const drawn = address === null ? null : rebuiltAddress(address);
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
        Decoration.widget(parts[range.from].pos, () => pictureStrip(picture, alt ?? ''), { side: -1, key: `picture:${picture}:${alt}` }),
      );
    return out;
  });
}

/** on: false for a fixed page's text (MarkdownEditor's `sections`), whose headings are the names of its sections: no frame. */
export const sectionFrame = (on: boolean) =>
  $prose(
    () =>
      new Plugin({
        props: { decorations: on ? ({ doc }) => DecorationSet.create(doc, sectionDecorations(doc)) : () => null },
      }),
  );
