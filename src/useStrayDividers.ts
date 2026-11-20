// Hides the dividers (marked data-divider) that stand first or last on a line of a wrapping row, with visibility: hidden so
// the widths stay and the row does not wrap again. Exposes useStrayDividers. It measures the row's items by their
// vertical centre (the decision is strayDividers in lib/strayDividers.mjs); a ResizeObserver on the row measures again when it
// wraps differently. The style is set on the elements, with no re-render.
import { useLayoutEffect, type RefObject } from 'react';
import { strayDividers } from '../lib/strayDividers.mjs';

export default function useStrayDividers(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    const measure = () => {
      const items = [...row.children] as HTMLElement[];
      const stray = new Set(strayDividers(items.map((el) => el.offsetTop + el.offsetHeight / 2)));
      items.forEach((el, i) => {
        if (el.dataset.divider !== undefined) el.style.visibility = stray.has(i) ? 'hidden' : '';
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [ref]);
}
