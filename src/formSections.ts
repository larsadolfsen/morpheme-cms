// The sections of a long form, under each other on one page, each folding in and out under its heading (FoldSection in
// ui.tsx), with their "on this page" list (SectionList, large and wider): which are open, the one in view (marked in the
// list while the page scrolls), and a tap in the list, which opens one and scrolls to it. With `single` only one is open
// at a time: opening one folds the others (the settings screens on a phone, SettingsSections.tsx). Exposes
// useFormSections. Used by EntryForm.tsx and SettingsSections.tsx. Uses lib/section-in-view.mjs and lib/fold-open.mjs.
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { NavigationItem } from './ui';
import { sectionInView, spyLine } from '../lib/section-in-view.mjs';
import { onlyFirst, withOpen } from '../lib/fold-open.mjs';

const scrolling = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/** `sections`: the form's sections, in their order; `start`: those open from the start (the first marked in the list);
 * `single`: only one open at a time. */
export function useFormSections<S extends string>(sections: NavigationItem[], start: S[], single = false) {
  // The section in view, marked in the sections list: while the page scrolls, the last one whose top is above a third of the
  // screen (at the bottom of the page, the last one in view). A tap in the list marks its own and scrolls there; the
  // mark stays meanwhile (`steering`, until the scroll ends).
  const [section, setSection] = useState<S>(start[0]);
  const boxes = useRef<Partial<Record<S, HTMLElement | null>>>({});
  const order = useRef<S[]>([]);
  order.current = sections.map((s) => s.id as S);
  const steering = useRef(0);
  const spy = useRef(() => {});
  const steer = (id: S) => {
    setSection(id);
    steering.current = performance.now() + 1500;
    addEventListener('scrollend', () => (steering.current = 0), { once: true });
  };
  const [open, setOpen] = useState<ReadonlySet<S>>(() => new Set(single ? start.slice(0, 1) : start));
  const opened = (was: ReadonlySet<S>, id: S) => withOpen(was, id, single);
  const unfold = (id: S) => setOpen((was) => opened(was, id));
  // The window narrowed to `single`: only the first of those open stays open.
  useEffect(() => {
    if (single) setOpen((was) => onlyFirst(was, order.current));
  }, [single]);
  // A section opened by its heading is marked in the sections list; one folded, the one in view now (the page is shorter,
  // without a scroll). With `single`, one whose heading went up out of view as the one above it folded is scrolled to.
  const toggle = (id: S) => {
    const opening = !open.has(id);
    setOpen((was) => {
      if (opening) return opened(was, id);
      const next = new Set(was);
      next.delete(id);
      return next;
    });
    if (opening) setSection(id);
    else requestAnimationFrame(() => spy.current());
    if (opening && single)
      requestAnimationFrame(() => {
        const box = boxes.current[id];
        if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: 'start', behavior: scrolling() });
      });
  };
  useEffect(() => {
    let frame = 0;
    spy.current = () => {
      frame = 0;
      if (performance.now() < steering.current) return;
      const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
      const tops: Record<string, number | undefined> = {};
      for (const id of order.current) tops[id] = boxes.current[id]?.getBoundingClientRect().top;
      const here = sectionInView(order.current, tops, spyLine(innerHeight, atBottom));
      if (here) setSection(here as S);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(spy.current);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  // Opens a section and scrolls to it (or to `box` in it). It is opened at once (flushSync), so it is there to scroll to.
  const goTo = (id: S, box?: HTMLElement | null) => {
    if (!open.has(id)) flushSync(() => unfold(id));
    steer(id);
    requestAnimationFrame(() => (box ?? boxes.current[id])?.scrollIntoView({ block: 'start', behavior: scrolling() }));
  };
  return {
    /** The section in view, for the sections list (SectionList `value`). */
    section,
    /** Marks a section in the list while the page scrolls to it (a field that keeps the form from being saved). */
    steer,
    /** Opens a section (a field in it keeps the form from being saved: useWrongField's `open`). */
    unfold,
    goTo,
    /** A tap in the sections list (SectionList `onChange`). */
    pick: (id: string) => goTo(id as S),
    /** A section's FoldSection props: where it is, its heading (its name in the list), and whether it is open. */
    sectionProps: (id: S) => ({
      ref: (el: HTMLElement | null) => void (boxes.current[id] = el),
      title: sections.find((s) => s.id === id)!.label,
      open: open.has(id),
      onToggle: () => toggle(id),
    }),
  };
}
