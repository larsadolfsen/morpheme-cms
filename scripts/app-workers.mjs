// Writes worker/apps.js: an import of each app's part of the Worker (src/apps/<app>/worker.js,
// packages/editor/lib/apps.mjs). Run it after adding or removing an app's worker.js; npm run check:content says when.
import { writeAppWorkers } from '../lib/apps.mjs';

const root = `${process.cwd()}/`;
if (writeAppWorkers(root)) console.log('worker/apps.js er skrevet igen.');
