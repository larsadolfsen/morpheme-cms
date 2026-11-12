// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook, gives colours that are not valid.
// Exposes a default export. No dependencies.
export default () => ({ light: { bg: 'red' }, dark: { bg: '#000000', accent: '#ffffff' } });
