// The editor's preview of the header (HeaderSettings.tsx): what the header's settings in the form change (headerDraft),
// and those changes put into the site's page (swapHeader), in the parts Header.astro and MobileNav.astro mark with
// data-editor: the menu's items (header-nav), the menu button (header-menu) and its side, the bar of "Mobilmenu"
// (mobile-nav) and the call to action (header-cta: the phone number and the button). Exposes headerDraft and swapHeader. Uses site/header.mjs; a DOM (the
// browser's, jsdom in the tests), no React: what the theme's components draw comes in as HTML.
import { headerOf, sortedNav } from '../site/header.mjs';

/** @typedef {import('../site/header.mjs').NavLink} NavLink */
/** @typedef {import('../site/header.mjs').NavItem} NavItem */
/** @typedef {import('../site/header.mjs').Button} Button */

/**
 * The header's three files as the form has them: menu.json, mobile-menu.json and header.json.
 * @typedef {{ menu: Record<string, any>, mobileMenu: Record<string, any>, header: Record<string, any> }} HeaderValues
 */

/**
 * What the form changes in the header; undefined leaves it as it is on the site. `nav` null: the menu is off (no items,
 * no menu button); `mobileNav` empty: no bar; `cta`: the call to action, when its button or phone number changed
 * (`button` null: no button).
 * @typedef {{ button: Button | null, phone: boolean }} HeaderCta
 * @typedef {{ nav?: NavItem[] | null, mobileNav?: NavLink[], menuSide?: 'start' | 'end', cta?: HeaderCta }} HeaderDraft
 */

// As site/site.ts reads the files: the menu's items unless it is off, the bar's links while it is on.
/** @param {Record<string, any>} menu */
const navOf = (menu) => (menu.enabled !== false ? sortedNav(menu.items ?? []).map(linkOf) : null);
/** @param {Record<string, any>} mobileMenu */
const mobileNavOf = (mobileMenu) => (mobileMenu.enabled ? (mobileMenu.items ?? []).map(linkOf) : []);
// An item with only what the header shows of it.
/** @param {Record<string, any>} item @returns {NavItem} */
const linkOf = ({ label = '', href = '', children }) =>
  children?.length ? { label, href, children: children.map(linkOf) } : { label, href };

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What the form (`now`) changes from the files as they were saved (`saved`): only what differs is in it, so the rest of
 * the page stays exactly as on the site.
 * @param {HeaderValues} saved
 * @param {HeaderValues} now
 * @returns {HeaderDraft}
 */
export function headerDraft(saved, now) {
  /** @type {HeaderDraft} */
  const draft = {};
  const [nav, navBefore] = [navOf(now.menu), navOf(saved.menu)];
  if (!same(nav, navBefore)) draft.nav = nav;
  const [mobileNav, mobileBefore] = [mobileNavOf(now.mobileMenu), mobileNavOf(saved.mobileMenu)];
  if (!same(mobileNav, mobileBefore)) draft.mobileNav = mobileNav;
  const [header, before] = [headerOf(now.header), headerOf(saved.header)];
  if (header.menuSide !== before.menuSide) draft.menuSide = header.menuSide;
  if (!same(header.button, before.button) || header.phone !== before.phone) draft.cta = { button: header.button, phone: header.phone };
  return draft;
}

/**
 * How the theme draws what the page may not have: the menu button's classes on each side, the call to action as HTML
 * (when `cta` changed; with data-editor="header-cta"), an empty bar of "Mobilmenu" with one tab (for a page without
 * one), the name of an item's sub-pages button, and the page's address (for the open page's item).
 * @typedef {{ menuClass: Record<'start' | 'end', string>, cta?: string, mobileNav: string, subpagesOf: (label: string) => string, current: string }} HeaderTheme
 */

/** @param {ParentNode} doc @param {string} name @returns {HTMLElement | null} */
const part = (doc, name) => doc.querySelector(`[data-editor="${name}"]`);

// As Header.astro marks the open page: its own address, or a page under it (not the front page's).
/** @param {string} current @param {string} href */
const isActive = (current, href) => current === href || (href !== '/' && current.startsWith(href));

/** @param {Element | null} a @param {NavLink} link @param {boolean} active */
function setLink(a, link, active) {
  if (!a) return;
  a.textContent = link.label;
  a.setAttribute('href', link.href);
  if (active) a.setAttribute('aria-current', 'page');
  else a.removeAttribute('aria-current');
}

/** @param {Document} doc @param {string} html */
function fromHtml(doc, html) {
  const box = doc.createElement('template');
  box.innerHTML = html.trim();
  return box.content;
}

// The menu's items, each drawn as one of the page's: an item with sub-items as one that has them (its button and menu),
// else as one without. A page whose menu has neither keeps it as it is.
/** @param {HTMLElement} nav @param {NavItem[]} items @param {HeaderTheme} theme */
function drawNav(nav, items, theme) {
  const list = nav.querySelector('ul');
  const rows = [...(list?.children ?? [])];
  const plain = rows.find((li) => !li.querySelector('[data-nav-toggle]'));
  const parent = rows.find((li) => li.querySelector('[data-nav-toggle]'));
  if (!list || (!plain && !parent)) return;
  const drawn = items.map((item, i) => {
    const kids = item.children ?? [];
    const li = /** @type {HTMLElement} */ (((kids.length && parent) || plain || parent).cloneNode(true));
    setLink(li.querySelector('a'), item, isActive(theme.current, item.href));
    const toggle = li.querySelector('[data-nav-toggle]');
    const menu = toggle && li.querySelector(`[id="${toggle.getAttribute('aria-controls')}"]`);
    if (!kids.length) {
      toggle?.remove();
      menu?.remove();
      return li;
    }
    if (toggle && menu) {
      menu.id = `menu-${i}`;
      toggle.setAttribute('aria-controls', menu.id);
      toggle.setAttribute('aria-label', theme.subpagesOf(item.label));
      const sub = menu.querySelector('ul');
      const one = sub?.firstElementChild;
      if (sub && one)
        sub.replaceChildren(
          ...kids.map((child) => {
            const row = /** @type {HTMLElement} */ (one.cloneNode(true));
            setLink(row.querySelector('a'), child, theme.current === child.href);
            return row;
          }),
        );
    }
    return li;
  });
  list.replaceChildren(...drawn);
}

// The bar of "Mobilmenu": its links as its tabs, the first one's look; a page without the bar gets the theme's empty one at
// the end of the header, where MobileNav.astro is.
/** @param {Document} doc @param {NavLink[]} links @param {HeaderTheme} theme */
function drawMobileNav(doc, links, theme) {
  let bar = part(doc, 'mobile-nav');
  if (!links.length) return bar?.remove();
  if (!bar) {
    part(doc, 'header')?.append(fromHtml(doc, theme.mobileNav));
    bar = part(doc, 'mobile-nav');
  }
  const list = bar?.querySelector('ul');
  const one = list?.firstElementChild;
  if (!list || !one) return;
  list.replaceChildren(
    ...links.map((link) => {
      const row = /** @type {HTMLElement} */ (one.cloneNode(true));
      setLink(row.querySelector('a'), link, isActive(theme.current, link.href));
      return row;
    }),
  );
}

/**
 * Puts what the form changes (headerDraft) into the site's page, drawn as the theme draws it (`theme`).
 * @param {Document} doc
 * @param {HeaderDraft} draft
 * @param {HeaderTheme} theme
 */
export function swapHeader(doc, draft, theme) {
  const nav = part(doc, 'header-nav');
  const menu = part(doc, 'header-menu');
  if (draft.nav === null) {
    nav?.remove();
    menu?.remove();
  } else if (draft.nav && nav) drawNav(nav, draft.nav, theme);
  if (draft.mobileNav) drawMobileNav(doc, draft.mobileNav, theme);
  if (draft.cta && theme.cta !== undefined) part(doc, 'header-cta')?.replaceWith(fromHtml(doc, theme.cta));
  // The menu button first in the header's row, or last (after the call to action).
  if (draft.menuSide && menu?.isConnected && menu.parentElement) {
    menu.className = theme.menuClass[draft.menuSide];
    if (draft.menuSide === 'start') menu.parentElement.prepend(menu);
    else menu.parentElement.append(menu);
  }
}
