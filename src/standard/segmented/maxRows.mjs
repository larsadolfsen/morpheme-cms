// `Max rows` of "Segmented list": how many rows show before the button `Show more`. Plain JavaScript so the tests can read it.

/** The `Max rows` a list's field holds as a whole number of at least 1; anything else (empty, 0, a negative, text, NaN) is no limit.
 * @param {unknown} value
 * @returns {number | undefined}
 */
export const maxRowsOf = (value) => {
  const n = typeof value === 'string' ? (value.trim() === '' ? NaN : Number(value)) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) && Math.floor(n) >= 1 ? Math.floor(n) : undefined;
};

/** How many rows show before the button of a list of `count` rows: undefined (all rows, no button) when there is no limit or it
 * reaches the last row.
 * @param {number | undefined} max
 * @param {number} count
 * @returns {number | undefined}
 */
export const cutAt = (max, count) => (max !== undefined && max < count ? max : undefined);
