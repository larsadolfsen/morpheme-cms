// Mobile navigation drawer (client island): the theme's modal navigation drawer (ui/NavigationDrawer.tsx), opened and
// closed with its icon buttons (ui/IconButton.tsx).
// Rendered through a portal into <body>: the sticky header uses backdrop-filter, which would
// otherwise become the containing block for position: fixed and clip the drawer.
// Motion: the drawer slides in from the right and links stagger in (state transition);
// with reduced motion it appears instantly.
// Items with sub-pages (as in the old WordPress menu) unfold with the caret next to them;
// the section with the current page starts open.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { themeEase } from '@theme/scripts/ease';
import Button from '@theme/ui/Button';
import IconButton from '@theme/ui/IconButton';
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
}: {
  items: Item[];
  current: string;
  bookingPath: string;
  phone: string;
  phoneHref: string;
  name: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  // The theme's easing (only used in the browser, where the menu opens).
  const [ease] = useState(themeEase);

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
        label="Åbn menu"
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
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                />
                <motion.div
                  ref={drawer}
                  id="navigation-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menu"
                  className={`${navigationDrawerClass} absolute inset-y-0 right-0`}
                  style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
                  initial={reduce ? false : { x: '100%' }}
                  animate={{ x: 0 }}
                  exit={reduce ? undefined : { x: '100%' }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 40 }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="theme-logo-tile">
                        <span aria-hidden="true" className="butterfly theme-logo-mark shrink-0" />
                      </span>
                      <div className="leading-tight">
                        <p className="theme-logo-name">{name}</p>
                        <p className="theme-logo-role text-[0.8rem] text-muted">{role}</p>
                      </div>
                    </div>
                    <IconButton ref={closeButton} icon="x" label="Luk menu" onClick={() => setOpen(false)} />
                  </div>

                  <nav aria-label="Hovedmenu" className="px-3 py-4">
                    <motion.ul
                      initial={reduce ? false : 'hidden'}
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } }}
                    >
                      {items.map((item) => (
                        <motion.li
                          key={item.href}
                          variants={{
                            hidden: { opacity: 0, x: 16 },
                            show: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
                          }}
                        >
                          <NavigationDrawerRow>
                            <NavigationDrawerItem
                              href={item.href}
                              active={holdsCurrent(item)}
                              onClick={() => setOpen(false)}
                              aria-current={current === item.href ? 'page' : undefined}
                            >
                              {item.label}
                            </NavigationDrawerItem>
                            {item.children && (
                              <NavigationDrawerToggle
                                label={`Undersider til ${item.label}`}
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
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={reduce ? undefined : { height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease }}
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
                        </motion.li>
                      ))}
                    </motion.ul>
                  </nav>

                  <div className="mt-auto grid gap-2.5 px-5 pt-4">
                    {bookingPath && (
                      <Button href={bookingPath} icon="calendar-blank" data-open="booking" onClick={() => setOpen(false)}>
                        Book en tid
                      </Button>
                    )}
                    <Button href={phoneHref} kind="outlined" icon="phone">
                      Ring {phone}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
