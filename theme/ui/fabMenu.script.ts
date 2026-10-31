// What a FAB menu (FabMenu.tsx) does on the site: its FAB opens and closes its actions (aria-expanded, the list's
// hidden), and while they are open its name is the cross's (data-close-label), else its own (data-label). Opened with a
// key, the focus goes to the first action; the arrow keys go between them, Home and End to the first and the last;
// Escape closes it and goes back to the FAB, and a choice, a tap outside it or the focus moving out close it. Run on
// every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without a FAB menu on the page it does
// nothing.
export default function fabMenu() {
  document.querySelectorAll<HTMLElement>('[data-fab-menu]').forEach((root) => {
    const button = root.querySelector<HTMLButtonElement>('.fab-menu-button');
    const list = root.querySelector<HTMLElement>('.fab-menu-list');
    if (!button || !list) return;
    const items = () => [...list.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')];
    const isOpen = () => button.getAttribute('aria-expanded') === 'true';

    const outside = (e: PointerEvent) => {
      if (!root.contains(e.target as Node)) set(false);
    };
    function set(open: boolean, focus?: 'first' | 'button') {
      button!.setAttribute('aria-expanded', String(open));
      const name = open ? button!.dataset.closeLabel : button!.dataset.label;
      if (name) button!.setAttribute('aria-label', name);
      list!.hidden = !open;
      if (open) document.addEventListener('pointerdown', outside, true);
      else document.removeEventListener('pointerdown', outside, true);
      if (focus === 'button') button!.focus();
      else if (focus) items()[0]?.focus();
    }

    button.addEventListener('click', (e) => {
      const open = !isOpen();
      set(open, open && e.detail === 0 ? 'first' : undefined);
    });
    root.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        set(false, 'button');
        return;
      }
      const all = items();
      const at = all.indexOf(document.activeElement as HTMLElement);
      if (at < 0) return;
      const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: all.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      all[(to + all.length) % all.length].focus();
    });
    list.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a[href], button')) set(false);
    });
    // The focus moving to something outside it (Tab); a tap outside is `outside`.
    root.addEventListener('focusout', (e) => {
      const to = e.relatedTarget as Node | null;
      if (isOpen() && to && !root.contains(to)) set(false);
    });
  });
}
