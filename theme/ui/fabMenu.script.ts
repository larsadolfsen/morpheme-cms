// What a FAB menu (FabMenu.tsx) does: its FAB opens and closes its actions (aria-expanded, the list's hidden), and
// while they are open its name is the cross's (data-close-label), else its own (data-label). Opened with a key, the
// focus goes to the first action; the arrow keys go between them, Home and End to the first and the last; Escape
// closes it and goes back to the FAB, and a choice, a tap outside it or the focus moving out close it. setUpFabMenu does
// it for one menu (the editor's FabMenu in ui.tsx, which undoes it when the menu goes); the default export for every
// menu on a site page, run by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts).

/** Makes one FAB menu (its [data-fab-menu] element) open and close; returns what undoes it (every listener removed). */
export function setUpFabMenu(root: HTMLElement): () => void {
  const button = root.querySelector<HTMLButtonElement>('.fab-menu-button');
  const list = root.querySelector<HTMLElement>('.fab-menu-list');
  if (!button || !list) return () => {};
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

  const toggle = (e: MouseEvent) => {
    const open = !isOpen();
    set(open, open && e.detail === 0 ? 'first' : undefined);
  };
  const keys = (e: KeyboardEvent) => {
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
  };
  const choice = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a[href], button')) set(false);
  };
  // The focus moving to something outside it (Tab); a tap outside is `outside`.
  const left = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (isOpen() && to && !root.contains(to)) set(false);
  };

  button.addEventListener('click', toggle);
  root.addEventListener('keydown', keys);
  list.addEventListener('click', choice);
  root.addEventListener('focusout', left);
  return () => {
    button.removeEventListener('click', toggle);
    root.removeEventListener('keydown', keys);
    list.removeEventListener('click', choice);
    root.removeEventListener('focusout', left);
    document.removeEventListener('pointerdown', outside, true);
  };
}

export default function fabMenu() {
  document.querySelectorAll<HTMLElement>('[data-fab-menu]').forEach((root) => setUpFabMenu(root));
}
