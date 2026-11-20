// How the blocks look on the site, for the site's build (blockViews and blockLoads in
// packages/editor/src/standard/views.ts): the standard blocks' drawing (View.tsx) in the theme in use
// (src/themes/<theme>/blocks/<type>/, @theme), else in the standard theme (packages/editor/theme/blocks/), and the apps'
// blocks' (src/apps/<app>/blocks/<type>/: View.tsx and load.ts). Apart from apps.ts, which the editor loads too.
import type { Contract, View } from './view';

type Views = Record<string, { default: View<any> }>;

/** The standard blocks' drawings in the standard theme, and in the theme in use (the same, when it is the standard). */
export const themeViews = {
  standard: import.meta.glob<{ default: View<any> }>('@saturn/blocks/*/View.tsx', { eager: true }) as Views,
  own: import.meta.glob<{ default: View<any> }>('@theme/blocks/*/View.tsx', { eager: true }) as Views,
};

/** The apps' blocks: their drawing (View.tsx) and their view on the site (load.ts). */
export const appLooks = {
  views: import.meta.glob<{ default: View<any> }>('/src/apps/*/blocks/*/View.tsx', { eager: true }) as Views,
  loads: import.meta.glob<Contract<any>>('/src/apps/*/blocks/*/load.ts', { eager: true }),
};
