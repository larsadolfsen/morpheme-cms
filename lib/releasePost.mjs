// A released version of the CMS as a blog post on a site (its setting `releasePosts`, site/defineSite.mjs; posted by the
// Worker, worker/release-post.js): the version's release notes in the site's language, each paragraph a heading with its text
// and screenshot, the lines under "Also in this version", and the edition's photo as the post's picture. Pure: what it
// needs is read from the version's npm tar (releaseFromTar). Exposes releaseFromTar, postPath and releasePost. Depends on
// ./changelog.mjs and ./releaseNotes.mjs; no node: imports (runs in a Cloudflare Worker and in Node 18+).
import { bytesFromTar, fileFromTar } from './changelog.mjs';
import { isParagraph, minorOf, notesFor, notesFromTar } from './releaseNotes.mjs';

/** @typedef {import('./releaseNotes.mjs').ReleaseNote} ReleaseNote */
/** @typedef {{ line: string, name: string, place: string, by: string | null, source: string | null, bytes: Uint8Array }} PostEdition  the edition of the version's minor line, its place in the site's language */
/** @typedef {{ notes: ReleaseNote[], images: Record<string, Uint8Array>, edition?: PostEdition }} Release  images: each paragraph's screenshot by its id */
/**
 * The texts of a post, in the site's language (src/i18n/<locale>/cms.ts).
 * @typedef {object} PostTexts
 * @property {string} title the post's title ("New in Morpheme Braies 0.14.2")
 * @property {string} also the heading over the lines ("Also in this version")
 * @property {(place: string, by: string, unsplash: string) => string} photo the credit of the edition's photo, `unsplash` a link
 */
/** @typedef {{ blog: string, media: string }} PostFolders  the site's folders of blog posts and pictures (config.folders) */
/** @typedef {{ path: string, text?: string, bytes?: Uint8Array }} PostFile */

const PLAIN = /^\d+\.\d+\.\d+$/;
const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const filled = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * The release of `version` in the site's language from the version's unzipped npm tar: its notes (notesFor: the locale's, else
 * en-US), the screenshots of its paragraphs and the edition of its minor line (release-notes/editions/<line>.json and .webp).
 * @param {Uint8Array} tar
 * @param {string} version a released version (x.y.z)
 * @param {string} locale the site's language
 * @returns {Release | undefined} undefined when it is not a released version or has no notes
 */
export function releaseFromTar(tar, version, locale) {
  if (!PLAIN.test(version)) return undefined;
  const kept = notesFromTar(tar, version);
  const notes = notesFor(kept?.notes, locale);
  if (!notes?.length) return undefined;
  const used = kept.notes[locale] ? locale : 'en-US';
  const images = Object.fromEntries(kept.images.filter((image) => image.locale === used).map((image) => [image.id, image.bytes]));
  return { notes, images, edition: editionFromTar(tar, version, locale) };
}

/** The edition of the version's minor line, or undefined when the tar has none, or it has no name or no photo. */
function editionFromTar(tar, version, locale) {
  const line = minorOf(version);
  const text = fileFromTar(tar, `package/release-notes/editions/${line}.json`);
  const bytes = bytesFromTar(tar, `package/release-notes/editions/${line}.webp`);
  if (text === null || bytes === null) return undefined;
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!filled(file?.name)) return undefined;
  const place = file.place?.[locale] ?? file.place?.['en-US'] ?? file.name;
  return { line, name: file.name.trim(), place, by: file.photo?.by ?? null, source: file.photo?.source ?? null, bytes };
}

/**
 * Where the post of `version` is saved: its file name is its address (0.14.2 → morpheme-0-14-2.md, /morpheme-0-14-2/).
 * @param {string} version
 * @param {string} blog the site's folder of blog posts
 */
export const postPath = (version, blog) => `${blog}/morpheme-${slug(version)}.md`;

/** A text in double quotes, as the editor writes front matter (src/frontmatter.mjs: doubleQuotedAsJSON). */
const quoted = (text) => JSON.stringify(String(text));

/** A text on one line, without what would end a Markdown heading, image or list item early. */
const oneLine = (text) => String(text).replace(/\s+/g, ' ').trim();

/**
 * The post of a released version, and its pictures, for one commit: the post in the site's folder of blog posts, the
 * pictures in its folder of pictures under <year>/<month>/ of the day (as the editor puts a picture added that day).
 * Front matter as the editor writes it (title, date, description, categories, image, imageAlt), so a save in the editor
 * leaves it as it is.
 * @param {{ version: string, date: string, release: Release, texts: PostTexts, folders: PostFolders, categories?: string[] }} input
 *   date: the day it is released (YYYY-MM-DD); categories: the post's tags (their ids)
 * @returns {{ path: string, files: PostFile[] }} the post's path and the files: the post first, then its pictures
 */
export function releasePost({ version, date, release, texts, folders, categories = [] }) {
  const [year, month] = date.split('-');
  const media = `${folders.media}/${year}/${month}`;
  // The address of a picture on the site: its path without public/.
  const urlOf = (path) => `/${path.replace(/^public\//, '')}`;
  const pictures = [];
  const picture = (name, bytes) => {
    const path = `${media}/${name}.webp`;
    pictures.push({ path, bytes });
    return urlOf(path);
  };

  const paragraphs = release.notes.filter(isParagraph);
  const lines = release.notes.filter((note) => note.kind === 'line');
  const body = [];
  for (const paragraph of paragraphs) {
    body.push(`## ${oneLine(paragraph.title)}`, oneLine(paragraph.text));
    const bytes = release.images[paragraph.id];
    if (bytes)
      body.push(
        `![${oneLine(paragraph.title).replace(/[[\]]/g, '')}](${picture(`morpheme-${slug(version)}-${slug(paragraph.id)}`, bytes)})`,
      );
  }
  if (lines.length > 0) body.push(`## ${texts.also}`, lines.map((line) => `- ${oneLine(line.text)}`).join('\n'));

  const edition = release.edition;
  const cover = edition && picture(`morpheme-${slug(edition.line)}-${slug(edition.name)}`, edition.bytes);
  if (edition?.by && edition.source) body.push(texts.photo(edition.place, edition.by, `[Unsplash](${edition.source})`));

  // The description: the paragraphs' titles, else the first line, each a sentence.
  const sentence = (text) => (/[.?]$/.test(oneLine(text)) ? oneLine(text) : `${oneLine(text)}.`);
  const description = (paragraphs.length > 0 ? paragraphs.map((paragraph) => paragraph.title) : lines.slice(0, 1).map((line) => line.text))
    .map(sentence)
    .join(' ');

  const front = [
    `title: ${quoted(texts.title)}`,
    `date: ${date}`,
    ...(description ? [`description: ${quoted(description)}`] : []),
    ...(categories.length > 0 ? [`categories: [${categories.map(quoted).join(', ')}]`] : []),
    ...(cover ? [`image: ${quoted(cover)}`, `imageAlt: ${quoted(edition.place)}`] : []),
  ];
  const path = postPath(version, folders.blog);
  const text = `---\n${front.join('\n')}\n---\n\n${body.join('\n\n')}\n`;
  return { path, files: [{ path, text }, ...pictures] };
}
