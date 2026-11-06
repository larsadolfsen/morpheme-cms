// Measures the text toolbar's line (MarkdownEditor.tsx): marks the tools past the first line and tells when the arrow is needed.
// Exposes useToolbarLines (overflows, expanded, setExpanded). Depends on toolbarLines.mjs; measures when `deps` change, and on resize.
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toolbarLines } from './toolbarLines.mjs';

/** For the bar `bar` with its line of tools `line`: the tools past the first line get data-wrapped (and a line between
 * groups at a line break data-line-start or data-line-end). `overflows` is true when they do not all fit on one line;
 * `expanded` is the user's choice to show the second line. It measures when `deps` (what changes the tools or their
 * widths) change, and on every resize of the bar, but not on every render. */
export function useToolbarLines(bar: RefObject<HTMLElement | null>, line: RefObject<HTMLElement | null>, deps: readonly unknown[]) {
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const measure = useRef(() => {});
  measure.current = () => {
    const barEl = bar.current;
    const row = line.current;
    if (!barEl || !row) return;
    const els = ([...row.children] as HTMLElement[]).filter((el) => !el.hasAttribute('popover'));
    const barStyle = getComputedStyle(barEl);
    const room = barEl.clientWidth - parseFloat(barStyle.paddingLeft) - parseFloat(barStyle.paddingRight);
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    // By the middle of each, as the lines between the groups are shorter than the buttons.
    const items = els.map((el) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        width: box.width,
        margins: parseFloat(style.marginLeft) + parseFloat(style.marginRight),
        middle: box.top + box.height / 2,
      };
    });
    const result = toolbarLines(items, gap, room);
    setOverflows(result.overflows);
    els.forEach((el, i) => {
      el.toggleAttribute('data-wrapped', result.marks[i].wrapped);
      el.toggleAttribute('data-line-start', result.marks[i].lineStart);
      el.toggleAttribute('data-line-end', result.marks[i].lineEnd);
    });
  };
  useLayoutEffect(() => measure.current(), deps);
  useEffect(() => {
    const watch = new ResizeObserver(() => measure.current());
    watch.observe(bar.current!);
    return () => watch.disconnect();
  }, [bar]);
  // With no arrow, the second line cannot be open: it starts closed when the arrow comes back.
  useEffect(() => {
    if (!overflows) setExpanded(false);
  }, [overflows]);
  return { overflows, expanded, setExpanded };
}
