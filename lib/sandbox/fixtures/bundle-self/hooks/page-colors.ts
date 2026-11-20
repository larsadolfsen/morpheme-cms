// Test fixture for lib/sandbox/bundle.test.mjs: imports @app/self.
// Exposes a default export. No dependencies beyond what the case imports.
import self from '@app/self';
export default () => self.id;
