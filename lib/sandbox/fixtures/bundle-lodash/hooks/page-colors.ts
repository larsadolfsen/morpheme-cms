// Test fixture for lib/sandbox/bundle.test.mjs: imports lodash (refused).
// Exposes a default export. No dependencies beyond what the case imports.
import _ from 'lodash';
export default () => _;
