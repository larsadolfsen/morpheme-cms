// Test fixture for lib/sandbox/bundle.test.mjs: imports a file in its own folder.
// Exposes a default export. No dependencies beyond what the case imports.
import helper from './helper';
export default () => helper();
