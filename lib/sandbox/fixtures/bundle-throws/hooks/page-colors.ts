// Test fixture for lib/sandbox/bundle.test.mjs: throws at the top level; bundling must not run it.
// Exposes a default export. No dependencies beyond what the case imports.
throw new Error('app code ran');
export default () => 1;
