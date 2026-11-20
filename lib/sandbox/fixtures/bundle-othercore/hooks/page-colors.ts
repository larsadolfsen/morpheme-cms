// Test fixture for lib/sandbox/bundle.test.mjs: imports a core module that is not allowed (refused).
// Exposes a default export. No dependencies beyond what the case imports.
import apps from '@morphemecms/cms/site/apps';
export default () => apps;
