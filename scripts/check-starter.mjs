// Checks the starter (starter/) as a site: the package as npm would give it (npm pack), installed in a copy of the
// starter in a folder of its own, which then must pass its checks (npm run check) and build (npm run build); with
// --screens, also every screen of the editor (check:screens, with Playwright at this repository's version). It takes a
// few minutes and needs npm's registry. Run: node packages/editor/scripts/check-starter.mjs [--screens]
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
const site = join(dir, 'site');
cpSync(join(pkgDir, 'starter'), site, { recursive: true });
const file = join(site, 'package.json');
const manifest = JSON.parse(readFileSync(file, 'utf8'));
manifest.dependencies['@morphemecms/cms'] = `file:../${tarball}`;
writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);

// A repository with one commit, as a new site's is (check:worker reads the files of HEAD).
run(site, 'git', ['init', '-q']);
npmRun(site, 'install');
run(site, 'git', ['add', '-A']);
run(site, 'git', ['-c', 'user.name=starter', '-c', 'user.email=starter@example.com', 'commit', '-q', '-m', 'Starter']);
npmRun(site, 'run', 'check');
npmRun(site, 'run', 'build');
if (process.argv.includes('--screens')) {
  const playwright = createRequire(join(pkgDir, 'package.json'))('playwright/package.json').version;
  npmRun(site, 'install', '--no-save', `playwright@${playwright}`);
  npmRun(site, 'run', 'check:screens');
}
console.log(`Starteren virker som et site med pakken fra npm pack (${site}).`);
