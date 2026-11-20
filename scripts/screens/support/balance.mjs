// Which shard runs which screens unit, by the unit's measured time (plan docs/superpowers/plans/2026-11-18-build-and-check-speed.md, A8;
// skill checks, "What CI runs"). Read by scripts/editor-screens.mjs, refreshed by scripts/refresh-unit-times.mjs, tested in
// scripts/screens-balance.test.mjs.
//
// The times are a small committed file, scripts/screens/unit-times.json: { "measured": "<where from>", "seconds": { "<unit name>": s } },
// taken from the "unit N name: S s" lines the runner prints in a full run. A unit with no time gets the average of the file. When the file is
// missing, unreadable or has no usable time, every unit goes to shard index % N, as before this file existed. A time only moves a unit
// between shards: no unit is skipped, and every selected unit runs in exactly one shard.
import { readFileSync } from 'node:fs';

export const TIMES_FILE = new URL('../unit-times.json', import.meta.url);

/** The time every unit costs at least, in seconds (opening the page, the browser's own work): a unit that printed 0 s still takes some. */
const MIN_SECONDS = 1;

/** The units' seconds from the lines `unit <number> <name>: <seconds> s` of a runner log (a CI timestamp before it is fine). A name that
 * appears more than once keeps its last time. @returns {Map<string, number>} */
export function parseUnitLines(text) {
  const times = new Map();
  for (const line of String(text).split('\n')) {
    const m = line.match(/(?:^|\s)unit \d+ (.+): (\d+) s\s*$/);
    if (m) times.set(m[1], Number(m[2]));
  }
  return times;
}

/** The committed times, or null when the file is missing, unreadable or holds no usable time (the caller then deals by index).
 * @returns {Map<string, number> | null} */
export function readTimes(file = TIMES_FILE) {
  try {
    const seconds = JSON.parse(readFileSync(file, 'utf8')).seconds;
    const entries = Object.entries(seconds ?? {}).filter(([, s]) => Number.isFinite(s) && s >= 0);
    return entries.length ? new Map(entries) : null;
  } catch {
    return null;
  }
}

/** Each name's cost: its time, or the average of the known times when it has none. */
export function weights(names, times) {
  const known = [...times.values()];
  const average = known.reduce((a, b) => a + b, 0) / known.length;
  return names.map((name) => Math.max(times.get(name) ?? average, MIN_SECONDS));
}

/**
 * The shard (0-based) of each name, in the order of `names`. Deals by index % shards when there are no times; otherwise the slowest unit
 * first, each to the shard with the least time so far (ties: the lowest shard), so the result is the same on every run and in every shard.
 * @param {string[]} names the selected units, in their order
 * @param {number} shards
 * @param {Map<string, number> | null} times
 * @returns {number[]}
 */
export function assignShards(names, shards, times) {
  if (!times || times.size === 0 || shards <= 1) return names.map((_, i) => i % shards);
  const w = weights(names, times);
  const load = new Array(shards).fill(0);
  const shard = new Array(names.length);
  const order = names.map((_, i) => i).sort((a, b) => w[b] - w[a] || a - b);
  for (const i of order) {
    let best = 0;
    for (let k = 1; k < shards; k++) if (load[k] < load[best]) best = k;
    shard[i] = best;
    load[best] += w[i];
  }
  return shard;
}

/** The time of each shard (seconds) for an assignment. */
export function shardLoads(names, shards, times, assignment = assignShards(names, shards, times)) {
  const w = times && times.size ? weights(names, times) : names.map(() => 1);
  const load = new Array(shards).fill(0);
  assignment.forEach((k, i) => (load[k] += w[i]));
  return load;
}

/** The fewest shards (at most `max`) whose slowest shard takes no more than `target` seconds, from the same times. */
export function suggestShards(names, times, target, max = 16) {
  for (let n = 1; n < max; n++) if (Math.max(...shardLoads(names, n, times)) <= target) return n;
  return max;
}
