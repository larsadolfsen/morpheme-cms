// Modern Web Guidance's legacy-scan (devDependency `modern-web-guidance`, `npm run audit:web`) as a check, like check:phosphor.
// It scans src/, theme/, pages/, lib/, worker/, starter/ and demo/ and fails on a finding that scripts/web-allowlist.json does not know,
// and on an allowlist entry that no longer matches (so the list only shrinks). An entry is `<folder>/<file>|<rule id>` with `max` (how many
// findings the file may have now, never more) and `why` (every entry needs a reason). Line numbers are not part of a key: they move.
// Run: npm run check:web, or node scripts/check-web.mjs; `--list` prints the current counts as the allowlist's lines.
// Depends on: modern-web-guidance (devDependency).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export const FOLDERS = ['src', 'theme', 'pages', 'lib', 'worker', 'starter', 'demo'];

/** The scan's JSON for one folder → { '<folder>/<file>|<rule id>': count }. @param {string} folder @param {any} json */
export function countsOf(folder, json) {
  const counts = {};
  for (const guide of json.guides ?? [])
    for (const rule of guide.rules ?? [])
      for (const f of rule.findings ?? []) {
        const key = `${folder}/${f.file}|${rule.ruleId}`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
  return counts;
}

/** Compares counts with the allowlist. Returns { problems (fail), notes (good news, never a failure) }. */
export function compare(counts, allowlist) {
  const problems = [];
  const notes = [];
  for (const [key, why] of Object.entries(allowlist))
    if (typeof why?.why !== 'string' || !why.why.trim() || !Number.isInteger(why.max) || why.max < 1)
      problems.push(`${key}: an allowlist entry needs "max" (a whole number, 1 or more) and a "why" (the reason).`);
  for (const [key, n] of Object.entries(counts)) {
    const allowed = allowlist[key]?.max;
    const [file, rule] = key.split('|');
    if (allowed === undefined)
      problems.push(
        `${file}: new legacy pattern "${rule}" (${n}). Fix it (npm run audit:web -- retrieve ${rule}), or send the conflict to the PM; an allowlist entry needs a reason.`,
      );
    else if (n > allowed)
      problems.push(`${file}: ${n} findings of "${rule}", ${allowed} allowed (scripts/web-allowlist.json). Fix the new one.`);
  }
  for (const [key, entry] of Object.entries(allowlist)) {
    const n = counts[key] ?? 0;
    if (n === 0) problems.push(`${key}: on the allowlist but no longer found. Remove it from scripts/web-allowlist.json.`);
    else if (n < entry.max) problems.push(`${key}: ${n} found, ${entry.max} allowed. Lower "max" in scripts/web-allowlist.json.`);
  }
  return { problems, notes };
}

function scan() {
  const counts = {};
  for (const folder of FOLDERS) {
    const out = execFileSync('npx', ['--no-install', 'modern-web-guidance', 'legacy-scan', folder, '--json'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    Object.assign(counts, countsOf(folder, JSON.parse(out)));
  }
  return counts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const counts = scan();
  if (process.argv.includes('--list')) {
    console.log(JSON.stringify(Object.fromEntries(Object.entries(counts).map(([k, max]) => [k, { max, why: '' }])), null, 2));
    process.exit(0);
  }
  const allowlist = JSON.parse(readFileSync(new URL('web-allowlist.json', import.meta.url), 'utf8'));
  const { problems } = compare(counts, allowlist);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`check:web: ${Object.keys(counts).length} legacy patterns, all on the allowlist.`);
}
