// Files whose names differ only by case (Dialog.tsx beside dialog.ts): on a case-insensitive disk (Windows,
// macOS) an import without its extension finds the wrong one. Exposes caseCollisions (pure) and caseCollisionProblems
// (npm run check:content). Only node:fs and node:path.
import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

/** A path without its last extension (theme/ui/Dialog.tsx -> theme/ui/Dialog). @param {string} path */
function stemOf(path) {
  const lastSlash = path.lastIndexOf('/');
  const folder = lastSlash === -1 ? '' : path.slice(0, lastSlash + 1);
  const name = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0) return path;
  return `${folder}${name.slice(0, lastDot)}`;
}

/** Groups of paths whose stems differ only by case, each sorted. @param {string[]} paths @returns {string[][]} */
export function caseCollisions(paths) {
  const groups = new Map();
  for (const p of paths) {
    const key = stemOf(p).toLowerCase();
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(stemOf(p));
  }
  const result = [];
  for (const stems of groups.values()) {
    if (stems.size >= 2) {
      const group = paths.filter((p) => stems.has(stemOf(p))).sort();
      result.push(group);
    }
  }
  return result.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

/** One Danish sentence per such group among the files under each dir (relative to root). @param {string} root @param {string[]} dirs */
export function caseCollisionProblems(root, dirs) {
  const problems = [];
  for (const dir of dirs) {
    const absDir = join(root, dir);
    if (!existsSync(absDir)) continue;

    const files = [];
    const walk = (current) => {
      for (const e of readdirSync(current, { withFileTypes: true })) {
        if (e.isDirectory()) {
          if (e.name !== 'node_modules' && !e.name.startsWith('.')) walk(join(current, e.name));
        } else if (e.isFile()) {
          const rel = relative(root, join(current, e.name)).split('\\').join('/');
          files.push(rel);
        }
      }
    };
    walk(absDir);

    for (const group of caseCollisions(files)) {
      problems.push(
        `${group.join(', ')}: the names are the same when upper and lower case do not count, so an import without a file type finds the wrong one on Windows and macOS. Give one of them another name.`,
      );
    }
  }
  return problems;
}
