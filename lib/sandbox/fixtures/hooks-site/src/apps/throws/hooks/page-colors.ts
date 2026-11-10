// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook, throws.
// Exposes a default export. No dependencies.
export default () => {
  throw new Error('the hook broke');
};
