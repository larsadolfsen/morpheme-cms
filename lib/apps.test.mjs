// Tests for worker/apps.js in lib/apps.mjs: appWorkersProblems and writeAppWorkers accept the file with CRLF line
// endings (git on Windows) and still find and rewrite one that is out of date.
import { describe, it, after, before } from 'node:test';
import { strict as assert } from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { appBuilds, appIds, oldPageColorsModule, appWorkersFile, appWorkersProblems, writeAppWorkers } from './apps.mjs';

describe('lib/apps.mjs', () => {
  let root;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'apps-'));
    mkdirSync(join(root, 'src/apps/booking'), { recursive: true });
    writeFileSync(join(root, 'src/apps/booking/worker.js'), 'export default {};\n');
    mkdirSync(join(root, 'worker'), { recursive: true });
  });

  after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('appWorkersProblems accepts worker/apps.js with CRLF line endings', () => {
    const file = join(root, 'worker/apps.js');
    writeFileSync(file, appWorkersFile(root).replace(/\n/g, '\r\n'));
    assert.deepEqual(appWorkersProblems(root), []);
  });

  it('writeAppWorkers leaves worker/apps.js with CRLF line endings as it is', () => {
    const file = join(root, 'worker/apps.js');
    const crlfText = appWorkersFile(root).replace(/\n/g, '\r\n');
    writeFileSync(file, crlfText);
    assert.equal(writeAppWorkers(root), false);
    assert.equal(readFileSync(file, 'utf8'), crlfText);
  });

  it('appWorkersProblems finds worker/apps.js out of date', () => {
    const file = join(root, 'worker/apps.js');
    writeFileSync(file, '// old\n');
    assert.equal(appWorkersProblems(root).length, 1);
  });

  it('writeAppWorkers rewrites worker/apps.js out of date', () => {
    const file = join(root, 'worker/apps.js');
    writeFileSync(file, '// old\r\n');
    assert.equal(writeAppWorkers(root), true);
    assert.equal(readFileSync(file, 'utf8'), appWorkersFile(root));
  });

  it('appIds lists permanent ids and own names, and stops on a folder that is not a store id', () => {
    mkdirSync(join(root, 'src/apps/app_a030dfba69793996'), { recursive: true });
    assert.deepEqual(appIds(root), ['app_a030dfba69793996', 'booking']);
    mkdirSync(join(root, 'src/apps/app_xyz'), { recursive: true });
    assert.throws(() => appIds(root), /src\/apps\/app_xyz/);
    rmSync(join(root, 'src/apps/app_xyz'), { recursive: true });
    rmSync(join(root, 'src/apps/app_a030dfba69793996'), { recursive: true });
  });

  it('appBuilds runs build.mjs of an old app and the after-build step of a contract 4 app, and writes the problems once', async () => {
    const site = mkdtempSync(join(tmpdir(), 'builds-'));
    const dist = mkdtempSync(join(tmpdir(), 'builds-dist-'));
    try {
      const app = (id, files) => {
        mkdirSync(join(site, 'src/apps', id), { recursive: true });
        for (const [name, text] of Object.entries(files)) writeFileSync(join(site, 'src/apps', id, name), text);
      };
      mkdirSync(join(site, 'src/data'), { recursive: true });
      writeFileSync(join(site, 'src/data/apps.json'), JSON.stringify({ installed: ['old', 'fine', 'broken'] }));
      app('old', {
        'build.mjs':
          "import { writeFileSync } from 'node:fs'; import { join } from 'node:path'; export default ({ out }) => writeFileSync(join(out, 'old.txt'), 'x');",
      });
      const manifest = JSON.stringify({
        api: 4,
        label: 'A',
        publisher: 'M',
        license: 'MIT',
        icon: 'Gear',
        hint: 'h',
        version: '1.0.0',
        afterBuild: true,
      });
      app('fine', { 'app.json': manifest, 'after-build.ts': "export default () => ({ files: { 'a.json': 1 } });" });
      app('broken', { 'app.json': manifest, 'after-build.ts': "export default () => { throw new Error('no'); };" });
      await appBuilds(site).hooks['astro:build:done']({ dir: pathToFileURL(`${dist}/`), logger: { fork: () => ({}) } });
      assert.equal(readFileSync(join(dist, '_apps/old/old.txt'), 'utf8'), 'x');
      assert.equal(readFileSync(join(dist, '_apps/fine/a.json'), 'utf8'), '1');
      const problems = JSON.parse(readFileSync(join(dist, '_apps/_problems.json'), 'utf8'));
      assert.deepEqual(
        problems.map((p) => [p.app, p.place, p.error]),
        [['broken', 'after-build', 'throw']],
      );
    } finally {
      rmSync(site, { recursive: true, force: true });
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it('oldPageColorsModule has a loader for a hook without an app.json, and none for a contract 4 app', () => {
    const site = mkdtempSync(join(tmpdir(), 'old-colors-'));
    try {
      for (const [id, files] of Object.entries({
        old: ['hooks/page-colors.ts'],
        new4: ['hooks/page-colors.ts', 'app.json'],
        none: ['index.ts'],
      })) {
        for (const file of files) {
          mkdirSync(join(site, 'src/apps', id, file, '..'), { recursive: true });
          writeFileSync(join(site, 'src/apps', id, file), '');
        }
      }
      assert.equal(oldPageColorsModule(site), 'export default { "old": () => import("/src/apps/old/hooks/page-colors.ts") };');
      assert.equal(oldPageColorsModule(join(site, 'nowhere')), 'export default {  };');
    } finally {
      rmSync(site, { recursive: true, force: true });
    }
  });
});
