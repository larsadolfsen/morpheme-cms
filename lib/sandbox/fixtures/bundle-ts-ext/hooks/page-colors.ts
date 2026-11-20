// Test fixture for lib/sandbox/bundle.test.mjs: imports allowed core modules with a file extension.
// Exposes a default export. No dependencies beyond what the case imports.
import { isColor } from '@morphemecms/cms/lib/colors.ts';
import { APP_HOOKS } from '@morphemecms/cms/lib/hooks';
export default () => [typeof isColor, APP_HOOKS];
