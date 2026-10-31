// The sections of a fixed page (packages/editor/site/sections.ts) as one text in the editor (Milkdown, like the
// pages), and back. A section of text ("text": a heading and Markdown) is written as text: its heading
// as an "Overskrift" (H2), then its text. Every other section is a block in the text, a card with the
// fields that are not text (blocks.ts), as is a text section that is hidden. Back from the editor,
// each heading starts a section of text, and text before the first heading after a block is a
// section without a heading.
//
// What of a section is only text and pictures is written as text above its card (its `lead`,
// collections.ts): a picture, its heading (H2) and its text; back from the editor, the last heading
// before the card and the text after it, and a picture just before that heading, are the section's.
// The front page's top (a "Banner", type "hero") is text too: its text (`text`, Markdown) up to its "Knapper" block
// (the lead's `upTo`), with its heading, subtitle, introduction and picture, is the text at the very top, before its
// card; the block and the text after it stay in the card's `text`, with the quote. On the other pages the text at the
// very top, before the first heading or card, is the page's introduction.
// The front page is an ordinary page (packages/editor/defaults/standardPages.ts): its text is read into sections the same way, by the editor
// and by the site (partsOfMarkdown, packages/editor/site/home.ts).
// Shared by the editor and packages/editor/scripts/editor-roundtrip.mjs, which checks that every page comes back the same.
import { blockHtml, cutAtBlock, parseBlock } from '../lib/blocks.mjs';
import { decorated, decorativeOf } from '../lib/crop.mjs';
import { coloredHtml, withoutColors } from '../lib/text-colors.mjs';

// Text that is plain in the file (a heading, a picture's description); in Markdown every sign that
// could mean something is escaped, and back from Markdown the escapes go again. The page's
// introduction and the text a section takes as its own are Markdown in the file too (bold, italic and
// links, shown so on the site: packages/editor/lib/inline.ts), and are kept as they are.
const escape = (s) =>
  String(s)
    .replace(/[\\`*_[\]<>#&!~|]/g, '\\$&')
    .replace(/^(\s*)([-+]|\d+(?=\.))/gm, '$1\\$2');
const unescape = (s) => s.replace(/\\([!-/:-@[-`{-~])/g, '$1');

const PICTURE = /!\[((?:\\.|[^\]])*)\]\(([^)\s]+)\)/;
// A section's picture (`image`, `imageAlt`, and `imageDecorative`: "Dekorativt billede", marked in its address as a
// picture in the text is, crop.mjs) as a picture in the text, and back.
const picture = (image, alt, decorative) => `![${String(alt ?? '').replace(/[[\]]/g, '\\$&')}](${decorated(image, decorative === true)})`;
const pictureOf = (m) => {
  const { address, decorative } = decorativeOf(m[2]);
  return { image: address, imageAlt: unescape(m[1]), ...(decorative ? { imageDecorative: true } : {}) };
};

/** The text of the editor for a list of sections; leads: the lead of each type of section; intro: the
 * page's introduction, above the sections. */
export function sectionsToMarkdown(sections, leads = {}, intro) {
  // The page's top: a "Banner" before any other card, with its lead (as sectionsFromParts reads it back).
  const top = leads.hero ? sections.findIndex((s) => s.type !== 'text' || s.hidden) : -1;
  const text = sections
    .map(({ type, ...props }, i) => {
      if (type === 'text' && !props.hidden)
        return [props.heading && `## ${escape(props.heading)}`, props.body].filter(Boolean).join('\n\n');
      if (type === 'hero' && i === top) {
        const { text, ...rest } = props;
        const [lead, own] = leads.hero.upTo ? cutAtBlock(text, leads.hero.upTo) : [String(text ?? '').trim(), ''];
        return [lead, blockHtml(type, own ? { ...rest, text: own } : rest)].filter(Boolean).join('\n\n');
      }
      // A "Banner" further down is a card with all of its fields.
      const lead = type === 'hero' ? undefined : leads[type];
      if (!lead) return blockHtml(type, props);
      const rest = { ...props };
      const take = (name) => {
        const v = rest[name];
        delete rest[name];
        return v;
      };
      const image = lead.image ? take('image') : undefined;
      const imageAlt = lead.image ? take('imageAlt') : undefined;
      const imageDecorative = lead.image ? take('imageDecorative') : undefined;
      const heading = lead.heading ? take(lead.heading) : undefined;
      const body = lead.body ? take(lead.body) : undefined;
      const paragraphs = Array.isArray(body) ? body : body ? String(body).split(/\n\s*\n/) : [];
      return [image && picture(image, imageAlt, imageDecorative), heading && `## ${escape(heading)}`, ...paragraphs, blockHtml(type, rest)]
        .filter(Boolean)
        .join('\n\n');
    })
    .join('\n\n');
  return [intro && String(intro), text].filter(Boolean).join('\n\n');
}

/** The page's introduction (the text before the first heading or card) and the parts after it. */
export function introOf(parts) {
  if (!parts[0]?.markdown) return ['', parts];
  const paragraphs = parts[0].markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return [paragraphs.join('\n\n'), parts.slice(1)];
}

// The front page's top from the text before its card: that text, its heading and its picture in it (heroParts in
// standard/hero/fields.ts finds them), then the card's own text (its "Knapper" block and the text after it).
function hero(lead, props) {
  const markdown = lead.map((p) => ('heading' in p ? `## ${p.heading}` : p.markdown)).join('\n\n');
  const section = { type: 'hero', text: '', ...props };
  section.text = [markdown, props.text].filter(Boolean).join('\n\n');
  return section;
}

// A section with a lead from the text before its card (`run`): what is left of the run first, as
// sections of text, then the section with its picture, heading and text.
function withLead(run, block, lead) {
  let rest = [...run];
  let heading;
  let body = '';
  if (lead.heading) {
    const at = rest.findLastIndex((p) => 'heading' in p);
    // A section with only a heading has no place for text: with text after it, the heading and the
    // text stay a section of text (as they look in the editor), and the section has no heading.
    if (at >= 0 && (lead.body || at === rest.length - 1)) {
      heading = rest[at].heading;
      body = rest
        .slice(at + 1)
        .map((p) => p.markdown)
        .join('\n\n');
      rest = rest.slice(0, at);
    }
  } else if (lead.body && rest.length && !('heading' in rest[rest.length - 1])) {
    body = rest.pop().markdown;
  }
  // The picture: at the end of the text just before the heading (or the card).
  let image;
  const last = rest[rest.length - 1];
  if (lead.image && last?.markdown) {
    const m = last.markdown.match(new RegExp(`${PICTURE.source}\\s*$`));
    if (m) {
      image = pictureOf(m);
      const before = last.markdown.slice(0, m.index).trim();
      rest = before ? [...rest.slice(0, -1), { markdown: before }] : rest.slice(0, -1);
    }
  }
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const own = {
    ...image,
    ...(lead.heading ? { [lead.heading]: heading ?? '' } : {}),
    ...(lead.body && paragraphs.length ? { [lead.body]: lead.list ? paragraphs : paragraphs.join('\n\n') } : {}),
  };
  return [...textSections(rest), { type: block.type, ...own, ...block.props }];
}

/** The sections for the parts of the text (partsOf in markdown.mjs); leads as for sectionsToMarkdown. */
export function sectionsFromParts(parts, leads = {}) {
  const first = parts.findIndex((p) => p.block);
  if (first >= 0 && parts[first].block.type === 'hero' && leads.hero)
    return [hero(parts.slice(0, first), parts[first].block.props), ...sectionsFromParts(parts.slice(first + 1), leads)];
  const sections = [];
  // The text since the last card, for the next card (its lead) or as sections of text.
  let run = [];
  for (const part of parts) {
    if (!part.block) {
      run.push(part);
      continue;
    }
    // A "Hero" further down is a card with all of its fields (only the top's are written above it).
    const lead = part.block.type === 'hero' ? undefined : leads[part.block.type];
    if (lead) sections.push(...withLead(run, part.block, lead));
    else sections.push(...textSections(run), { type: part.block.type, ...part.block.props });
    run = [];
  }
  return [...sections, ...textSections(run)];
}

// Sections of text from text: each heading starts one, and text before the first heading is one
// without a heading. An empty heading with no text after it is nothing.
function textSections(parts) {
  const sections = [];
  let text = null;
  for (const part of parts) {
    if ('heading' in part) {
      text = part.heading ? { type: 'text', heading: part.heading, body: '' } : { type: 'text', body: '' };
      sections.push(text);
    } else if (text) {
      text.body = part.markdown;
      text = null;
    } else sections.push({ type: 'text', body: part.markdown });
  }
  return sections.filter((s) => s.heading || s.body);
}

/** The leads of the types of sections in a list of blocks (collections.ts). */
export const leadsOf = (blocks) => Object.fromEntries(blocks.filter((b) => b.lead).map((b) => [b.type, b.lead]));

/** The leads of a field with sections: those of the blocks a page can have on it (its `leads`), and its own blocks'. */
export const leadsOfField = (field) => ({ ...(field?.leads ?? {}), ...leadsOf(field?.blocks ?? []) });

// How the text of a fixed page looks on the site, part by part, so the editor shows it so too
// (editor.css): the headings of the sections as their components draw them, the text under a
// heading that belongs to a section (its lead) as that section's text, the front page's top as its
// subtitle and introduction, and a page's introduction. The looks of each fixed page's sections are
// the site's (`sectionLooks` and `headingLooks`, LOOKS and HEADINGS in a theme's editor/looks.mjs).
/** The look of each part of the text (null: as text), from its parts in order: { kind: 'block', type }
 * for a card, 'heading' (H2), 'p' (with image: a picture), 'gap' (a free line) or 'other'. The text a
 * section takes as its own is found as in sectionsFromParts. A text after the first is marked "rest". */
export function looksOf(items, { file, leads = {}, intro = false, sectionLooks = {}, headingLooks = {} }) {
  const looks = items.map(() => null);
  const isText = (i) => items[i].kind === 'p' && !items[i].image;
  const heading = headingLooks[file] ?? 'page-section';
  let start = 0;
  const first = items.findIndex((x) => x.kind === 'block');
  if (first >= 0 && items[first].type === 'hero' && leads.hero) {
    let n = 0;
    for (let i = 0; i < first; i++) if (isText(i)) looks[i] = n++ === 0 ? 'hero-subtitle' : 'hero-intro';
    start = first + 1;
  } else if (intro) {
    for (let i = 0; i < items.length && items[i].kind !== 'heading' && items[i].kind !== 'block'; i++)
      if (isText(i)) looks[i] = 'page-intro';
  }
  let run = start;
  for (let i = start; i <= items.length; i++) {
    const block = i < items.length && items[i].kind === 'block' ? items[i] : null;
    if (i < items.length && !block) continue;
    const look = block && sectionLooks[`${file}:${block.type}`];
    let own = -1;
    if (block && leads[block.type]?.heading) for (let k = i - 1; k >= run && own < 0; k--) if (items[k].kind === 'heading') own = k;
    // As in withLead: a section with only a heading does not take one with text after it.
    if (own >= 0 && !leads[block.type].body && items.slice(own + 1, i).some((x) => x.kind !== 'gap')) own = -1;
    for (let k = run; k < i; k++) if (items[k].kind === 'heading') looks[k] = k === own ? (look?.heading ?? heading) : heading;
    if (own >= 0 && look?.body) {
      let n = 0;
      for (let k = own + 1; k < i; k++) if (isText(k)) looks[k] = n++ === 0 ? look.body : `${look.body} rest`;
    }
    run = i + 1;
  }
  return looks;
}

// A heading as the editor reads it (its text): without escapes, links as their text, without bold, italic, code and
// colours (packages/editor/lib/text-colors.mjs).
export const plainHeading = (s) =>
  unescape(
    withoutColors(s)
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/(\*\*|__|\*|_|`)(.+?)\1/g, '$2')
      .trim(),
  );

// A heading of a level (1: "# …", the page's H1; 2: "## …", a section's) on a line of Markdown: its text, as written.
const atx = (level) => new RegExp(`^ {0,3}#{${level}}(?!#)(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$`);
const h1Line = atx(1);

/** A page's H1: the heading "# …" on the first line of its text that is not empty (the page's own heading, written
 * at the top of its text), as text, and the text without it. Without one: no heading, and the text as it is. With a
 * word or more in colour, `html` is the heading as HTML with its colours (coloredHtml), for the layout to draw. */
export function pageH1(markdown) {
  const text = String(markdown ?? '');
  const match = text.match(/^(?:[ \t]*\r?\n)*([^\r\n]*)(?:\r?\n|$)/);
  const line = match?.[1] ?? '';
  const h1 = line.match(h1Line);
  if (!h1) return { heading: undefined, rest: text };
  const heading = plainHeading(h1[1] ?? '') || undefined;
  return {
    heading,
    html: heading && coloredHtml(h1[1] ?? '', plainHeading),
    rest: text.slice(match[0].length).replace(/^(?:[ \t]*\r?\n)+/, ''),
  };
}

/** The parts of a page's Markdown as the editor reads them (partsOf in markdown.mjs), without the editor: each block,
 * each heading at the top level (H2), and the Markdown between them; for the site, which reads the front page into
 * sections (packages/editor/site/home.ts). The page's H1 ("# …") is no section's and is left out. `npm run check:editor` checks
 * that it gives the editor's sections for every page. */
export function partsOfMarkdown(markdown) {
  const parts = [];
  let run = [];
  let fence = null;
  const flush = () => {
    const text = run.join('\n').trim();
    if (text) parts.push({ markdown: text });
    run = [];
  };
  for (const line of String(markdown).split(/\r?\n/)) {
    const mark = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (fence) {
      if (mark && mark[0] === fence[0] && mark.length >= fence.length) fence = null;
      run.push(line);
      continue;
    }
    if (mark) {
      fence = mark;
      run.push(line);
      continue;
    }
    const block = parseBlock(line);
    if (block) {
      flush();
      parts.push({ block });
      continue;
    }
    if (h1Line.test(line)) {
      flush();
      continue;
    }
    const heading = line.match(atx(2));
    if (heading) {
      flush();
      parts.push({ heading: plainHeading(heading[1] ?? '') });
      continue;
    }
    run.push(line);
  }
  flush();
  return parts;
}
