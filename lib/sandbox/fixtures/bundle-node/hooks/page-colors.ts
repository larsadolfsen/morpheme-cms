// Test fixture for lib/sandbox/bundle.test.mjs: imports node:fs (refused).
// Exposes a default export. No dependencies beyond what the case imports.
import fs from 'node:fs';
export default () => fs;
