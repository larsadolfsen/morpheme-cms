// What on the site uses each tag: posts and pages by their front matter, testimonials, promotions on tagged posts,
// file records (tags on files in Files), and the "Blog posts"/"Testimonials" blocks that pick a tag. Pure (no @site imports),
// so node --test can run it; defaults/rules.ts uses it for usedBy, usesOf and countsOf.
import { blocksIn } from '../lib/blocks.mjs';
import { isRecordPath, parseRecord } from './fileRecords.mjs';
import { readFields, splitFrontmatter } from './frontmatter.mjs';

/**
 * @typedef {{ path: string; text: string }} TagFile
 * @typedef {{ blog: string; pages: string; testimonials: string; popups: string; fileRecords?: string }} TagFolders
 */

/** The front matter fields of a file; a broken one gives no fields (never throws). @param {TagFile} f */
const frontmatterOf = (f) => {
  try {
    return readFields(splitFrontmatter(f.text).yaml) ?? {};
  } catch {
    return {};
  }
};

/** The JSON of a file; a broken one gives no fields (never throws). @param {TagFile} f */
const jsonOf = (f) => {
  try {
    return JSON.parse(f.text) ?? {};
  } catch {
    return {};
  }
};

/** @param {string} path @param {string} folder @param {string} ext */
const inFolder = (path, folder, ext) => path.startsWith(`${folder}/`) && path.endsWith(ext);

/** The record of a file record, or null when the file is not one.
 * @param {TagFile} f @param {TagFolders} folders */
const recordOf = (f, folders) =>
  folders.fileRecords !== undefined && isRecordPath(f.path, folders.fileRecords) ? parseRecord(f.text) : null;

/** The tags a promotion is shown on the posts of (Promotion, "Shown on": "Blog posts with tags").
 * @param {Record<string, unknown>} d
 * @returns {string[]} */
export function promotionTags(d) {
  return d.where === 'tags' && Array.isArray(d.tags) ? d.tags.map(String) : [];
}

/** The tags a block picks: a "Blog posts" or "Testimonials" block's categories, and its link.
 * @param {string} type
 * @param {Record<string, any>} props
 * @returns {unknown[]} */
const blockTags = (type, props) => {
  if (type !== 'posts' && type !== 'testimonials') return [];
  return [...(Array.isArray(props?.categories) ? props.categories : []), ...(props?.link ? [props.link] : [])];
};

/**
 * The files that use each tag, keyed by path, each file once.
 * @template {TagFile} F
 * @param {F[]} files
 * @param {TagFolders} folders
 * @returns {Map<string, Map<string, F>>}
 */
export function tagUses(files, folders) {
  /** @type {Map<string, Map<string, F>>} */
  const uses = new Map();
  /** @param {F} f @param {unknown} slugs */
  const add = (f, slugs) => {
    for (const slug of Array.isArray(slugs) ? slugs.map(String) : []) {
      const byPath = uses.get(slug) ?? new Map();
      byPath.set(f.path, f);
      uses.set(slug, byPath);
    }
  };
  for (const f of files) {
    if (inFolder(f.path, folders.blog, '.md') || inFolder(f.path, folders.pages, '.md')) {
      add(f, frontmatterOf(f).categories);
      for (const b of blocksIn(f.text)) add(f, blockTags(b.type, b.props));
    } else if (inFolder(f.path, folders.testimonials, '.json')) {
      add(f, jsonOf(f).categories);
    } else if (inFolder(f.path, folders.popups, '.json')) {
      add(f, promotionTags(jsonOf(f)));
    } else {
      const record = recordOf(f, folders);
      if (record) add(f, record.categories);
    }
  }
  return uses;
}

/**
 * A file record's use of a tag: the Files address the file record is for, as a path under files/.
 * @param {TagFile} file
 * @param {string} folder the file records folder
 * @returns {{ path: string; name: string } | null}
 */
export function recordUse(file, folder) {
  const record = folder !== undefined && isRecordPath(file.path, folder) ? parseRecord(file.text) : null;
  if (!record) return null;
  return { path: `files${record.src}`, name: record.src.slice(record.src.lastIndexOf('/') + 1) };
}

/**
 * The files that have a tag by their own categories: posts, pages and testimonials (not blocks).
 * @template {TagFile} F
 * @param {F[]} files
 * @param {string} slug
 * @param {TagFolders} folders
 * @returns {{ posts: F[]; pages: F[]; testimonials: F[]; records: F[] }}
 */
export function taggedWith(files, slug, folders) {
  /** @param {unknown} categories */
  const has = (categories) => Array.isArray(categories) && categories.map(String).includes(slug);
  return {
    posts: files.filter((f) => inFolder(f.path, folders.blog, '.md') && has(frontmatterOf(f).categories)),
    pages: files.filter((f) => inFolder(f.path, folders.pages, '.md') && has(frontmatterOf(f).categories)),
    testimonials: files.filter((f) => inFolder(f.path, folders.testimonials, '.json') && has(jsonOf(f).categories)),
    records: files.filter((f) => {
      const record = recordOf(f, folders);
      return record !== null && has(record.categories);
    }),
  };
}
