// Which top-level parts of a page's or blog post's text form H2 sections, for the editor's dotted frame.
// Exposes sectionRanges, sectionPart and partKind. Pure, no dependencies (used by src/sectionFrame.ts).

/** The kind of a part, from its ProseMirror node name and heading level; the label is the eyebrow line before a heading. */
export function partKind(typeName, level) {
  if (typeName === 'heading') return level === 1 ? 'h1' : level === 2 ? 'h2' : 'other';
  return typeName === 'eyebrow' ? 'label' : 'other';
}

/**
 * The sections of a text: each H2 (with a label directly before it) and every part after it up to the next H2, the next H1
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
    const next = parts[i + 1]?.kind;
    if (part.kind === 'label') {
      if (next === 'h2') {
        close(i - 1);
        from = i;
      } else if (next === 'h1') close(i - 1);
    } else if (part.kind === 'h2') {
      if (parts[i - 1]?.kind !== 'label') {
        close(i - 1);
        from = i;
      }
    } else if (part.kind === 'h1') close(i - 1);
  });
  close(parts.length - 1);
  return ranges;
}

/** Where a part is in its section: 'start', 'middle', 'end', or 'only' for a section of one part. */
export function sectionPart(index, { from, to }) {
  if (from === to) return 'only';
  return index === from ? 'start' : index === to ? 'end' : 'middle';
}
