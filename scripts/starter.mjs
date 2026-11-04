// The starter (starter/ in this package's repository, and in the package on npm, since the demo, demo-site.mjs, is built
// from it): what a new site begins with. Its
// package.json depends on this package and on everything the package's code imports (its peerDependencies), and its
// worker/apps.js is as the CMS writes it; this script writes both. With --check, it writes nothing and says what is not
// as it must be, and also when the package's code imports a package that is not among its peerDependencies.
// Run: node scripts/starter.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { appWorkersFile } from '../lib/apps.mjs';
import { importsIn } from '../lib/licenses.mjs';

const pkgDir = fileURLToPath(new URL('../', import.meta.url));
const starter = fileURLToPath(new URL('../starter/', import.meta.url));
const pkg = JSON.parse(readFileSync(`${pkgDir}package.json`, 'utf8'));
const check = process.argv.includes('--check');
const problems = [];

// The package's code (what `files` ships), by the packages it imports.
const own = new Set([pkg.name, ...Object.keys(pkg.peerDependencies)]);
const shipped = (file) => pkg.files.some((entry) => file === entry || file.startsWith(`${entry}/`));
for (const [name, files] of importsIn(pkgDir)) {
  const file = files.map((f) => f.slice(pkgDir.length)).find(shipped);
  if (file && !own.has(name)) problems.push(`${file} henter ${name}, som ikke står i peerDependencies.`);
}
for (const [name, range] of Object.entries(pkg.peerDependencies))
  if (pkg.devDependencies?.[name] !== range) problems.push(`${name} skal stå i devDependencies som i peerDependencies (${range}).`);

// A site needs every peer the commands and the build use, the optional ones too, except Playwright (only for the
// checks in a browser, run where they are needed).
const deps = Object.fromEntries(
  [[pkg.name, pkg.version], ...Object.entries(pkg.peerDependencies).filter(([name]) => name !== 'playwright')].sort(([a], [b]) =>
    a.localeCompare(b),
  ),
);
const file = `${starter}package.json`;
const site = JSON.parse(readFileSync(file, 'utf8'));
const written = `${JSON.stringify({ ...site, dependencies: deps }, null, 2)}\n`;
const workers = appWorkersFile(starter);
const workersFile = `${starter}worker/apps.js`;
const now = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
};

if (check) {
  if (now(file) !== written) problems.push('starter/package.json passer ikke til pakken. Kør node scripts/starter.mjs.');
  if (now(workersFile) !== workers) problems.push('starter/worker/apps.js passer ikke. Kør node scripts/starter.mjs.');
} else {
  writeFileSync(file, written);
  writeFileSync(workersFile, workers);
}

if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  process.exit(1);
}
console.log(check ? 'Starteren passer til pakken.' : 'Starteren er skrevet.');
