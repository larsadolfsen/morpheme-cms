// The blocks an app draws with no code (`listBlocks` in app.json, contract 6; lib/appListBlocks.mjs): for each one the core's block it draws (`draws`),
// the list it reads and its starting props. Pure: the editor (registry.tsx) and the site (views.ts) both make their blocks from this.
import { DRAWS, listBlockProps, listBlockSettingNames, listBlockType, siteListId } from '../../lib/appListBlocks.mjs';
import { appIdOf } from '../../lib/appId.mjs';

/** What an app.json says of its list blocks and lists (the parts this reads). */
export type ListBlockManifest = {
  api?: number;
  lists?: { id: string }[];
  listBlocks?: {
    type: string;
    label: string;
    icon: string;
    hint: string;
    draws: string;
    list: string;
    map?: Record<string, string>;
    settings?: string[];
  }[];
};

/** One list block of an installed app, ready to draw. */
export type ListBlockOf = {
  /** The type in a page: `<app id>.<type>`. */
  type: string;
  app: string;
  label: string;
  icon: string;
  hint: string;
  /** The standard block it draws. */
  draws: string;
  /** The id of the list on the site (`<app id>.<id>`, or `posts`, `testimonials`). */
  from: string;
  /** What a new block starts with: `from` and the default `map`. */
  start: Record<string, unknown>;
  /** The names of the drawn block's fields the owner does not see: `from`, `map` and the settings the block does not offer. */
  hidden: string[];
};

/** The fields each setting stands for in the drawn block (`button` is its text and its page). */
const FIELDS: Record<string, string[]> = { button: ['button', 'buttonHref'] };

/** The list blocks of the apps, by the path of each app's app.json (`/src/apps/<id>/app.json`). Only contract 6 apps have them; one that names a block
 * the core cannot draw is left out (the check says why). */
export function listBlocksOf(manifests: Record<string, ListBlockManifest>): ListBlockOf[] {
  return Object.entries(manifests).flatMap(([path, manifest]) => {
    if (manifest?.api !== 6 || !Array.isArray(manifest.listBlocks)) return [];
    const app = appIdOf(path);
    const own = (manifest.lists ?? []).map((l) => l.id);
    return manifest.listBlocks.flatMap((b) => {
      const drawn = DRAWS[b.draws];
      if (!drawn) return [];
      const offered = listBlockSettingNames(b);
      const left = drawn.settings.filter((s) => !offered.includes(s)).flatMap((s) => FIELDS[s] ?? [s]);
      return [
        {
          type: listBlockType(app, b.type),
          app,
          label: b.label,
          icon: b.icon,
          hint: b.hint,
          draws: b.draws,
          from: siteListId(app, b.list, own),
          start: listBlockProps(app, b, own),
          hidden: ['from', 'map', ...left],
        },
      ];
    });
  });
}

/** The props a list block draws with: its own list, whatever the saved props say, so the block never reads another list. */
export const withList = <P extends Record<string, unknown>>(props: P, block: Pick<ListBlockOf, 'from'>): P => ({
  ...props,
  from: block.from,
});
