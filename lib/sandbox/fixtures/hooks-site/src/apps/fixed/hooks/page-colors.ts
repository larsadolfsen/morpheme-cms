// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook, gives fixed colours from its settings.
// Exposes a default export. No dependencies.
export default (input: { settings: { tint: string } }) => ({
  light: { bg: '#ffffff', accent: input.settings.tint },
  dark: { bg: '#000000', accent: input.settings.tint },
});
