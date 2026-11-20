// How the blocks look on the site, by their folder's name: each drawn from its view by BlockSite.astro (the view its
// contract's load.ts makes, drawn by its View.tsx: views.ts). The theme's RichText.astro shows them in the text of a
// page, and Block.astro one by its type anywhere else, each with its type.
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { blockViews } from './views';

// BlockSite.astro, found by Vite: TypeScript does not read an .astro file.
const [{ default: BlockSite }] = Object.values(import.meta.glob<{ default: AstroComponentFactory }>('./BlockSite.astro', { eager: true }));

/** Every block on the site, by its type. */
export const blockSites: Record<string, AstroComponentFactory> = Object.fromEntries(
  Object.keys(blockViews).map((type) => [type, BlockSite]),
);
