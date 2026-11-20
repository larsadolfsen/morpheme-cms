// Test fixture for lib/sandbox/bundle.test.mjs: imports an allowed core module.
// Exposes a default export. No dependencies beyond what the case imports.
import { CONTRASTS } from '@morphemecms/cms/lib/dynamic-colors';
export default () => typeof CONTRASTS;
