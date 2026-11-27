// The letters of a placeholder thumbnail (the page list, a page with no image): the first two letters of the title's first word,
// both in upper case ("Blocks" and "Blog posts" give "BL"; "a" gives "A"). A first word with no
// letter or digit ("— draft", "") falls back to "#". No React here.
export function initials(title) {
  const word =
    String(title ?? '')
      .trim()
      .split(/\s+/)[0] ?? '';
  const chars = Array.from(word).filter((c) => /[\p{L}\p{N}]/u.test(c));
  if (!chars.length) return '#';
  const [first, second] = chars;
  return (first + (second ?? '')).toLocaleUpperCase();
}
