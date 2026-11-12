// What a navigation rail (NavigationRail.tsx) does on the site: its menu button, and any other button that opens it
// (data-navigation-rail-menu with aria-controls, the rail's id: for a rail that hides while it is collapsed), expands
// and collapses it (data-expanded on the rail, aria-expanded on the buttons), and its FAB shows its label only while it
// is expanded (data-collapsed). A modal one (.navigation-rail-modal) shows its scrim while it is expanded, and the scrim,
// Escape and following one of its links collapse it again. When it collapses with the focus in it and it hides
// (.navigation-rail-hide), the focus goes back to the button that opened it. Run on every page by the theme's Base.astro
// (blockScripts, packages/editor/site/blockScripts.ts); without a rail it does nothing.
export default function navigationRail() {
  document.querySelectorAll<HTMLElement>('[data-navigation-rail]').forEach((rail) => {
    const scrim = rail.previousElementSibling?.matches('[data-navigation-rail-scrim]')
      ? (rail.previousElementSibling as HTMLElement)
      : null;
    const modal = rail.classList.contains('navigation-rail-modal');
    const hides = rail.classList.contains('navigation-rail-hide');
    const inside = rail.querySelector<HTMLButtonElement>('[data-navigation-rail-menu]');
    const outside = rail.id
      ? [...document.querySelectorAll<HTMLButtonElement>(`[data-navigation-rail-menu][aria-controls="${CSS.escape(rail.id)}"]`)]
      : [];
    const menus = [inside, ...outside].filter((menu): menu is HTMLButtonElement => !!menu);
    let opener: HTMLButtonElement | null = null;

    const set = (expanded: boolean) => {
      rail.toggleAttribute('data-expanded', expanded);
      for (const menu of menus) menu.setAttribute('aria-expanded', String(expanded));
      rail.querySelectorAll('.navigation-rail-header > .extended-fab').forEach((fab) => fab.toggleAttribute('data-collapsed', !expanded));
      if (scrim) scrim.hidden = !expanded;
      if (!expanded && hides && rail.contains(document.activeElement)) (opener ?? outside[0])?.focus();
    };

    for (const menu of menus)
      menu.addEventListener('click', () => {
        const expanded = !rail.hasAttribute('data-expanded');
        opener = expanded && menu !== inside ? menu : opener;
        set(expanded);
        // Opened from outside, the focus moves into it, to its own menu button.
        if (expanded && menu !== inside) inside?.focus();
      });
    if (!modal) return;
    scrim?.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && rail.hasAttribute('data-expanded')) set(false);
    });
    rail.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.navigation-rail-item')) set(false);
    });
  });
}
