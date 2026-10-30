// After the build: the pages and blog posts that are Planlagt, with their time, in dist/_scheduled.json, for the site's
// Worker, which publishes each hour those whose time has come (packages/editor/worker/publish.js). Only the Worker reads it: on the
// site the address gives nothing (packages/editor/worker/index.js).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KINDS, scheduleOf } from '../lib/scheduled.mjs';

const ROOT = `${process.cwd()}/`;
const list = [];
for (const { dir } of KINDS)
  for (const file of readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.md'))) {
    const { status, publishAt } = scheduleOf(readFileSync(join(ROOT, dir, file), 'utf8'));
    if (status === 'scheduled' && publishAt) list.push({ path: `${dir}/${file}`, publishAt });
  }
writeFileSync(join(ROOT, process.argv[2] ?? 'dist', '_scheduled.json'), `${JSON.stringify(list)}\n`);
