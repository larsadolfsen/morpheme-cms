// What a search (Search.tsx) does on the site: its bar opens the search view (a modal <dialog>: over the whole screen
// on a phone, docked where the bar is from 48rem, .search-view-docked with --search-view-top, -left and -width), with the
// focus in its field; the back button, Escape and a tap outside close it, and the focus goes back to the bar. What is
// written narrows the results to those whose text has it (the message .search-view-empty when none has), the arrow keys
// move through them (aria-activedescendant on the field, aria-selected on the option), and Enter follows the one they
// are on. The page under it does not scroll while it is open. Run on every page by the theme's Base.astro
// (blockScripts, packages/editor/site/blockScripts.ts); without a search it does nothing.
const fold = (text: string) => text.toLocaleLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').trim();

export default function search() {
  const wide = matchMedia('(width >= 48rem)');

  document.querySelectorAll<HTMLElement>('[data-search]').forEach((search) => {
    const bar = search.querySelector<HTMLElement>('.search-bar');
    const opener = search.querySelector<HTMLButtonElement>('[data-search-open]');
    const view = search.querySelector<HTMLDialogElement>('[data-search-view]');
    const input = view?.querySelector<HTMLInputElement>('[data-search-input]');
    const empty = view?.querySelector<HTMLElement>('[data-search-empty]');
    if (!bar || !opener || !view || !input) return;
    const options = [...view.querySelectorAll<HTMLElement>('[data-search-option]')];
    const shown = () => options.filter((o) => !o.closest('li')!.hidden);
    let active: HTMLElement | undefined;

    const place = () => {
      view.classList.toggle('search-view-docked', wide.matches);
      if (!wide.matches) return;
      const at = bar.getBoundingClientRect();
      view.style.setProperty('--search-view-top', `${at.top}px`);
      view.style.setProperty('--search-view-left', `${at.left}px`);
      view.style.setProperty('--search-view-width', `${at.width}px`);
    };
    const choose = (option?: HTMLElement) => {
      active?.setAttribute('aria-selected', 'false');
      active = option;
      if (option) {
        option.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    };
    const narrow = () => {
      const q = fold(input.value);
      for (const o of options) o.closest('li')!.hidden = !!q && !fold(o.textContent ?? '').includes(q);
      if (empty) empty.hidden = shown().length > 0;
      choose(undefined);
    };

    const open = () => {
      if (view.open) return;
      place();
      view.showModal();
      opener.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      input.focus();
    };
    const close = () => {
      if (!view.open) return;
      view.close();
    };
    view.addEventListener('close', () => {
      opener.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      choose(undefined);
      opener.focus();
    });

    opener.addEventListener('click', open);
    view.querySelector('[data-search-close]')?.addEventListener('click', close);
    view.querySelector('[data-search-clear]')?.addEventListener('click', () => {
      input.value = '';
      narrow();
      input.focus();
    });
    // A tap outside it (on the backdrop) closes it.
    view.addEventListener('click', (e) => {
      if (e.target === view) close();
    });
    addEventListener('resize', () => view.open && place(), { passive: true });
    input.addEventListener('input', narrow);
    input.addEventListener('keydown', (e) => {
      const list = shown();
      if (!list.length) return;
      const at = active ? list.indexOf(active) : -1;
      if (e.key === 'ArrowDown') choose(list[(at + 1) % list.length]);
      else if (e.key === 'ArrowUp') choose(list[at <= 0 ? list.length - 1 : at - 1]);
      else if (e.key === 'Enter' && active) active.click();
      else return;
      e.preventDefault();
    });
    narrow();
  });
}
