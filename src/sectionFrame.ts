// What the editor draws of an H1 or H2 section of a page or blog post: the dotted line at the start of each H2 section
// (data-section-part=start), the focus frame of the section the cursor is in (data-section-focus), and, for a section with a colour, a box round all its parts as the site draws it
// (data-section-box=start|middle|end|only and data-section-color on each top-level node), and the image behind it (an image
// box behind its parts, sized by placeBackdrops; data-section-width when it goes across the whole window). editor.css draws them. Exposes sectionFrame (a
// Milkdown plugin). Uses lib/section-ranges.mjs, src/sectionBackdrop.mjs, src/sectionState.mjs and src/images.ts.
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { NodeSelection, Plugin, type Selection } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet, type EditorView } from '@milkdown/kit/prose/view';
import { drawnAddress, isSafeImage } from '../lib/section-marker.mjs';
import { partKind, sectionPart, sectionRanges } from '../lib/section-ranges.mjs';
import { shownAt } from './images';
import { backdropBox } from './sectionBackdrop.mjs';
import { sectionOf } from './sectionState.mjs';

type Range = { from: number; to: number };

// The image behind a section: a box behind its parts, sized to them by placeBackdrops (not editable text).
function imageStrip(src: string, alt: string, color: string | null, width: string | null, last: number): HTMLElement {
  const strip = document.createElement('div');
  strip.className = 'mo-editor-section-picture';
  if (color) strip.dataset.color = color;
  if (width === 'full') strip.dataset.width = 'full';
  strip.dataset.last = String(last);
  strip.contentEditable = 'false';
  // Only an address the marker's validator accepts is drawn (lib/section-marker.mjs): a path on the site or an https address.
  if (!isSafeImage(src)) return strip;
  // The address drawn is rebuilt and checked again here, right before it is set (drawnAddress): a path on the site, an https address, or the
  // browser's own blob address of an image made in this visit (shownAt), written again from the allowed characters only.
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
    const { color, image, alt, width } = sectionOf(nodes, range);
    const boxed = !!color || !!image;
    const out: Decoration[] = [];
    parts.slice(range.from, range.to + 1).forEach(({ node, pos }, i) => {
      const index = range.from + i;
      const attrs: Record<string, string> = {};
      // Only an H2 section has a line (an H1 starts the page, a label before the heading is part of its section), and the first section of the
      // text has none above it: nothing is above it to be told from.
      if (isH2 && index === range.from && range.from > 0) attrs['data-section-part'] = 'start';
      if (boxed) {
        attrs['data-section-box'] = sectionPart(index, range);
        if (color) attrs['data-section-color'] = color;
        if (width === 'full') attrs['data-section-width'] = 'full';
        if (image) attrs['data-section-picture'] = '';
      }
      if (Object.keys(attrs).length) out.push(Decoration.node(pos, pos + node.nodeSize, attrs));
    });
    if (image)
      out.push(
        Decoration.widget(parts[range.from].pos, () => imageStrip(image, alt ?? '', color, width, parts[range.to].pos), {
          side: -1,
          key: `image:${image}:${alt}:${color}:${width}:${parts[range.to].pos}`,
        }),
      );
    return out;
  });
}

/** The focus lines of the section the cursor is in: horizontal only, at its top and its bottom (a section is text; the page's blocks keep their own
 *  dotted frame and are no part of one, so a block neither starts nor ends a section). data-section-focus=start|middle|end|only is on each text
 *  node of the section; editor.css draws the section's own line above it in the focus colour, and a bottom line under its last text node
 *  (data-section-bottom) unless the next section's own line is right below it, which then takes the colour (data-section-focus-below on its
 *  first node). The section is the H1 or H2 section holding the cursor; text before the first one is the page's top part; a page with none is
 *  one section. editor.css draws them only while the text itself has the focus. A selected block (a node selection) has its own outline,
 *  so no section is marked then. */
function focusDecorations(doc: Node, selection: Selection): Decoration[] {
  if (selection instanceof NodeSelection || doc.childCount === 0) return [];
  const nodes: Node[] = [];
  doc.forEach((node) => void nodes.push(node));
  const at = Math.min(selection.$from.index(0), nodes.length - 1);
  const ranges: Range[] = sectionRanges(nodes.map((node) => ({ kind: partKind(node.type.name, node.attrs.level) })));
  // Text before the first section is the top part; the gaps are none, a range runs to the next one's start.
  const all: Range[] =
    ranges.length && ranges[0].from > 0
      ? [{ from: 0, to: ranges[0].from - 1 }, ...ranges]
      : ranges.length
        ? ranges
        : [{ from: 0, to: nodes.length - 1 }];
  const which = all.findIndex((r) => at >= r.from && at <= r.to);
  if (which < 0) return [];
  const range = all[which];
  const isBlock = (node: Node) => node.type.name === 'siteBlock';
  const starts: number[] = [];
  let pos = 0;
  nodes.forEach((node, index) => {
    starts.push(pos);
    pos += node.nodeSize;
  });
  // The section's text: its parts without the blocks, the last of them ends it.
  const text: number[] = [];
  for (let i = range.from; i <= range.to; i++) if (!isBlock(nodes[i])) text.push(i);
  if (!text.length) return [];
  const last = text[text.length - 1];
  const next = all[which + 1];
  const nextNode = next ? nodes[next.from] : undefined;
  const nextHeading = nextNode?.type.name === 'eyebrow' ? nodes[next!.from + 1] : nextNode;
  const nextLine = !!next && nextHeading?.type.name === 'heading' && nextHeading.attrs.level === 2;
  const out: Decoration[] = [];
  text.forEach((index) => {
    const part = sectionPart(index, { from: text[0], to: last });
    const attrs: Record<string, string> = { 'data-section-focus': part };
    if (index === last && !nextLine) attrs['data-section-bottom'] = '';
    out.push(Decoration.node(starts[index], starts[index] + nodes[index].nodeSize, attrs));
  });
  if (next && nextLine)
    out.push(Decoration.node(starts[next.from], starts[next.from] + nodes[next.from].nodeSize, { 'data-section-focus-below': '' }));
  return out;
}

// Puts each image box over its section: from the top of its first part to the bottom of its last (the box is absolute in the text).
function placeBackdrops(view: EditorView) {
  const host = view.dom as HTMLElement;
  const hostRect = host.getBoundingClientRect();
  host.querySelectorAll<HTMLElement>(':scope > .mo-editor-section-picture').forEach((strip) => {
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
        props: {
          decorations: ({ doc, selection }) =>
            DecorationSet.create(doc, [...(on ? [...sectionDecorations(doc)] : []), ...focusDecorations(doc, selection)]),
        },
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
