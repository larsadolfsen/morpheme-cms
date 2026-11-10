// What buttons show (their view, drawn by the theme's Buttons.tsx, also where a site or an app shows buttons of its
// own): each one's address, text, what it opens on the page, kind and icon. In the editor: buttonsOf; on the site:
// loadButtons (load.ts), which knows the site's pages and targets.
import type { BlockData } from '../../blocks';
import { sharedIn } from '../../shared';
import { buttonKinds, type ButtonKind, type ViewOf } from '../view';
import { textOf, type Button } from './fields';
import shared from './shared';

/** A button as it is drawn: where it goes, its text, what it is called for a screen reader when that is more than its
 * text (`label`), what it opens on the page (`open`: its data-open), its kind (Material's: filled, tonal, elevated,
 * outlined or text) and its icon (the arrow goes after the text, the others before it). */
export type ButtonView = { href: string; text: string; label?: string; open?: string; kind: ButtonKind; icon?: string };

/** "Buttons": its buttons. */
export type ButtonsView = { buttons: ButtonView[] };

/** A button's kind: its own, else filled. */
export const kindOf = (b: Button): ButtonKind => buttonKinds.find((k) => k === b.kind) ?? 'filled';

/** Buttons in the editor: their own, else the shared ones ("Blocks" › "Buttons"). */
export const buttonsOf = (items: Button[] | undefined, data: BlockData): ButtonView[] =>
  (items?.length ? items : ((sharedIn(data.site, 'buttons', shared.values).items ?? []) as Button[])).map((b) => ({
    href: b.href ?? '',
    text: textOf(b, data),
    kind: kindOf(b),
    icon: b.icon,
  }));

export const viewOf: ViewOf<ButtonsView> = (props, data) => ({ buttons: buttonsOf(props.items, data) });
