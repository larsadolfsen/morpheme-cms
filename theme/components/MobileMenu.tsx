// The menu in Material: the theme's modal navigation drawer (ui/NavigationDrawer.tsx, m3.material.io/components/navigation-drawer), opened by the
// navigation icon in the top app bar (Header.astro). It comes in over a scrim from the side its button is on (`side`:
// the start, left, or the end, right; mirrored in right-to-left languages), with the site's name, the menu's items with
// the open page in an active indicator, and at its bottom the header's call to action (header.json), each part when it
// is on: the phone number (a tel: link on a phone, the contact page from the medium window size up) and the button after
// it in one row, sharing the drawer's width (the button on top of the number when they do not fit side by side). Items with sub-pages unfold
// with the caret at the end of their row (inside the active indicator); the one with the open page starts open.
// Rendered through a portal into <body>, so nothing on the page can clip it. It moves with the site's motion scheme
// (motionSpring, @morphemecms/cms/lib/motion.ts: Material 3's springs, the expressive ones unless the owner chose
// another under "Bevægelse"); with reduced motion it appears at once. A spring that overshoots carries the drawer a little
// past its place, so it is wider than it looks by a strip off the screen at its edge (navigationDrawerBleedClass): no gap
// opens at the edge while it settles.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { motionSpring } from '@morphemecms/cms/lib/motion';
import { trapTarget, visibleElements } from '@morphemecms/cms/lib/focusTrap.mjs';
import IconButton from '@theme/ui/IconButton';
import Buttons from '@theme/blocks/buttons/Buttons';
import HeaderPhoneButton, { type HeaderPhone } from '@theme/components/HeaderPhoneButton';
import type { ButtonView } from '@morphemecms/cms/src/standard/buttons/view';
import {
  NavigationDrawerItem,
  NavigationDrawerRow,
  NavigationDrawerSection,
  NavigationDrawerSubitem,
  NavigationDrawerToggle,
  focusNavigationDrawerItem,
  navigationDrawerBleedClass,
  navigationDrawerClass,
  navigationDrawerEndClass,
  navigationDrawerKeys,
  navigationDrawerScrimClass,
} from '@theme/ui/NavigationDrawer';

type Link = { label: string; href: string };
type Item = Link & { children?: Link[] };

export default function MobileMenu({
  items,
  current,
  side = 'start',
  button,
  phone,
  name,
  role,
  texts,
}: {
  items: Item[];
  current: string;
  /** The side of the screen it opens from: its button's (header.json's menuSide). */
  side?: 'start' | 'end';
  /** The header's call to action (header.json), at the bottom: its button, and the phone number; each when it is on. */
  button?: ButtonView;
  phone?: HeaderPhone;
  name: string;
  role: string;
  /** Its texts in the site's language (Header.astro has them, so the editor's dictionaries stay out of the browser). */
  texts: { open: string; close: string; menu: string; drawer: string; subpages: string[] };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const openButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  // The scheme's springs (only used in the browser, where the menu opens): in at the default spatial spring, out at the
  // fast one, and the scrim with the effects'.
  const [spring] = useState(() => ({
    enter: motionSpring('spatial'),
    leave: motionSpring('spatial', 'fast'),
    fadeIn: motionSpring('effects'),
    fadeOut: motionSpring('effects', 'fast'),
  }));

  // The edge it comes from is its side's: the start edge slides it in from the left (from the right in right-to-left
  // languages), the end edge from the right (the left).
  const [away, setAway] = useState(side === 'end' ? '100%' : '-100%');
  useEffect(() => {
    setMounted(true);
    const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
    setAway(rtl === (side === 'end') ? '-100%' : '100%');
  }, [side]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    // The focus goes to the first item; the arrow keys, Home and End move between them.
    if (drawer.current) focusNavigationDrawerItem(drawer.current);
    const stopKeys = drawer.current ? navigationDrawerKeys(drawer.current) : undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      // Keep keyboard focus inside the drawer while it is open.
      if (e.key === 'Tab' && drawer.current) {
        const focusable = visibleElements(drawer.current.querySelectorAll<HTMLElement>('a[href], button'));
        const target = trapTarget(e.shiftKey, focusable.indexOf(document.activeElement as HTMLElement), focusable.length);
        if (target !== null) {
          e.preventDefault();
          focusable[target].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      stopKeys?.();
      document.removeEventListener('keydown', onKey);
      // Closed by "Book en tid": the booking sheet (a modal dialog) is open now and keeps the page
      // still and the focus itself.
      if (document.querySelector('dialog[open]')) return;
      root.style.overflow = prevOverflow;
      openButton.current?.focus();
    };
  }, [open]);

  const isCurrent = (href: string) => current === href || current.startsWith(href);
  const holdsCurrent = (item: Item) => isCurrent(item.href) || !!item.children?.some((c) => c.href === current);
  const [expanded, setExpanded] = useState<string | null>(() => items.find((i) => i.children && holdsCurrent(i))?.href ?? null);

  return (
    <>
      <IconButton
        ref={openButton}
        icon="list"
        label={texts.open}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={open ? 'navigation-drawer' : undefined}
      />

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[45]" key="drawer-root">
                <motion.div
                  className={`${navigationDrawerScrimClass} absolute inset-0`}
                  onClick={() => setOpen(false)}
                  aria-hidden="true"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1, transition: spring.fadeIn }}
                  exit={reduce ? undefined : { opacity: 0, transition: spring.fadeOut }}
                />
                <motion.div
                  ref={drawer}
                  id="navigation-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-label={texts.drawer}
                  className={[
                    navigationDrawerClass,
                    navigationDrawerBleedClass,
                    side === 'end' ? `${navigationDrawerEndClass} end-0` : 'start-0',
                    'absolute inset-y-0',
                  ].join(' ')}
                  initial={reduce ? false : { x: away }}
                  animate={{ x: 0, transition: reduce ? { duration: 0 } : spring.enter }}
                  exit={reduce ? undefined : { x: away, transition: spring.leave }}
                >
                  <div className="md-drawer-head">
                    <span aria-hidden="true" className="logo-mark h-10 w-9 shrink-0 bg-primary" />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="md-drawer-name">{name}</p>
                      <p className="md-drawer-role">{role}</p>
                    </div>
                    <IconButton icon="x" label={texts.close} onClick={() => setOpen(false)} />
                  </div>

                  <NavigationDrawerSection>
                    <nav aria-label={texts.menu}>
                      <ul>
                        {items.map((item, i) => (
                          <li key={item.href}>
                            <NavigationDrawerRow data-active={holdsCurrent(item) || undefined}>
                              <NavigationDrawerItem
                                href={item.href}
                                onClick={() => setOpen(false)}
                                aria-current={current === item.href ? 'page' : undefined}
                              >
                                {item.label}
                              </NavigationDrawerItem>
                              {item.children && (
                                <NavigationDrawerToggle
                                  label={texts.subpages[i]}
                                  expanded={expanded === item.href}
                                  onClick={() => setExpanded(expanded === item.href ? null : item.href)}
                                  aria-controls={`sub-${item.href}`}
                                />
                              )}
                            </NavigationDrawerRow>
                            <AnimatePresence initial={false}>
                              {item.children && expanded === item.href && (
                                <motion.ul
                                  id={`sub-${item.href}`}
                                  className="overflow-hidden"
                                  initial={reduce ? false : { height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1, transition: spring.enter }}
                                  exit={reduce ? undefined : { height: 0, opacity: 0, transition: spring.leave }}
                                >
                                  {item.children.map((child) => (
                                    <li key={child.href}>
                                      <NavigationDrawerSubitem
                                        href={child.href}
                                        active={current === child.href}
                                        onClick={() => setOpen(false)}
                                        aria-current={current === child.href ? 'page' : undefined}
                                      >
                                        {child.label}
                                      </NavigationDrawerSubitem>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </NavigationDrawerSection>

                  {(button || phone) && (
                    <div className="md-drawer-actions">
                      {phone && (
                        // On a phone it calls; from the medium window size up it leads to the contact page, when there is one.
                        <>
                          <span className={phone.page ? 'contents medium:hidden' : 'contents'}>
                            <HeaderPhoneButton phone={phone} kind="outlined" />
                          </span>
                          {phone.page && (
                            <span className="hidden medium:contents">
                              <HeaderPhoneButton phone={phone} kind="outlined" page onClick={() => setOpen(false)} />
                            </span>
                          )}
                        </>
                      )}
                      {button && <Buttons buttons={[button]} onClick={() => setOpen(false)} />}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
