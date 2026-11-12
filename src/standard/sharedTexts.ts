// The shared texts of the standard blocks that have them (shared.ts in the block's folder, see
// ../shared.ts), by the path of the file like a site's own (src/apps/<app>/blocks/<type>/shared.ts): the site puts
// them before its own (packages/editor/site/site.ts), so a block of its own by the same name has its own instead.
import type { SharedTexts } from '../shared';

export const standardShared = import.meta.glob<SharedTexts>('./*/shared.ts', { eager: true, import: 'default' });
