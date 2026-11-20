// A free title for a page or post whose title another file already has: "Test" becomes "Test 2", "Test 1" becomes
// "Test 2" (a number at the end is increased, never added after: no "Test 1 1"), and the lowest number that is free
// is used. `taken(title)` tells whether a title cannot be used.

/**
 * @param {string} title
 * @param {(title: string) => boolean} taken
 * @returns {string}
 */
export function freeTitle(title, taken) {
  const clean = String(title).trim();
  const ending = /^(.*\S)\s+(\d+)$/.exec(clean);
  const stem = ending ? ending[1] : clean;
  for (let n = ending ? Number(ending[2]) + 1 : 2; ; n++) {
    const next = `${stem} ${n}`;
    if (!taken(next)) return next;
  }
}
