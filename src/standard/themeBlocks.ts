// The theme's blocks for the editor: the drawing of each standard block (View.tsx in a theme's blocks/<type>/, given
// the view the block's contract makes, view.ts), the theme in use's (@theme), else the standard theme's
// (packages/editor/theme/blocks/), as on the site (sites.ts). A theme has no blocks of its own: only the look of the
// standard ones. Apart from editor.ts, so loading the blocks waits until the editor's blocks (registry.tsx) need them.
import type { View } from './view';

const byType = <T>(found: Record<string, T>) => Object.fromEntries(Object.entries(found).map(([file, d]) => [file.split('/').at(-2)!, d]));

/** How each standard block looks in the editor, by its type. */
export const blockViews: Record<string, View<any>> = {
  ...byType(import.meta.glob<View<any>>('@saturn/blocks/*/View.tsx', { eager: true, import: 'default' })),
  ...byType(import.meta.glob<View<any>>('@theme/blocks/*/View.tsx', { eager: true, import: 'default' })),
};
