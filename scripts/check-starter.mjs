// Checks the starter (starter/) as a site: the package as npm would give it (npm pack), installed in a copy of the
// starter in a folder of its own, which then must pass its checks (npm run check) and build (npm run build); with
// --screens, also every screen of the editor (check:screens, with Playwright at this repository's version). It takes a
// few minutes and needs npm's registry. Run: node packages/editor/scripts/check-starter.mjs [--screens]
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ownRepoEnv } from './git-env.mjs';

const pkgDir = fileURLToPath(new URL('../', import.meta.url));
const npm = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : ['npm'];
// In the starter's folder without git's own variables, so its git and its checks (check:worker archives HEAD) work in
// its repository, also when this runs in a git hook.
const run = (cwd, cmd, args, env = {}) =>
  execFileSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: { ...(cwd === pkgDir ? process.env : ownRepoEnv()), ...env, npm_config_audit: 'false', npm_config_fund: 'false' },
  });
const npmRun = (cwd, ...args) => run(cwd, npm[0], [...npm.slice(1), ...args]);

run(pkgDir, process.execPath, ['scripts/starter.mjs', '--check']);

const dir = mkdtempSync(join(tmpdir(), 'morpheme-starter-'));
npmRun(pkgDir, 'pack', '--pack-destination', dir);
const tarball = readdirSync(dir).find((f) => f.endsWith('.tgz'));
// A site from the previous release's starter must take this package with `npm install`, as the Update button's path
// does (an ERESOLVE here is "Updating needs npm"): resolve only, nothing is downloaded or installed.
const previous = join(dir, 'previous');
mkdirSync(previous);
cpSync(join(pkgDir, 'scripts', 'fixtures', 'starter-0.14.2.package.json'), join(previous, 'package.json'));
npmRun(previous, 'install', '--package-lock-only', '--ignore-scripts', join(dir, tarball));
const site = join(dir, 'site');
cpSync(join(pkgDir, 'starter'), site, { recursive: true });
const file = join(site, 'package.json');
const manifest = JSON.parse(readFileSync(file, 'utf8'));
manifest.dependencies['@morphemecms/cms'] = `file:../${tarball}`;
writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);

// A repository with one commit, as a new site's is (check:worker reads the files of HEAD).
run(site, 'git', ['init', '-q']);
npmRun(site, 'install');

// An installed app with a Worker part, as the store gives it and the editor writes it: app.json in the editor's own
// form (not Prettier's), and worker/apps.js as `morpheme app-workers` writes it. The site's own `prettier --check .`
// must leave both alone (starter/.prettierignore), or every site that installs an app breaks its own check.
const app = join(site, 'src', 'apps', 'app_a030dfba69793996');
mkdirSync(app, { recursive: true });
writeFileSync(
  join(app, 'app.json'),
  '{"api":4,"label":"Fixture","publisher":"Example","license":"MIT","icon":"event","hint":"An app for this check.","version":"1.0.0"}',
);
writeFileSync(join(app, 'LICENSE'), 'MIT License\n\nCopyright (c) Example\n');
writeFileSync(join(app, 'worker.js'), "export default { async fetch() { return new Response('ok') } }\n");
writeFileSync(join(site, 'src', 'data', 'apps.json'), `${JSON.stringify({ installed: ['app_a030dfba69793996'] })}\n`);
npmRun(site, 'exec', '--', 'morpheme', 'app-workers');

run(site, 'git', ['add', '-A']);
run(site, 'git', ['-c', 'user.name=starter', '-c', 'user.email=starter@example.com', 'commit', '-q', '-m', 'Starter']);
npmRun(site, 'run', 'check');
npmRun(site, 'run', 'build');
// A site updated from before 0.17 has pages with blocks that have become others: its check:editor must still pass (it only says
// so), `morpheme migrate` writes them in the new form, and then nothing is left to migrate (see lib/migrate-content.mjs).
{
  const morpheme = (...args) =>
    spawnSync(process.execPath, ['node_modules/@morphemecms/cms/bin/morpheme.mjs', ...args], { cwd: site, encoding: 'utf8' });
  const fixture = join(site, 'src/content/pages/old-blocks.md');
  cpSync(join(pkgDir, 'scripts', 'fixtures', 'old-blocks.md'), fixture);
  const expect = (label, result, status, text) => {
    const out = `${result.stdout}${result.stderr}`;
    if (result.status !== status || (text && !out.includes(text))) {
      console.error(out);
      throw new Error(`${label}: expected exit ${status}${text ? ` and "${text}"` : ''}, got ${result.status}.`);
    }
  };
  expect('check:editor on old blocks', morpheme('check:editor'), 0, 'npx morpheme migrate');
  expect('migrate --check on old blocks', morpheme('migrate', '--check'), 1, 'old-blocks.md');
  expect('migrate', morpheme('migrate'), 0, 'migrated: src/content/pages/old-blocks.md');
  expect('migrate again', morpheme('migrate'), 0, 'Nothing to migrate.');
  expect('check:editor after migrate', morpheme('check:editor'), 0);
  expect('check:content after migrate', morpheme('check:content'), 0);
  rmSync(fixture);
}
const playwright = createRequire(join(pkgDir, 'package.json'))('playwright/package.json').version;
npmRun(site, 'install', '--no-save', `playwright@${playwright}`, ...(process.argv.includes('--screens') ? [] : ['--ignore-scripts']));
// The scripts the package ships run from node_modules, where Node cannot run TypeScript: the screens check loads its
// texts, then stops at the folder it is given having no built site (no browser needed). Any other stop is a failure.
const probe = spawnSync(process.execPath, ['node_modules/@morphemecms/cms/bin/morpheme.mjs', 'check:screens', join(dir, 'no-such-dist')], {
  cwd: site,
  encoding: 'utf8',
});
if (!`${probe.stdout}${probe.stderr}`.includes('There is no built site')) {
  console.error(probe.stdout, probe.stderr);
  throw new Error('check:screens does not start from the installed package (see above).');
}
if (process.argv.includes('--screens')) npmRun(site, 'run', 'check:screens');
console.log(`The starter works as a site with the package from npm pack (${site}).`);
