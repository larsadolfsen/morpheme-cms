// The pages and blog posts that are Scheduled (`status: "scheduled"` with `publishAt`, packages/editor/lib/status.mjs), for
// publishing them once their time has come: the build lists them (packages/editor/scripts/scheduled-list.mjs), and each hour the
// site's Worker makes those whose time has come Published in one commit on main (packages/editor/worker/publish.js), which builds the
// site. No dependencies, so the Worker can use it.
import { stateOf } from './status.mjs';

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---/;
// The two fields as the editor writes them (packages/editor/src/frontmatter.mjs), one line each.
const line = (name) => new RegExp(`^${name}: *"?([^"\\r\\n]*)"?\\r?\\n`, 'm');

/** The folders with pages and posts, and what one is called in a commit. The names are Danish, as the Worker's commit
 * messages are (written as escapes: the Worker's language file takes over in batch 5 of the English-source work). */
export const KINDS = [
  { dir: 'src/content/blog', name: 'blogindl\u00e6g' },
  { dir: 'src/content/pages', name: 'sid\u0065' },
];

/** The status and time in a file's front matter. */
export function scheduleOf(text) {
  const yaml = text.match(FENCE)?.[1] ?? '';
  return { status: yaml.match(line('status'))?.[1], publishAt: yaml.match(line('publishAt'))?.[1] };
}

/** Whether a Scheduled page or post with this time is to be published at `now`. */
export const isDue = (publishAt, now = Date.now()) => stateOf({ status: 'scheduled', publishAt }, now) === 'published';

/** The file Published: its front matter without `status` and `publishAt`. */
export function published(text) {
  const yaml = text.match(FENCE)?.[1] ?? '';
  const rest = `${yaml}\n`.replace(line('status'), '').replace(line('publishAt'), '').replace(/\n$/, '');
  return text.replace(FENCE, `---\n${rest}\n---`);
}

/** A file as a commit names it: `blogindl\u00e6g "x"`. */
export function nameOf(path) {
  const kind = KINDS.find((k) => path.startsWith(`${k.dir}/`));
  return `${kind?.name ?? 'file'} "${path.slice((kind?.dir.length ?? -1) + 1).replace(/(\/index)?\.md$/, '')}"`;
}
