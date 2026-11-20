// Moving the cards of the dashboard in edit mode: one step up or down (the card's menu), or onto the place of another
// card (the drop of a drag), and the card under the pointer. `shownIds` are the ids of the placements that have a widget,
// in order: the cards on the screen. A placement without a widget (an app no longer installed) is not a card, so a card
// steps over it. Pure; the layout edits are dashboard.mjs's.
import { moveWidget } from './dashboard.mjs';

/** @typedef {import('./dashboard.mjs').StoredDashboard} StoredDashboard */

/**
 * The dashboard after `id` has moved to the place of the card `ontoId`, with its position among the cards shown (1-based)
 * and how many there are; null when nothing changes (an unknown card, or the same one).
 * @param {StoredDashboard} dash
 * @param {string[]} shownIds
 * @param {string} id
 * @param {string} ontoId
 * @returns {{ dashboard: StoredDashboard, position: number, total: number } | null}
 */
export function moveOnto(dash, shownIds, id, ontoId) {
  const to = dash.widgets.findIndex((p) => p.id === ontoId);
  if (id === ontoId || to === -1 || !shownIds.includes(id) || !shownIds.includes(ontoId)) return null;
  const dashboard = moveWidget(dash, id, to);
  const shown = new Set(shownIds);
  const position = dashboard.widgets.filter((p) => shown.has(p.id)).findIndex((p) => p.id === id) + 1;
  return { dashboard, position, total: shownIds.length };
}

/**
 * The dashboard after `id` has moved `delta` cards (-1 up, 1 down); null at the ends and for an unknown card.
 * @param {StoredDashboard} dash
 * @param {string[]} shownIds
 * @param {string} id
 * @param {number} delta
 */
export function moveBy(dash, shownIds, id, delta) {
  const at = shownIds.indexOf(id);
  const onto = shownIds[at + delta];
  return at === -1 || onto === undefined ? null : moveOnto(dash, shownIds, id, onto);
}

/** The index of the rectangle the point (x, y) is in, or -1. @param {{ left: number, top: number, right: number, bottom: number }[]} rects */
export function cardAt(rects, x, y) {
  return rects.findIndex((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
}
