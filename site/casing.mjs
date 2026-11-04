// Names in one folder that differ only in case (`npm run check:content`): Windows and macOS do not tell them apart, so
// './Redirects' would open redirects.ts there (a .ts is tried before a .tsx) and the check and the build break, though
// Linux finds the right file. Exposes casingProblems, given the repository's files (git ls-files).

/** Each folder whose files (by their name without the last extension) or folders have the same name but for case:
 * Redirects.tsx beside redirects.ts, View.tsx beside view.ts. Img.astro beside Img.tsx is the same name, so not one. */
export function casingProblems(paths) {
  const names = new Map();
  for (const path of paths) {
    const parts = path.split('/');
    parts.forEach((part, i) => {
      const folder = parts.slice(0, i).join('/');
      const name = i === parts.length - 1 ? part.replace(/(.)\.[^.]+$/, '$1') : part;
      const key = `${folder}/${name.toLowerCase()}`;
      if (!names.has(key)) names.set(key, { folder, spellings: new Map() });
      const spellings = names.get(key).spellings;
      if (!spellings.has(name)) spellings.set(name, i === parts.length - 1 ? part : `${part}/`);
    });
  }
  return [...names.values()]
    .filter(({ spellings }) => spellings.size > 1)
    .map(
      ({ folder, spellings }) =>
        `${folder || '.'}/: ${[...spellings.values()].join(' og ')} har samme navn, når store og små bogstaver ses som ens (Windows og macOS gør det). Lad komponenten beholde sit navn, og giv filen ved siden af sin rolle i navnet, fx redirectData.ts (se CLAUDE.md).`,
    );
}
