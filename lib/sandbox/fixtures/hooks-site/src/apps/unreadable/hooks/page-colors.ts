// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook, gives valid colours the test calls unreadable.
// Exposes a default export. No dependencies.
export default () => ({
  light: { bg: '#ffffff', accent: '#ffffff' },
  dark: { bg: '#000000', accent: '#000000' },
});
