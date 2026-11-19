// The menu in Material: the theme's modal navigation drawer (ui/NavigationDrawer.tsx, m3.material.io/components/navigation-drawer), opened by the
// navigation icon in the top app bar (Header.astro). It comes in over a scrim from the edge its button is on (
// the start, left, or the end, right; mirrored in right-to-left languages), with the site's name, the menu's items with
// the open page in an active indicator, and at its bottom the header's call to action (header.json), each part when it
// is on: the phone number (a tel: link on a phone, the contact page from the medium window size up) and the button after
// it in one row, sharing the drawer's width (the button on top of the number when they do not fit side by side). Items with sub-pages unfold
// with the caret at the end of their row (inside the active indicator); the one with the open page starts open.
// It is a native <dialog> opened with showModal() (the theme's navigationDrawerDialogClass, as the editor's drawer): the
// browser makes the page inert, keeps the focus in it, gives it its role and returns the focus to the menu button, and
// a tap on the scrim (light dismiss, ui/lightDismiss.ts) and Escape (its cancel event) close it. Both go through close(),
// so the springs play on the way out. It moves with the site's motion scheme (motionSpring,
// @morphemecms/cms/lib/motion.ts: Material 3's springs, the expressive ones unless the owner chose another under
// "Motion"); with reduced motion it appears at once. A spring that overshoots carries the drawer a little past its
// place, so the dialog is wider than the drawer by a strip off the screen at its edge (navigationDrawerBleedClass): no
// gap opens at the edge while it settles.
import { useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { motionSpring } from '@morphemecms/cms/lib/motion';
import { lightDismiss } from '@theme/ui/lightDismiss';
import IconButton from '@theme/ui/IconButton';
import Buttons from '@theme/blocks/buttons/Buttons';
import HeaderPhoneButton, { type HeaderPhone } from '@theme/components/HeaderPhoneButton';
import type { ButtonView } from '@morphemecms/cms/src/standard/buttons/view';
import {
  NavigationDrawer,
  NavigationDrawerItem,
  NavigationDrawerRow,
  NavigationDrawerSection,
  NavigationDrawerSubitem,
  NavigationDrawerToggle,
  focusNavigationDrawerItem,
  navigationDrawerBleedClass,
  navigationDrawerDialogClass,
  navigationDrawerEndClass,
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
  // `open` is what the button says (aria-expanded); `shown` is whether the dialog is in the page, which it is until its
  // springs have played out.
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  // The scheme's springs (only used in the browser, where the menu opens): in at the default spatial spring, out at the
  // fast one, and the scrim with the effects'.
  const [spring] = useState(() => ({
    enter: motionSpring('spatial'),
    leave: motionSpring('spatial', 'fast'),
    fadeIn: motionSpring('effects'),
    fadeOut: motionSpring('effects', 'fast'),
  }));
  // The scrim is the dialog's ::backdrop, which inherits this variable from the dialog (navigation-drawer.css), so it fades with the
  // effects' springs while the drawer moves with the spatial ones.
  const scrim = '--mo-comp-navigation-drawer-scrim-opacity';

  // The edge it comes from is its side's: the start edge slides it in from the left (from the right in right-to-left
  // languages), the end edge from the right (the left).
  const away = () => ((getComputedStyle(document.documentElement).direction === 'rtl') === (side === 'end') ? '-100%' : '100%');

  // The expanded rail's menu button (M3 Navigation rail, Guidelines: "When the navigation rail is expanded, the menu icon should change to
  // represent that it can be collapsed"): at the top, on the edge the header's menu button is on, it closes the drawer.
  const menuButton = <IconButton icon="menu-open" label={texts.close} onClick={() => void close()} />;

  const show = () => {
    setShown(true);
    setOpen(true);
  };

  async function close() {
    const el = dialog.current;
    if (!el?.open || closing.current) return;
    closing.current = true;
    setOpen(false);
    if (!reduce) await Promise.all([animate(el, { x: away() }, spring.leave), animate(el, { [scrim]: 0 }, spring.fadeOut)]);
    el.close();
    setShown(false);
    closing.current = false;
  }

  // Once the dialog is in the page: modal, with the focus on the first item; the arrow keys, Home and End are the drawer's.
  useLayoutEffect(() => {
    const el = dialog.current;
    if (!shown || !el || el.open) return;
    el.showModal();
    focusNavigationDrawerItem(el);
    lightDismiss(el, close);
    if (!reduce) {
      animate(el, { x: [away(), '0%'] }, spring.enter);
      animate(el, { [scrim]: [0, 1] }, spring.fadeIn);
    }
  }, [shown]);

  const isCurrent = (href: string) => current === href || current.startsWith(href);
  const holdsCurrent = (item: Item) => isCurrent(item.href) || !!item.children?.some((c) => c.href === current);
  const [expanded, setExpanded] = useState<string | null>(() => items.find((i) => i.children && holdsCurrent(i))?.href ?? null);

  return (
    <>
      <IconButton
        icon="list"
        label={texts.open}
        onClick={show}
        aria-expanded={open}
        aria-controls={shown ? 'navigation-drawer' : undefined}
      />

      {shown && (
        <dialog
          ref={dialog}
          id="navigation-drawer"
          aria-label={texts.drawer}
          className={[navigationDrawerDialogClass, navigationDrawerBleedClass, side === 'end' && navigationDrawerEndClass]
            .filter(Boolean)
            .join(' ')}
          // Escape: the springs play out instead of the dialog's instant close.
          onCancel={(e) => {
            e.preventDefault();
            void close();
          }}
          // Closed some other way: nothing is left open.
          onClose={() => {
            if (closing.current) return;
            setOpen(false);
            setShown(false);
          }}
        >
          <NavigationDrawer variant="modal" className={side === 'end' ? navigationDrawerEndClass : undefined}>
            <div className="mo-navigation-drawer__head">
              {side !== 'end' && menuButton}
              <span aria-hidden="true" className="mo-logo-mark mo-drawer__mark" />
              <div className="mo-drawer__title">
                <p className="mo-navigation-drawer__name">{name}</p>
                <p className="mo-navigation-drawer__role">{role}</p>
              </div>
              {side === 'end' && menuButton}
            </div>

            <NavigationDrawerSection>
              <nav aria-label={texts.menu}>
                <ul>
                  {items.map((item, i) => (
                    <li key={item.href}>
                      <NavigationDrawerRow data-active={holdsCurrent(item) || undefined}>
                        <NavigationDrawerItem
                          href={item.href}
                          onClick={() => void close()}
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
                            className="mo-drawer__subitems"
                            initial={reduce ? false : { height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1, transition: spring.enter }}
                            exit={reduce ? undefined : { height: 0, opacity: 0, transition: spring.leave }}
                          >
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <NavigationDrawerSubitem
                                  href={child.href}
                                  active={current === child.href}
                                  onClick={() => void close()}
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
              <div className="mo-navigation-drawer__actions">
                {phone && (
                  // On a phone it calls; from the medium window size up it leads to the contact page, when there is one.
                  <>
                    <span className={phone.page ? 'mo-drawer__call' : 'mo-contents'}>
                      <HeaderPhoneButton phone={phone} kind="outlined" />
                    </span>
                    {phone.page && (
                      <span className="mo-drawer__page">
                        <HeaderPhoneButton phone={phone} kind="outlined" page onClick={() => void close()} />
                      </span>
                    )}
                  </>
                )}
                {button && <Buttons buttons={[button]} onClick={() => void close()} />}
              </div>
            )}
          </NavigationDrawer>
        </dialog>
      )}
    </>
  );
}
