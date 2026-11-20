// The signed-in user's look in the editor: up to two initials from the name, and the address of the GitHub image.
// Exposes initialsOf and avatarOf. No dependencies; AccountRow.tsx uses both.

/** Up to two uppercase initials from `name` (its first and last word); the first letter of `login` when `name` is empty or null.
 * @param {string | null | undefined} name @param {string} login */
export function initialsOf(name, login) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);
  const initials = letters.map((w) => [...w][0]).join('');
  return (initials || [...login][0] || '').toUpperCase();
}

/** The address of a GitHub user's image, `size` pixels square. @param {string} login @param {number} size */
export function avatarOf(login, size) {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?s=${size}`;
}
