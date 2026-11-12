// Which top-level parts of a page's or blog post's text form sections (an H1 or an H2 starts one), for the editor's dotted frame.
// Exposes sectionRanges, sectionPart and partKind. Pure, no dependencies (used by src/sectionFrame.ts).

/** The kind of a part, from its ProseMirror node name and heading level; the label is the eyebrow line before a heading. */
export function partKind(typeName, level) {
  if (typeName === 'heading') return level === 1 ? 'h1' : level === 2 ? 'h2' : 'other';
  return typeName === 'eyebrow' ? 'label' : 'other';
}

const startsSection = (kind) => kind === 'h1' || kind === 'h2';

/**
 * The sections of a text: each H1 or H2 (with a label directly before it) and every part after it up to the next H1 or H2
 * or the end. `parts` is the top-level parts in order; the result has the index of each section's first and last part.
 */
export function sectionRanges(parts) {
  const ranges = [];
  let from = -1;
  const close = (to) => {
    if (from >= 0 && to >= from) ranges.push({ from, to });
    from = -1;
  };
  parts.forEach((part, i) => {
    const starts = part.kind === 'label' ? startsSection(parts[i + 1]?.kind) : startsSection(part.kind) && parts[i - 1]?.kind !== 'label';
    if (!starts) return;
    close(i - 1);
    from = i;
  });
  close(parts.length - 1);
  return ranges;
}

/** Where a part is in its section: 'start', 'middle', 'end', or 'only' for a section of one part. */
export function sectionPart(index, { from, to }) {
  if (from === to) return 'only';
  return index === from ? 'start' : index === to ? 'end' : 'middle';
}
