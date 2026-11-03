// The menu in Material: the theme's modal navigation drawer (ui/NavigationDrawer.tsx, m3.material.io/components/navigation-drawer), opened by the
// navigation icon first in the top app bar (Header.astro). It comes in from the left over a scrim, with the site's name,
// "Book en tid" as an extended FAB (ui/Fab.tsx), the menu's items with the open page in an active indicator, and "Ring" under a
// divider. Items with sub-pages unfold with the caret at the end of their row (inside the active indicator); the one
// with the open page starts open.
// Rendered through a portal into <body>, so nothing on the page can clip it. It moves with the site's motion scheme
// (motionSpring, @morphemecms/cms/lib/motion.ts: Material 3's springs, the expressive ones unless the owner chose
// another under "Bevægelse"); with reduced motion it appears at once.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Svg } from '@morphemecms/cms/src/icon';
import { motionSpring } from '@morphemecms/cms/lib/motion';
import IconButton from '@theme/ui/IconButton';
import { ExtendedFab } from '@theme/ui/Fab';
import {
  NavigationDrawerItem,
  NavigationDrawerRow,
  NavigationDrawerSubitem,
  NavigationDrawerToggle,
  navigationDrawerClass,
  navigationDrawerScrimClass,
} from '@theme/ui/NavigationDrawer';

type Link = { label: string; href: string };
type Item = Link & { children?: Link[] };

export default function MobileMenu({
  items,
  current,
  bookingPath,
  phone,
  phoneHref,
  name,
  role,
  book,
  call,
  texts,
}: {
  items: Item[];
  current: string;
  bookingPath: string;
  phone: string;
  phoneHref: string;
  name: string;
  role: string;
  /** The site's own labels of "Book en tid" and "Ring". */
  book: string;
  call: string;
  /** Its texts in the site's language (Header.astro has them, so the editor's dictionaries stay out of the browser). */
  texts: { open: string; close: string; menu: string; drawer: string; subpages: string[] };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  // The scheme's springs (only used in the browser, where the menu opens): in at the default spatial spring, out at the
  // fast one, and the scrim with the effects'.
  const [spring] = useState(() => ({
    enter: motionSpring('spatial'),
    leave: motionSpring('spatial', 'fast'),
    fadeIn: motionSpring('effects'),
    fadeOut: motionSpring('effects', 'fast'),
  }));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      // Keep keyboard focus inside the drawer while it is open.
      if (e.key === 'Tab' && drawer.current) {
        const focusable = drawer.current.querySelectorAll<HTMLElement>('a[href], button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
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
                  className={`${navigationDrawerClass} absolute inset-y-0 left-0`}
                  initial={reduce ? false : { x: '-100%' }}
                  animate={{ x: 0, transition: reduce ? { duration: 0 } : spring.enter }}
                  exit={reduce ? undefined : { x: '-100%', transition: spring.leave }}
                >
                  <div className="md-drawer-head">
                    <span aria-hidden="true" className="logo-mark h-10 w-9 shrink-0 bg-accent" />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="md-drawer-name">{name}</p>
                      <p className="md-drawer-role">{role}</p>
                    </div>
                    <IconButton ref={closeButton} icon="x" label={texts.close} onClick={() => setOpen(false)} />
                  </div>

                  <ExtendedFab
                    href={bookingPath}
                    icon="calendar-blank"
                    label={book}
                    kind="secondary-container"
                    data-open="booking"
                    onClick={() => setOpen(false)}
                  />

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

                  <hr className="md-divider" />
                  <NavigationDrawerItem href={phoneHref}>
                    <Svg name="phone" size={24} />
                    {call} {phone}
                  </NavigationDrawerItem>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
