// Text on one line: each line break, with the white space around it, becomes one space. A loop instead of the regex
// /\s*\n\s*/g, whose two `\s*` overlap and take quadratic time on a long run of white space.
const BREAK = /[\r\n]/;

/** @param {string} text */
export function oneLine(text) {
  let out = '';
  let pending = false; // a line break is waiting for the next character that is not white space
  let space = ''; // white space after the last character that is not white space, kept only if text follows on the same line
  for (const ch of String(text)) {
    if (/\s/.test(ch)) {
      if (BREAK.test(ch)) pending = true;
      space += ch;
    } else {
      out += pending ? ' ' : space;
      out += ch;
      pending = false;
      space = '';
    }
  }
  return out + (pending ? ' ' : space);
}
