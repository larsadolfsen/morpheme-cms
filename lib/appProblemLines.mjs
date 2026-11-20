// Groups the problems of an app's last build into lines: the problems with the same place, hook and message are one.
// Exposes groupProblems. The editor's AppProblems.tsx shows the lines; it is in this file so node:test can test it.
/** @typedef {import('./appProblems.mjs').AppProblem} AppProblem
 * @typedef {{ place: AppProblem['place'], hook?: string, message: string, pages: string[] }} ProblemLine */

/** The problems as lines, in the order of the first problem of each: those with the same place, hook and message are
 * one line with the pages (each once) they were found on; `pages` is empty when none of them has a page.
 * @param {AppProblem[]} problems @returns {ProblemLine[]} */
export function groupProblems(problems) {
  /** @type {Map<string, ProblemLine>} */
  const lines = new Map();
  for (const p of problems) {
    const key = JSON.stringify([p.place, p.hook ?? '', p.message]);
    let line = lines.get(key);
    if (!line) {
      line = { place: p.place, hook: p.hook, message: p.message, pages: [] };
      lines.set(key, line);
    }
    if (p.page && !line.pages.includes(p.page)) line.pages.push(p.page);
  }
  return [...lines.values()];
}
