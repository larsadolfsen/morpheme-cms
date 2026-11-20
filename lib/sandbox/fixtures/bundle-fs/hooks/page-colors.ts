// Test fixture for lib/sandbox/bundle.test.mjs: imports fs (refused).
// Exposes a default export. No dependencies beyond what the case imports.
import fs from 'fs';
export default () => fs;
