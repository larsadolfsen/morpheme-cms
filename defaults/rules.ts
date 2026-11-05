// The site's own rules for the editor: the lists the fields that pick something choose from (a page, a
// post, a tag, a testimonial), the prices and testimonials the blocks show, and why an entry cannot be
// deleted (something on the site uses it). The messages are shown in the editor's language (siteText,
// texts.ts).
import type { RepoFile } from '../src/github';
import type { Option, PageState, TestimonialRow } from '../src/fields';
import type { Status } from '../src/FormFrame';
import { blocksIn } from '../lib/blocks.mjs';
import { readFields, splitFrontmatter } from '../src/frontmatter.mjs';
import { siteText } from '../src/i18n';
import { promotionTags, recordUse, tagUses, taggedWith } from '../src/tagUses.mjs';
import type { TagFolders } from '../src/tagUses.mjs';
import { byText, fixedName, slugOf, type Collection, type Relation } from '../src/schema';
import { collections } from '@site/collections';
import { config } from '@site/config';
import { opensOf } from '@site/opens';
import { differentPages, standardPages, standardPaths } from '@site/standardPages';

const fm = (file: RepoFile) => readFields(splitFrontmatter(file.text).yaml);
// A page's address: `path`, or /<file name>/ for pages made in the editor.
const pagePath = (f: RepoFile) => String(fm(f).path ?? `/${slugOf(f.path, config.folders.pages)}/`);
const isPage = (f: RepoFile) => f.path.startsWith(`${config.folders.pages}/`) && f.path.endsWith('.md');
// The addresses of the standard pages, by their key ("Settings" › "Appearance" › "Default pages", standardPages.ts).
const standardOf = (files: { path: string; text: string }[]) => standardPaths(files.find((f) => f.path === config.standardPages)?.text);
// The page that is a standard page (the front page: 'front'), if it is there.
const standardFile = (files: RepoFile[], key: string) => {
  const path = standardOf(files)[key];
  return path ? files.find((f) => isPage(f) && pagePath(f) === path) : undefined;
};
// Where a page is shown: the front page at /, the blog page at /blog/, the others at their own address.
const shownAt = (path: string, files: { path: string; text: string }[]) => {
  const paths = standardOf(files);
  return standardPages.find((p) => p.at && paths[p.key] === path)?.at ?? path;
};
const json = (file: RepoFile) => JSON.parse(file.text) as Record<string, unknown>;
const byLabel = (a: Option, b: Option) => byText(a.label, b.label);
// A page's or post's status (packages/editor/lib/status.mjs), for the filter of the sheet it is picked in (usePickTools).
const stateOf = (f: RepoFile): PageState => {
  const s = fm(f).status;
  return s === 'draft' || s === 'unlisted' || s === 'scheduled' ? s : 'published';
};
// The addresses the menu (config.menu) links to, at every level, without a part of a page (#…).
type MenuEntry = { href: string; children?: MenuEntry[] };
function menuAddresses(files: RepoFile[]): Set<string> {
  let entries: MenuEntry[] = [];
  try {
    entries = JSON.parse(files.find((f) => f.path === config.menu)?.text ?? '{}').items ?? [];
  } catch {}
  const all = (e: MenuEntry[]): string[] => e.flatMap((x) => [String(x.href ?? '').replace(/#.*/, ''), ...all(x.children ?? [])]);
  return new Set(all(entries));
}

// The choices for the fields that pick a page, a post, a category or a testimonial.
export function relationsOf(files: RepoFile[]): Record<Relation, Option[]> {
  const inFolder = (folder: string, ext: string) => files.filter((f) => f.path.startsWith(`${folder}/`) && f.path.endsWith(ext));
  // A standard page is in the menu by its own address or where it is shown (the front page at /, the blog page at /blog/).
  const menu = menuAddresses(files);
  const page = (f: RepoFile): Option => ({
    value: pagePath(f),
    label: String(fm(f).title),
    state: stateOf(f),
    inMenu: menu.has(pagePath(f)) || menu.has(shownAt(pagePath(f), files)),
  });
  return {
    // Pages are stored by their address: `path`, or /<file name>/ for pages made in the editor.
    pages: inFolder(config.folders.pages, '.md').map(page).sort(byLabel),
    // The pages that can be a standard page ("Settings" › "Appearance" › "Default pages"): those on the site, not a
    // draft, one waiting for its time or a new version of a page (/ny/).
    standardPages: inFolder(config.folders.pages, '.md')
      .filter((f) => !['draft', 'scheduled'].includes(String(fm(f).status ?? '')) && !pagePath(f).startsWith('/ny/'))
      .map(page)
      .sort(byLabel),
    // The front page (/) and the blog (/blog/), whichever pages they are, the blog by its page's title.
    fixed: [
      { value: '/', label: siteText('Front page'), inMenu: menu.has('/') },
      {
        value: '/blog/',
        label: String((standardFile(files, 'blog') && fm(standardFile(files, 'blog')!).title) || siteText('Blog')),
        inMenu: menu.has('/blog/'),
      },
    ],
    blog: inFolder(config.folders.blog, '.md')
      .map((f) => ({
        value: slugOf(f.path, config.folders.blog),
        label: String(fm(f).title),
        state: stateOf(f),
        date: String(fm(f).date ?? ''),
      }))
      .sort(byLabel),
    categories: inFolder('src/data/categories', '.json')
      .map((f) => ({ value: slugOf(f.path, 'src/data/categories'), label: String(json(f).name) }))
      .sort(byLabel),
    testimonials: inFolder('src/data/testimonials', '.json')
      .map((f) => ({ value: slugOf(f.path, 'src/data/testimonials'), label: String(json(f).name) }))
      .sort(byLabel),
    // The promotions turned on that a button can open ("Buttons": "Open promotion", opens.ts), by what opens with
    // the promotion's name ("Booking sheet (Calendly booking sheet)"), where they are shown (a button offers those on its
    // page) and the button's text: a pop-up's heading, or that of the target it stands for ("Book an appointment").
    promotions: inFolder('src/data/popups', '.json')
      .flatMap((f) => {
        const d = json(f);
        const opens = opensOf(d.type ? String(d.type) : undefined);
        if (!opens || d.enabled === false) return [];
        const name = String(d.heading ?? d.name ?? '');
        return [
          {
            value: slugOf(f.path, 'src/data/popups'),
            label: siteText('{hvad} ({navn})', { hvad: siteText(opens.label), navn: name }),
            on: { everywhere: d.where === 'all', pages: d.where !== 'tags' && Array.isArray(d.pages) ? d.pages.map(String) : [] },
            ...(opens.as ? { as: opens.as } : { text: String(d.heading ?? '') }),
          },
        ];
      })
      .sort(byLabel),
    // The PDFs in "Files", by their address on the site (/filer/<name>.pdf), named by their file name.
    files: inFolder(config.folders.files, '.pdf')
      .map((f) => ({ value: f.path.replace(/^public/, ''), label: f.path.split('/').pop()! }))
      .sort(byLabel),
  };
}

const frontPage = (files: RepoFile[]) => ({
  to: standardFile(files, 'front')?.path ?? config.standardPages,
  text: siteText('Edit the front page'),
});

// Where a button that opens a promotion is: a page (`path`), the shared buttons (on any page: neither), or an action bar
// (`bar`: the pages it is shown on, or none for every page or the posts with its tags).
type Opener = { file: string; title: string; path?: string; bar?: { pages?: string[] } };

// The buttons that open a promotion ("Buttons": "Open promotion", the button's `open`), where they are: the page with
// the block (its file, title and the address it is shown at: the front page's /), the shared buttons
// ("Standard blocks" › "Buttons", on any page: no address), or an action bar ("Promotion").
function openersOf(slug: string, files: { path: string; text: string }[]): Opener[] {
  const opens = (items: unknown) =>
    Array.isArray(items) &&
    items.some(
      (b) =>
        (b as Record<string, unknown>)?.type !== 'text' &&
        (b as Record<string, unknown>)?.to === 'promotion' &&
        (b as Record<string, unknown>).open === slug,
    );
  const found: Opener[] = [];
  for (const f of files) {
    if (f.path.startsWith(`${config.folders.pages}/`) && f.path.endsWith('.md')) {
      // Also a "Buttons" block in a block's text (a "Banner"'s), where its quotes are written as &quot;.
      if (!/data-block=(?:"|\\&quot;)buttons/.test(f.text)) continue;
      const d = fm(f as RepoFile);
      if (
        blocksIn(f.text, true).some((b: { type: string; props: Record<string, unknown> }) => b.type === 'buttons' && opens(b.props.items))
      )
        found.push({ file: f.path, title: String(d.title ?? ''), path: shownAt(pagePath(f as RepoFile), files) });
    } else if (f.path.startsWith('src/data/popups/') && f.path.endsWith('.json')) {
      const d = json(f as RepoFile);
      if (d.type === 'bookingbar' && d.enabled !== false && opens(d.buttons))
        found.push({
          file: f.path,
          title: siteText('Action bar'),
          bar: { pages: d.where === 'all' || d.where === 'tags' ? undefined : Array.isArray(d.pages) ? d.pages.map(String) : [] },
        });
    } else if (f.path === config.blockTexts) {
      if (opens((json(f as RepoFile).buttons as Record<string, unknown> | undefined)?.items))
        found.push({ file: 'blokke/buttons', title: siteText('Default buttons') });
    }
  }
  return found;
}

// Whether a promotion as it is (or is about to be saved) is shown where a button opens it: turned on, of a kind a button
// can open, and on every page, or on the button's page (the shared buttons are on any page), or on every page the
// action bar is on.
function shownFor(d: Record<string, unknown>, at: Opener) {
  if (d.enabled === false || !opensOf(d.type ? String(d.type) : undefined)) return false;
  if (d.where === 'all') return true;
  const pages = d.where !== 'tags' && Array.isArray(d.pages) ? d.pages.map(String) : [];
  if (at.bar) return !!at.bar.pages && at.bar.pages.every((p) => pages.includes(p));
  return !!at.path && pages.includes(at.path);
}

const openerText = (at: Opener) =>
  at.bar
    ? siteText(
        'A button in the action bar opens the promotion, so it must be turned on and shown everywhere the bar is shown. Change the button first.',
      )
    : at.path
      ? siteText('A button on the page "{side}" opens the promotion, so it must be on and shown there. Change the button first.', {
          side: at.title,
        })
      : siteText('The default buttons open the promotion, so it must be on and shown on every page. Change them first.');
const openerEdit = (at: Opener) => ({
  to: at.file,
  text: siteText(at.bar ? 'Edit the action bar' : at.path ? 'Edit the page' : 'Edit the default buttons'),
});

/** Why a promotion cannot be saved like this (turned off, or no longer shown on a page where a button opens it,
 * "Buttons": "Open promotion"), with a link to the button, or the standard pages (the same page twice, or a page
 * without the block it must have, with a link to it), or null. Before it is saved (DataForm.tsx; the standard pages in
 * CompanyForm.tsx, without a collection). */
export function keptBy(collection: Collection | null, path: string, data: Record<string, unknown>, files: RepoFile[]): Status {
  if (path === config.standardPages) return standardKept(data, files);
  if (collection?.kind !== 'folder' || collection.id !== 'popups') return null;
  const at = openersOf(slugOf(path, collection.folder), files).find((o) => !shownFor(data, o));
  return at ? { text: openerText(at), error: true, edit: openerEdit(at) } : null;
}

// The standard pages as they are about to be saved: different pages (the cookie policy may be the privacy policy), each
// with the block it must have.
function standardKept(data: Record<string, unknown>, files: RepoFile[]): Status {
  const chosen = standardPages.map((p) => ({ ...p, path: String(data[p.key] ?? '') })).filter((p) => p.path);
  if (!differentPages(Object.fromEntries(chosen.map((p) => [p.key, p.path]))))
    return { text: siteText('The default pages must be different pages.'), error: true };
  for (const p of chosen) {
    const page = files.find((f) => isPage(f) && pagePath(f) === p.path);
    if (!p.needs || !page || blocksIn(page.text).some((b: { type: string }) => b.type === p.needs!.type)) continue;
    return {
      text: siteText('The page "{side}" does not have the block {blok}, which {hvad} must have. Put it in on the page first.', {
        side: String(fm(page).title),
        blok: siteText(p.needs.label),
        hvad: siteText(p.the).toLowerCase(),
      }),
      error: true,
      edit: { to: page.path, text: siteText('Edit the page') },
    };
  }
  return null;
}

/** What is wrong on the site by its own rules, a line for each, before it is built (checkSite.ts): a standard page that
 * is not a page on the site, or the same page twice, and a button that opens a promotion that is gone, turned off or not
 * shown on its page. */
export function siteProblems(files: { path: string; text: string }[]): string[] {
  const problems: string[] = [];
  // The standard pages are pages on the site ("Settings" › "Appearance" › "Default pages"), different ones (but for
  // the cookie policy, which may be the privacy policy).
  if (files.some((f) => f.path === config.standardPages)) {
    for (const p of standardPages) {
      const page = standardFile(files as RepoFile[], p.key);
      if (!page || ['draft', 'scheduled'].includes(String(fm(page).status ?? '')))
        problems.push(`${config.standardPages}: ${siteText('{side} must be a published page.', { side: siteText(p.the) })}`);
    }
    if (!differentPages(standardOf(files)))
      problems.push(`${config.standardPages}: ${siteText('The default pages must be different pages.')}`);
  }
  const promotions = files.filter((f) => f.path.startsWith('src/data/popups/') && f.path.endsWith('.json'));
  const slugs = new Set<string>();
  for (const f of files) for (const m of f.text.matchAll(/(?:&quot;|")open(?:&quot;|"):\s*(?:&quot;|")([^"&]+)/g)) slugs.add(m[1]);
  for (const slug of slugs) {
    const file = promotions.find((f) => slugOf(f.path, 'src/data/popups') === slug);
    for (const at of openersOf(slug, files)) {
      if (file && shownFor(json(file as RepoFile), at)) continue;
      problems.push(
        `${at.file.startsWith('blokke/') ? config.blockTexts : at.file}: ${
          file ? openerText(at) : siteText('A button opens the promotion "{navn}", which does not exist.', { navn: slug })
        }`,
      );
    }
  }
  return problems;
}

// Where the tag uses are (tagUses.mjs): the blog and pages folders, the testimonials, the promotions and the
// file records.
const TAG_FOLDERS: TagFolders = {
  blog: config.folders.blog,
  pages: config.folders.pages,
  testimonials: 'src/data/testimonials',
  popups: 'src/data/popups',
  fileRecords: config.fileRecords,
};

// Why an entry cannot be deleted (something on the site uses it), with a link to where, or null.
export function usedBy(collection: Collection, file: RepoFile, files: RepoFile[]): Status {
  if (collection.kind === 'files') return null;
  const slug = slugOf(file.path, collection.folder);
  // A promotion a button opens ("Buttons": "Open promotion").
  if (collection.id === 'popups') {
    const [at] = openersOf(slug, files);
    if (at)
      return {
        text: at.bar
          ? siteText('A button in the action bar opens the promotion. Change the button first.')
          : at.path
            ? siteText('A button on the page "{side}" opens the promotion. Change the button first.', { side: at.title })
            : siteText('The default buttons open the promotion. Change them first.'),
        error: true,
        edit: openerEdit(at),
      };
  }
  const home = standardFile(files, 'front');
  const front = Object.fromEntries(
    (home ? (blocksIn(home.text) as { type: string; props: Record<string, unknown> }[]) : []).map((b) => [b.type, b.props]),
  );
  if (collection.id === 'kategorier') {
    const { posts, pages, testimonials: quotes, records } = taggedWith(files, slug, TAG_FOLDERS);
    if (posts.length)
      return {
        text:
          posts.length === 1
            ? siteText('The tag is used on a blog post. Remove it from the post first.')
            : siteText('The tag is used on {antal} blog posts. Remove it from them first.', { antal: posts.length }),
        error: true,
      };
    if (pages.length)
      return {
        text:
          pages.length === 1
            ? siteText('The tag is used on a page. Remove it from the page first.')
            : siteText('The tag is used on {antal} pages. Remove it from them first.', { antal: pages.length }),
        error: true,
        ...(pages.length === 1 ? { edit: { to: pages[0].path, text: siteText('Edit the page') } } : {}),
      };
    if (quotes.length)
      return {
        text:
          quotes.length === 1
            ? siteText('The tag is used on a testimonial. Remove it from the testimonial first.')
            : siteText('The tag is used on {antal} testimonials. Remove it from them first.', { antal: quotes.length }),
        error: true,
      };
    if (records.length)
      return {
        text:
          records.length === 1
            ? siteText('The tag is used on a file. Remove it from the file first.')
            : siteText('The tag is used on {antal} files. Remove it from them first.', { antal: records.length }),
        error: true,
        ...(records.length === 1 ? { edit: { to: recordUse(records[0], config.fileRecords)!.path, text: siteText('Open the file') } } : {}),
      };
    // A promotion shown on the posts with the tag (Promotion, "Blog posts with tags").
    const promotion = files.find(
      (f) => f.path.startsWith('src/data/popups/') && f.path.endsWith('.json') && promotionTags(json(f)).includes(slug),
    );
    if (promotion) {
      const d = json(promotion);
      return {
        text: siteText('The tag is used in the promotion "{navn}". Remove it from the promotion first.', {
          navn: String(d.heading ?? d.name ?? ''),
        }),
        error: true,
        edit: { to: promotion.path, text: siteText('Edit the promotion') },
      };
    }
    const fp = front.posts as Record<string, unknown> | undefined;
    if ((fp?.categories as string[] | undefined)?.includes(slug) || fp?.link === slug)
      return {
        text: siteText('The tag picks the posts on the front page under "From the blog". Pick another one first.'),
        error: true,
        edit: frontPage(files),
      };
  }
  if (collection.id === 'blog' && ((front.posts as Record<string, unknown>)?.picked as string[])?.includes(slug))
    return {
      text: siteText('The post is picked for the front page under "From the blog". Pick another one first.'),
      error: true,
      edit: frontPage(files),
    };
  // A "Blog posts" block in a page that picks the post (its props are in the text).
  if (collection.id === 'blog') {
    const page = files.find(
      (f) =>
        f.path.startsWith(`${config.folders.pages}/`) && f.text.includes('data-block="posts"') && f.text.includes(`&quot;${slug}&quot;`),
    );
    if (page)
      return {
        text: siteText('The post is picked in a block of blog posts on the page "{side}". Pick another one first.', {
          side: String(fm(page).title),
        }),
        error: true,
        edit: { to: page.path, text: siteText('Edit the page') },
      };
  }
  // Any other place under "Used on" (usesOf): a "Blog posts" or "Testimonials" block that picks the tag, on a
  // page or in a post. Files with the tag are handled above (records), so the first use is never a file record.
  if (collection.id === 'kategorier') {
    const use = usesOf(collection, files)(file)[0];
    if (use) {
      const post = use.path.startsWith(`${config.folders.blog}/`);
      return {
        text: siteText(
          post
            ? 'The tag is picked in a block in the blog post "{side}". Pick another one first.'
            : 'The tag is picked in a block on the page "{side}". Pick another one first.',
          { side: use.name },
        ),
        error: true,
        edit: { to: use.path, text: siteText(post ? 'Edit the post' : 'Edit the page') },
      };
    }
  }
  return null;
}

// What a file that uses something is called: a page's or post's title, a setting's name, an entry's
// as its list shows it.
function nameOf(file: RepoFile): string {
  for (const c of collections)
    if (c.kind === 'files') {
      const own = c.files.find((f) => f.file === file.path);
      if (own) return fixedName({ ...own, label: siteText(own.label) }, file.text);
    } else if (c.kind === 'folder' && file.path.startsWith(`${c.folder}/`) && file.path.endsWith('.json'))
      return c.summary(json(file)) || siteText(c.label);
  return String(fm(file).title ?? file.path);
}

export type Use = { path: string; name: string };

// The places on the site that use an entry, by the entry's file, each once (the tag's "Used on", DataForm.tsx,
// and the number at it in its list, Library.tsx); [] for none. For a tag: the blog posts, pages, testimonials,
// promotions and files (by the route "filer/<path>" and the file's name) that have it, and the pages and posts with a "Blog posts" or "Testimonials" block that
// picks it (its tags, or the tag "All posts" goes to). Made once for the whole list.
export function usesOf(collection: Collection, files: RepoFile[]): (file: RepoFile) => Use[] {
  if (collection.kind === 'files' || collection.id !== 'kategorier') return () => [];
  const uses = tagUses(files, TAG_FOLDERS);
  return (file) =>
    [...(uses.get(slugOf(file.path, collection.folder))?.values() ?? [])]
      .map((f) => recordUse(f, config.fileRecords) ?? { path: f.path, name: nameOf(f) })
      .sort((a, b) => byText(a.name, b.name));
}

// The number at the right of an entry in the list of a part, by the entry's file, or null for none
// (Library.tsx): at each tag, the number of places that use it (usesOf).
export function countsOf(collection: Collection, files: RepoFile[]): (file: RepoFile) => number | null {
  if (collection.kind === 'files' || collection.id !== 'kategorier') return () => null;
  const uses = tagUses(files, TAG_FOLDERS);
  return (file) => uses.get(slugOf(file.path, collection.folder))?.size ?? 0;
}

// The testimonials, in their order on the site, for the cards and previews of the blocks.
export const testimonialsOf = (files: RepoFile[]) =>
  files
    .filter((f) => f.path.startsWith('src/data/testimonials/') && f.path.endsWith('.json'))
    .map((f) => ({ ...(json(f) as TestimonialRow & { order?: number }), slug: slugOf(f.path, 'src/data/testimonials') }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** What is at an address, as said in a message: 'the front page', 'the page "About me" (/about-me/)',
 * or the address (where a redirect sends to, App.tsx). */
export function whatIsAt(address: string, relations: Record<Relation, Option[]>): string {
  const base = address.split('#')[0];
  if (base === '/') return siteText('the front page');
  if (base === '/blog/') return siteText('the blog');
  const page = [...relations.fixed, ...relations.pages].find((o) => o.value === base);
  if (page) return siteText('the page "{navn}" ({adresse})', { navn: page.label, adresse: address });
  const post = relations.blog.find((o) => `/${o.value}/` === base);
  if (post) return siteText('the blog post "{navn}" ({adresse})', { navn: post.label, adresse: address });
  const tag = relations.categories.find((o) => `/blog/kategori/${o.value}/` === base);
  if (tag) return siteText('the tag "{navn}" on the blog ({adresse})', { navn: tag.label, adresse: address });
  if (base.startsWith(config.folders.media.replace(/^public/, '') + '/'))
    return siteText('the picture {navn}', { navn: base.split('/').pop()! });
  return address;
}
