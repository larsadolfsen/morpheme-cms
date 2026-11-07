// Gives a screen's <main> data-clearance="true" while its content pushes the footer below the window (so the floating action
// button has room under it) and "false" while the footer sits at the bottom of the window. Exposes useFooterClearance. It
// measures the page with the clearance off, so the answer cannot flip back and forth; the decision is needsClearance in
// lib/footerClearance.mjs. The attribute is set on the element, with no re-render.
import { useLayoutEffect, type RefObject } from 'react';
import { needsClearance } from '../lib/footerClearance.mjs';

export default function useFooterClearance(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const main = ref.current;
    if (!main) return;
    // The page's layout height (offsetHeight), not scrollHeight: that counts a screen's entrance animation, which moves it a few px.
    const measure = () => {
      main.dataset.clearance = 'false';
      const root = document.documentElement;
      main.dataset.clearance = String(needsClearance(document.body.offsetHeight, root.clientHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    // Watch the parts inside <main> and what lies beside it and its ancestors (the top bar), not <main> itself: their
    // size does not depend on the clearance, so a change in them is a real change of the page.
    for (let el: Element | null = main; el && el !== document.documentElement; el = el.parentElement)
      for (const part of el === main ? el.children : (el.parentElement?.children ?? [])) observer.observe(part);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref]);
}
