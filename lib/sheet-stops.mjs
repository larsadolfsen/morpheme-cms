// A bottom sheet's height decisions (bottomSheetControl.ts uses them): the states it rests in, the next one on a tap,
// the one a drag comes to rest in, and a modal sheet's start height and resting place. Pure, so it is tested
// (sheet-stops.test.mjs). Exports defaultStates, isResizable, restingStops, nextOnTap, restAfterDrag, modalStartHeight
// and modalRestAfterDrag. No dependencies.

/** @typedef {'collapsed' | 'half-expanded' | 'expanded' | 'hidden'} SheetState */
/** @typedef {{ state: SheetState, height: number }} Stop */
/** @typedef {'start' | 'full' | 'close'} ModalRest */

const stateOrder = ['hidden', 'collapsed', 'half-expanded', 'expanded'];

/**
 * Material 3's states for a standard sheet: 'hidden' first when it can be closed.
 * @param {boolean} closable
 * @returns {SheetState[]}
 */
export function defaultStates(closable) {
  if (closable) {
    return ['hidden', 'collapsed', 'half-expanded', 'expanded'];
  }
  return ['collapsed', 'half-expanded', 'expanded'];
}

/**
 * More than one state other than 'hidden'.
 * @param {SheetState[]} states
 * @returns {boolean}
 */
export function isResizable(states) {
  const count = states.filter((s) => s !== 'hidden').length;
  return count > 1;
}

/**
 * The stops a sheet rests in, lowest first, from the measured heights (px) and the allowed states.
 * half-expanded is kept only when more than 48px from both neighbours; a stop within 1px of the one before is dropped.
 * @param {{ collapsed: number, 'half-expanded': number, expanded: number }} heights
 * @param {SheetState[]} states
 * @returns {Stop[]}
 */
export function restingStops(heights, states) {
  const stops = states.map((state) => {
    const height = state === 'hidden' ? 0 : heights[state];
    return { state, height };
  });

  stops.sort((a, b) => {
    if (a.height !== b.height) {
      return a.height - b.height;
    }
    const indexA = stateOrder.indexOf(a.state);
    const indexB = stateOrder.indexOf(b.state);
    return indexA - indexB;
  });

  // Filter half-expanded if it is not distinct enough
  const filtered = stops.filter((stop, index, arr) => {
    if (stop.state !== 'half-expanded') return true;

    const prev = arr[index - 1];
    const next = arr[index + 1];

    const prevOk = !prev || stop.height - prev.height > 48;
    const nextOk = !next || next.height - stop.height > 48;

    return prevOk && nextOk;
  });

  // Walk the list and drop stops within 1px of the previous kept stop
  /** @type {Stop[]} */
  const result = [];
  for (const stop of filtered) {
    if (result.length === 0) {
      result.push(stop);
    } else {
      const lastKept = result[result.length - 1];
      if (Math.abs(stop.height - lastKept.height) > 1) {
        result.push(stop);
      }
    }
  }

  return result;
}

/**
 * The state a tap on the handle (or the resize button) moves to: the next higher stop, never 'hidden';
 * from the highest, or from a state that is not a stop, the lowest.
 * @param {Stop[]} stops
 * @param {SheetState} current
 * @returns {SheetState}
 */
export function nextOnTap(stops, current) {
  const index = stops.findIndex((s) => s.state === current);

  if (index === -1) {
    const nonHidden = stops.filter((s) => s.state !== 'hidden');
    return nonHidden.length > 0 ? nonHidden[0].state : stops[0].state;
  }

  let nextIndex = index + 1;
  while (nextIndex < stops.length && stops[nextIndex].state === 'hidden') {
    nextIndex++;
  }

  if (nextIndex < stops.length) {
    return stops[nextIndex].state;
  }

  const nonHidden = stops.filter((s) => s.state !== 'hidden');
  if (nonHidden.length > 0) {
    return nonHidden[0].state;
  }

  return stops[0].state;
}

/**
 * The state a drag comes to rest in: a flick (over 0.4 px/ms) moves on to the next stop that way,
 * otherwise the nearest (a tie goes to the lower).
 * @param {Stop[]} stops
 * @param {number} height - the sheet's height in px when let go
 * @param {number} velocity - px/ms, positive upward
 * @returns {SheetState}
 */
export function restAfterDrag(stops, height, velocity) {
  if (velocity > 0.4) {
    const higher = stops.find((s) => s.height > height + 1);
    if (higher) return higher.state;
  } else if (velocity < -0.4) {
    const lower = [...stops].reverse().find((s) => s.height < height - 1);
    if (lower) return lower.state;
  }

  let best = stops[0];
  let bestDiff = Math.abs(stops[0].height - height);
  for (const s of stops) {
    const diff = Math.abs(s.height - height);
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return best.state;
}

/**
 * The start height of a modal sheet: the smaller of its content height and the allowed space,
 * which is the full viewport minus a gap, or half the viewport.
 * @param {number} content
 * @param {number} viewport
 * @param {'half' | 'full'} startAt
 * @param {number} topGap
 * @returns {number}
 */
export function modalStartHeight(content, viewport, startAt, topGap) {
  if (startAt === 'full') {
    return Math.min(content, viewport - topGap);
  }
  return Math.min(content, viewport / 2);
}

/**
 * The rest place of a modal sheet after a drag: full, start, or close.
 * A flick (over 0.4 px/ms) moves to full or to start/close depending on the height.
 * Otherwise the nearest stop, with ties going to the higher stop.
 * @param {number} start
 * @param {number} full
 * @param {number} height
 * @param {number} velocity
 * @returns {ModalRest}
 */
export function modalRestAfterDrag(start, full, height, velocity) {
  if (velocity > 0.4) {
    return 'full';
  }
  if (velocity < -0.4) {
    return height < start - 1 ? 'close' : 'start';
  }

  // Nearest of close (0), start, and full. Tie goes to the higher one.
  // Order of preference: full, start, close.
  let best = 'close';
  let bestDiff = height; // distance to close (0)

  const startDiff = Math.abs(start - height);
  if (startDiff <= bestDiff) {
    best = 'start';
    bestDiff = startDiff;
  }

  const fullDiff = Math.abs(full - height);
  if (fullDiff <= bestDiff) {
    best = 'full';
  }

  return best;
}
