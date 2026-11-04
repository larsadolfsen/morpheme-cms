// Tests for worker/apps.js in lib/apps.mjs: appWorkersProblems and writeAppWorkers accept the file with CRLF line
// endings (git on Windows) and still find and rewrite one that is out of date.
import { describe, it, after, before } from 'node:test';
import { strict as assert } from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appWorkersFile, appWorkersProblems, writeAppWorkers } from './apps.mjs';

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
});
