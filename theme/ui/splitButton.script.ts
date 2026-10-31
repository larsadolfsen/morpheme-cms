// What a split button (SplitButton.tsx) does on the site: its arrow opens and closes its menu (aria-expanded, the menu's
// hidden). The arrow keys open it from the arrow (down on the first item, up on the last) and go between its items, Home
// and End to the first and the last; Escape closes it and goes back to the arrow, and so does a choice; a tap outside it
// or the focus moving out closes it. Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts);
// without a split button on the page it does nothing.
export default function splitButton() {
  document.querySelectorAll<HTMLElement>('[data-split-button]').forEach((root) => {
    const toggle = root.querySelector<HTMLButtonElement>('[data-split-button-toggle]');
    const menu = root.querySelector<HTMLElement>('[data-split-button-menu]');
    if (!toggle || !menu) return;
    const items = () => [...menu.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')];
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    const outside = (e: PointerEvent) => {
      if (!root.contains(e.target as Node)) set(false);
    };
    function set(open: boolean, focus?: 'first' | 'last' | 'toggle') {
      toggle!.setAttribute('aria-expanded', String(open));
      menu!.hidden = !open;
      if (open) document.addEventListener('pointerdown', outside, true);
      else document.removeEventListener('pointerdown', outside, true);
      if (focus === 'toggle') toggle!.focus();
      else if (focus) {
        const list = items();
        list[focus === 'first' ? 0 : list.length - 1]?.focus();
      }
    }

    // Opened with a key (a click without a pointer: Enter, Space), the focus goes to the first item.
    toggle.addEventListener('click', (e) => {
      const open = !isOpen();
      set(open, open && e.detail === 0 ? 'first' : undefined);
    });
    root.addEventListener('keydown', (e) => {
      if (e.target === toggle && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        set(true, e.key === 'ArrowDown' ? 'first' : 'last');
        return;
      }
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        set(false, 'toggle');
        return;
      }
      const list = items();
      const at = list.indexOf(document.activeElement as HTMLElement);
      if (at < 0) return;
      const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      list[(to + list.length) % list.length].focus();
    });
    menu.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a[href], button')) set(false, 'toggle');
    });
    // The focus moving to something outside it (Tab); a tap outside is `outside`.
    root.addEventListener('focusout', (e) => {
      const to = e.relatedTarget as Node | null;
      if (isOpen() && to && !root.contains(to)) set(false);
    });
  });
}
