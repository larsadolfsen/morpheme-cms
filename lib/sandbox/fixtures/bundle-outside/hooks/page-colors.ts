// Test fixture for lib/sandbox/bundle.test.mjs: imports a file outside the app folder (refused).
// Exposes a default export. No dependencies beyond what the case imports.
import secret from '../../secret';
export default () => secret;
