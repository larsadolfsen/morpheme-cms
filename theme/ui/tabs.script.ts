// What a tab list (Tabs.tsx with `label`, a role="tablist" of <button role="tab">) does on the site: a tab shows its
// panel (aria-controls, the panel's id) and hides the others' (hidden), and is the open one (aria-selected); the row is
// one stop for Tab, and the arrow keys, Home and End move to another tab and open it (WAI-ARIA's tabs pattern), which
// is scrolled into view when the row is scrollable. Tabs that are links (the bar of "Mobilmenu") lead to their pages and
// are left alone. Run on every page by the theme's Base.astro (blockScripts, src/site/scripts.ts); without a tab list it
// does nothing.
export default function tabs() {
  document.querySelectorAll<HTMLElement>('.tabs[role="tablist"]').forEach((list) => {
    const all = () =>
      [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter((tab) => tab.closest('[role="tablist"]') === list);
    const open = (to: HTMLButtonElement, scroll = true) => {
      for (const tab of all()) {
        const on = tab === to;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = tab.getAttribute('aria-controls');
        if (panel) document.getElementById(panel)?.toggleAttribute('hidden', !on);
      }
      // Only the row scrolls, never the page.
      if (!scroll) return;
      const tab = to.getBoundingClientRect();
      const row = list.getBoundingClientRect();
      if (tab.left < row.left) list.scrollLeft -= row.left - tab.left;
      else if (tab.right > row.right) list.scrollLeft += tab.right - row.right;
    };
    // As drawn: the panels of the tabs that are not open hidden.
    const first = all().find((tab) => tab.getAttribute('aria-selected') === 'true') ?? all()[0];
    if (first) open(first, false);

    list.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
      if (tab && all().includes(tab)) open(tab);
    });
    list.addEventListener('keydown', (e) => {
      const tabs = all();
      const at = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (at < 0) return;
      const rtl = getComputedStyle(list).direction === 'rtl';
      const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
      const to =
        step !== undefined ? (at + step + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (to < 0) return;
      e.preventDefault();
      open(tabs[to]);
      tabs[to].focus();
    });
  });
}
