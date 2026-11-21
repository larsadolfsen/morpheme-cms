// Removes every match of a pattern, again and again until none is left, so a match that removing another one puts
// together (`<scr<b>ipt>`, `<!<!---->--`) is removed too. Used where HTML is turned into text or compared.
/** @param {string} text @param {RegExp} pattern a global pattern @returns {string} */
export function stripAll(text, pattern) {
  let before;
  let after = text;
  do {
    before = after;
    after = before.replace(pattern, '');
  } while (after !== before);
  return after;
}
