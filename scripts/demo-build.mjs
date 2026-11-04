// Builds the CMS's demo (demo/ on the starter, demo-site.mjs) as this repository's own site, for the Worker morpheme-demo
// (wrangler.jsonc): in .morpheme/demo/site/, its content checked and built to its dist/ with what the Worker and the editor
// read there (after-build). Run by `npm run build`, here and in Cloudflare's build. Not in the package (package.json's files).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : ['npm'];

// The package in node_modules/@morphemecms/cms/, as a site has it from npm: the demo's astro.config.mjs, its Worker and
// demo-site.mjs import it by that name. A copy of the files npm would pack, not a link to this folder, which holds
// node_modules/ itself: a recursive readdirSync (usedIcons in site/icons.mjs) follows the link round and round.
const self = join(root, 'node_modules/@morphemecms/cms');
const [{ files }] = JSON.parse(
  execFileSync(npm[0], [...npm.slice(1), 'pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' }),
);
rmSync(self, { recursive: true, force: true });
for (const { path } of files) {
  mkdirSync(dirname(join(self, path)), { recursive: true });
  cpSync(join(root, path), join(self, path));
}
const { demoSite } = await import('./demo-site.mjs');

// One folder that is always the same, which wrangler.jsonc names.
const site = join(root, '.morpheme/demo/site');
rmSync(site, { recursive: true, force: true });
renameSync(demoSite(), site);
console.log('DIAG', process.version, execFileSync('sh', ['-c', 'echo sh-soft=$(ulimit -Sn) sh-hard=$(ulimit -Hn) nproc=$(nproc); grep "open files" /proc/self/limits /proc/$PPID/limits; cat /proc/sys/fs/file-max /proc/sys/fs/nr_open; head -2 /etc/os-release'], { encoding: 'utf8' }));

const run = (args) => execFileSync(process.execPath, args, { cwd: site, stdio: 'inherit' });
run([join(self, 'scripts/check-content.mjs')]);
run([binOf('astro', 'astro', site), 'build']);
run([join(self, 'bin/morpheme.mjs'), 'after-build']);
