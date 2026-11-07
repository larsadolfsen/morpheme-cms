// Checks the pending release notes: each note has its twin in every locale with the same kind, an id that matches its file name,
// and the fields and screenshot its kind needs (a card: title, text and a screenshot of at most 200 KB; a line: text only).
// Run by npm run check:release-notes; usage: node scripts/check-release-notes.mjs [root]. Exits 1 and prints each problem.
import { problemsOf } from '../lib/releaseNotes.mjs';
import { readPending, repoRoot } from './release-notes-pending.mjs';

const problems = problemsOf(readPending(repoRoot(process.argv[2])));
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log('Release notes: no problems.');
