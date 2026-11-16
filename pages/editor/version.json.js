// /editor/version.json: the same as /edit/version.json, for a site whose live build is read at the old address while the sites move
// (packages/editor/site/live-diff.mjs asks /edit/ first). Removed in a later version.
export { GET } from '../edit/version.json.js';
