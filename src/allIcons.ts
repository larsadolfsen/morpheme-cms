// All Phosphor's icons (regular) as text, by their file, for AnyIcon (icon.tsx): loaded only when it draws one the site
// does not (an app's in the app store). The theme's are in their place, as for Svg (themePlugin, packages/editor/site/theme.mjs).
export const allIcons = import.meta.glob<string>('/node_modules/@phosphor-icons/core/assets/regular/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
