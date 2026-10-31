// Buttons on the site (view.ts). A button goes to a page or where the site's config says (`buttonTargets`, e.g. the
// booking sheet or the phone: their address and text from the site, @site/standard), or opens what it picked (a
// promotion on the page: `picked`); without a text of its own it has the target's, the promotion's or the page's name.
// What it opens on the page is its `data-open` (ButtonText.open), the address is where it goes without one there or
// without JavaScript. `bar`: the buttons of a bar at the bottom of a phone's screen (the site's action bar): the text
// without what comes after it (the phone number, said to screen readers instead), and without an icon of their own the
// one of what they do: the calendar to book, the phone, the arrow after a page or a pop-up.
import { standard } from '@site/standard';
import type { Load } from '../view';
import { targets, type Button } from './fields';
import { kindOf, type ButtonsView, type ButtonView } from './view';

/** Buttons on the site: their own, else `shared` (the shared ones, "Blokke" › "Knapper"). */
export async function loadButtons(items: Button[] | undefined, shared?: Button[], { bar = false } = {}): Promise<ButtonView[]> {
  const list = items?.length ? items : (shared ?? []);
  const buttons = await Promise.all(
    list.map(async (b): Promise<ButtonView | null> => {
      const picks = targets.some((o) => o.value === b.to && o.pick);
      const target = b.to && b.to !== 'page' ? (picks ? standard.picked(b.to, b.open ?? '') : standard.buttons[b.to]) : undefined;
      // What it picked is gone (the build stops before, checkSite.ts): no button rather than a wrong one.
      if (picks && !target) return null;
      const own = b.label?.trim();
      const full = target && [own || target.text, target.after].filter(Boolean).join(' ');
      const [href, text] = target
        ? [target.href, bar ? own || target.text : full!]
        : [b.href || '/', own || (await standard.pageName(b.href ?? ''))];
      const icon = b.icon || (bar ? (target?.open === 'booking' ? 'calendar-blank' : b.to === 'phone' ? 'phone' : 'arrow-right') : '');
      return { href, text, label: bar && full !== text ? full : undefined, open: target?.open, kind: kindOf(b), icon };
    }),
  );
  return buttons.flatMap((b) => (b ? [b] : []));
}

export const load: Load<ButtonsView> = async (props, { texts }) => ({ buttons: await loadButtons(props.items, texts.items) });
