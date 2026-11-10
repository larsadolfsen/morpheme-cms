// The site settings that were Danish names in code, now settings with English defaults: the folder of the files shown
// under "Files" (folders.files), the address of the testimonials page (testimonialsPath) and the anchor of the
// directions on the contact page (contactAnchor). A site that sets one in its src/site/config.ts always gets that
// value. A site that sets none and still has the old Danish content keeps working: the old value is found in the
// content (the facts, lib/siteFacts.mjs), so a rename never stops a build that was fine before.
// Exposes resolveSettings, settingProblems, reduceFacts. Pure: no file access, so the site, the editor and Node scripts can all use it.
// Depends on: github-slugger (the anchor a heading gets, as Astro gives it).
import { slug } from 'github-slugger';

// The old Danish values, kept on purpose: a live site that pins nothing keeps them (found, not assumed).
const OLD_FOLDER = 'public/filer'; // language-ok: the old Danish files folder, found in a live site
const OLD_PAGE = '/udtalelser/'; // language-ok: the old Danish testimonials address, found in a live site
const OLD_ANCHOR = 'find-vej'; // language-ok: the old Danish contact anchor, found in a live site

const DEFAULT_FOLDER = 'public/files';
const DEFAULT_PAGE = '/testimonials/';
const DEFAULT_ANCHOR = 'directions';

/** An anchor written out as text: an id, a `{#id}`, a link to `#id`; a longer word that holds it is another anchor. */
const mentions = (text, anchor) => new RegExp(`(^|[^\\p{L}\\p{N}_-])${anchor}(?![\\p{L}\\p{N}_-])`, 'u').test(text);

/** Whether a page has the anchor: a heading whose slug it is (`## Directions`), or the anchor written out. */
const hasAnchor = (text, anchor) =>
  mentions(text, anchor) ||
  text.split('\n').some((line) => {
    const heading = line.match(/^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/);
    return heading ? slug(heading[1]) === anchor : false;
  });

/**
 * The part of the facts that resolveSettings reads, for a bundle: the addresses of the two testimonials pages, if the site has
 * them, and the two anchors, if the contact page has them. The whole facts hold the text of a page and every address, which
 * a bundle must not carry (the site's CSS would get a class for every word in them that is one).
 * @param {{ dirs: string[]; pageAddresses: string[]; contactText: string }} facts
 */
export const reduceFacts = (facts) => ({
  dirs: facts.dirs,
  pageAddresses: facts.pageAddresses.filter((address) => address === OLD_PAGE || address === DEFAULT_PAGE),
  contactText: [OLD_ANCHOR, DEFAULT_ANCHOR].filter((anchor) => hasAnchor(facts.contactText ?? '', anchor)).join('\n'),
});

/**
 * The three settings as the site has them, with where each came from.
 * @param {{ pinned?: string[]; folders?: { files?: string }; testimonialsPath?: string; contactAnchor?: string }} config The site's config
 *   (from defineSite; a hand-written one that lacks a setting has the default).
 * @param {{ dirs: string[]; pageAddresses: string[]; contactText: string }} facts What the site's files hold (siteFacts.mjs):
 *   which of the two files folders exist, the addresses of the pages, the text of the contact page.
 * @returns {{
 *   filesFolder: string; testimonialsPath: string; contactAnchor: string; pageAddresses: string[];
 *   report: { setting: string; value: string; from: 'pinned' | 'detected' | 'default'; note: string }[];
 *   warnings: string[];
 * }}
 */
export function resolveSettings(config, facts) {
  const pinned = new Set(config.pinned ?? []);
  const report = [];
  const warnings = [];
  const choose = (setting, own, detected, standard, notes) => {
    if (pinned.has(setting)) {
      report.push({ setting, value: own, from: 'pinned', note: notes.pinned(own) });
      return own;
    }
    if (detected) {
      report.push({ setting, value: detected, from: 'detected', note: notes.detected(detected) });
      return detected;
    }
    report.push({ setting, value: standard, from: 'default', note: notes.default(standard) });
    return standard;
  };

  const hasOld = facts.dirs.includes(OLD_FOLDER);
  const hasNew = facts.dirs.includes(DEFAULT_FOLDER);
  const filesPin = `add folders: { files: '${OLD_FOLDER}' } to src/site/config.ts`;
  if (hasOld && hasNew && !pinned.has('folders.files'))
    warnings.push(
      `Both ${OLD_FOLDER} and ${DEFAULT_FOLDER} exist, so the Files screen lists only ${DEFAULT_FOLDER}. The files in ${OLD_FOLDER} still work at /filer/<name>, but are not listed under Files. To list them instead, ${filesPin}.`,
    );
  const filesFolder = choose(
    'folders.files',
    config.folders?.files ?? DEFAULT_FOLDER,
    hasOld && !hasNew ? OLD_FOLDER : '',
    DEFAULT_FOLDER,
    {
      pinned: (v) => `Files folder: ${v} (set in src/site/config.ts).`,
      detected: (v) => `Files folder: ${v} (found in this site; the standard is now ${DEFAULT_FOLDER}). To pin it ${filesPin}.`,
      default: (v) => `Files folder: ${v} (the standard).`,
    },
  );

  const pages = new Set(facts.pageAddresses);
  const pagePin = `add testimonialsPath: '${OLD_PAGE}' to src/site/config.ts`;
  const testimonialsPath = choose(
    'testimonialsPath',
    config.testimonialsPath ?? DEFAULT_PAGE,
    pages.has(OLD_PAGE) && !pages.has(DEFAULT_PAGE) ? OLD_PAGE : '',
    DEFAULT_PAGE,
    {
      pinned: (v) => `Testimonials page: ${v} (set in src/site/config.ts).`,
      detected: (v) => `Testimonials page: ${v} (found in this site; the standard is now ${DEFAULT_PAGE}). To pin it ${pagePin}.`,
      default: (v) => `Testimonials page: ${v} (the standard).`,
    },
  );

  const text = facts.contactText ?? '';
  const anchorPin = `add contactAnchor: '${OLD_ANCHOR}' to src/site/config.ts`;
  const contactAnchor = choose(
    'contactAnchor',
    config.contactAnchor ?? DEFAULT_ANCHOR,
    hasAnchor(text, OLD_ANCHOR) && !hasAnchor(text, DEFAULT_ANCHOR) ? OLD_ANCHOR : '',
    DEFAULT_ANCHOR,
    {
      pinned: (v) => `Contact page anchor: #${v} (set in src/site/config.ts).`,
      detected: (v) =>
        `Contact page anchor: #${v} (found on the contact page; the standard is now #${DEFAULT_ANCHOR}). To pin it ${anchorPin}.`,
      default: (v) => `Contact page anchor: #${v} (the standard).`,
    },
  );

  return { filesFolder, testimonialsPath, contactAnchor, pageAddresses: [...pages], report, warnings };
}

/**
 * What is wrong with the settings. A problem stops the build: a value the site set that has the wrong shape. A warning
 * does not: the site works, but something is probably not as the owner expects.
 * @param {{ pinned?: string[] }} config
 * @param {ReturnType<typeof resolveSettings>} settings
 * @param {{ path: string; text: string }[]} files The files of src/content and src/data.
 * @returns {{ problems: string[]; warnings: string[] }}
 */
export function settingProblems(config, settings, files) {
  const pinned = new Set(config.pinned ?? []);
  const problems = [];
  const warnings = [...settings.warnings];

  if (pinned.has('folders.files')) {
    const v = settings.filesFolder;
    if (!v.startsWith('public/') || v === 'public/' || v.endsWith('/'))
      problems.push(
        `src/site/config.ts: folders.files is ${JSON.stringify(v)}; it is a folder under public/ without a slash at the end ("public/files").`,
      );
  }
  if (pinned.has('testimonialsPath')) {
    const v = settings.testimonialsPath;
    if (v.length < 2 || !v.startsWith('/') || !v.endsWith('/'))
      problems.push(
        `src/site/config.ts: testimonialsPath is ${JSON.stringify(v)}; it is a page address that starts and ends with a slash ("/testimonials/").`,
      );
  }
  if (pinned.has('contactAnchor')) {
    const v = settings.contactAnchor;
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(v))
      problems.push(
        `src/site/config.ts: contactAnchor is ${JSON.stringify(v)}; it is an anchor in small letters without # or spaces ("directions").`,
      );
  }

  if (files.some((f) => f.text.includes('data-block="testimonials"')) && !settings.pageAddresses.includes(settings.testimonialsPath))
    warnings.push(
      `A page shows the testimonials block, but no page has the address ${settings.testimonialsPath} (testimonialsPath), which its links go to. Add that page, or set testimonialsPath in src/site/config.ts to the page that has them.`,
    );

  return { problems, warnings };
}
