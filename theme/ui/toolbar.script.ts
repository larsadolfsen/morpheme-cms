// What a toolbar (Toolbar.tsx, toolbarClass, role="toolbar") does on the site: it is one stop for Tab, and the arrow
// keys (left and right, up and down on a vertical one) and Home and End move between its actions (WAI-ARIA's toolbar
// pattern). Run on every page by the theme's Base.astro (blockScripts, src/site/scripts.ts); without a toolbar it does
// nothing.
const actions = 'a[href], button:not(:disabled), input:not(:disabled)';

export default function toolbar() {
  document.querySelectorAll<HTMLElement>('.toolbar[role="toolbar"]').forEach((bar) => {
    const items = () => [...bar.querySelectorAll<HTMLElement>(actions)].filter((el) => el.closest('[role="toolbar"]') === bar);
    const vertical = bar.getAttribute('aria-orientation') === 'vertical';
    // The one Tab stops at: the one last moved to (at first the first).
    const pick = (to: HTMLElement) => items().forEach((el) => (el.tabIndex = el === to ? 0 : -1));
    const first = items()[0];
    if (first) pick(first);

    bar.addEventListener('focusin', (e) => {
      const at = items().find((el) => el === e.target);
      if (at) pick(at);
    });
    bar.addEventListener('keydown', (e) => {
      const all = items();
      const at = all.indexOf(document.activeElement as HTMLElement);
      if (at < 0) return;
      const back = vertical ? 'ArrowUp' : 'ArrowLeft';
      const next = vertical ? 'ArrowDown' : 'ArrowRight';
      const to =
        e.key === next
          ? (at + 1) % all.length
          : e.key === back
            ? (at - 1 + all.length) % all.length
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? all.length - 1
                : -1;
      // In a field in it, the keys move the caret as usual.
      if (to < 0 || all[at] instanceof HTMLInputElement) return;
      e.preventDefault();
      pick(all[to]);
      all[to].focus();
    });
  });
}
