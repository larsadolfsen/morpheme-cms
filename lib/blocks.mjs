// Blocks the site's owner puts in the text of a page in the editor (/editor/, the Milkdown plugin in
// packages/editor/src/markdown.mjs). Each is a folder in src/apps/<app>/blocks/, named by its type. In the Markdown each is
// one line of HTML that nothing else writes, e.g.
//   <div data-block="testimonials" data-props="{&quot;heading&quot;:&quot;Det siger kunderne&quot;}"></div>
// so the rest of the text, and every page without blocks, is rendered as before. On the site
// packages/editor/theme/components/RichText.astro shows the block's own component in its place.
import { carouselOf } from './migrate-carousel.mjs';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) =>
  s
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;|&#60;|&#x3c;/gi, '<')
    .replace(/&gt;|&#62;|&#x3e;/gi, '>')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&amp;|&#38;|&#x26;/gi, '&');

/** The line of HTML for a block. */
export function blockHtml(type, props = {}) {
  const json = JSON.stringify(props);
  const name = escape(String(type));
  return json === '{}' ? `<div data-block="${name}"></div>` : `<div data-block="${name}" data-props="${escape(json)}"></div>`;
}

// A block as written by blockHtml, or as the site's HTML pipeline writes it again.
const BLOCK = /<div data-block="([a-z]+)"(?: data-props="([^"]*)")?\s*><\/div>/;

// The old forms of "Cards" read as the current one (FORMER.cards, below, says which).
const oldCards = (raw) => {
  const { design, background, kind, color, media: blockMedia, items, ...props } = raw;
  const list = Array.isArray(items) ? items : null;
  const card = (c) => c && typeof c === 'object';
  const oldDesign = design === 'text' || design === 'icon' || design === 'image';
  const perCard = !!list?.some((c) => card(c) && 'media' in c);
  const both = !!list?.some((c) => card(c) && c.href && Array.isArray(c.buttons) && c.buttons.length > 0);
  if (!oldDesign && !perCard && !both && background === undefined && kind === undefined) return { type: 'cards', props: raw };
  // The block's media: the old design, else the first card that has one, else what the block says, else an icon.
  const media = oldDesign
    ? design === 'text'
      ? 'none'
      : design
    : perCard
      ? (list.find((c) => card(c) && 'media' in c).media ?? 'icon')
      : (blockMedia ?? 'icon');
  const colored = background === 'accent' ? { design: 'filled', color: 'primary' } : {};
  const type = kind === 'filled' || kind === 'elevated' ? kind : !oldDesign && (design === 'filled' || design === 'elevated') ? design : '';
  return {
    type: 'cards',
    props: {
      ...props,
      ...(type ? { design: type } : {}),
      ...(color && (type === 'filled' || colored.design) ? { color } : {}),
      ...colored,
      ...(media !== 'icon' ? { media } : {}),
      ...(list
        ? {
            items: list.map((c) => {
              if (!card(c)) return c;
              const { media: _, icon, image, video, buttons, ...rest } = c;
              return {
                ...rest,
                ...(media === 'icon' && icon ? { icon } : {}),
                ...(media === 'image' && image ? { image } : {}),
                ...(media === 'video' && video ? { video } : {}),
                ...(!c.href && Array.isArray(buttons) && buttons.length ? { buttons } : {}),
              };
            }),
          }
        : {}),
    },
  };
};

// Blocks that have become another block, by their old type: the block they are read as (its type and props), so a
// text from before keeps working on the site and in the editor, which writes the new block when the page is saved.
const FORMER = {
  // "Blog" became "Blog posts" with all the posts (with any of its tags), the newest large.
  blog: (props) => ({ type: 'posts', props: { ...props, show: 'all', design: 'featured' } }),
  // "Links" is a "List": each group's title is a row (a link when the group has a page) and each of its pages a row, which shows the
  // page's title. The groups' boxes side by side are gone: one list.
  links: ({ groups, ...props }) =>
    Array.isArray(groups)
      ? {
          type: 'list',
          props: {
            ...props,
            items: groups.flatMap((g) => [
              { title: g?.title ?? '', ...(g?.href ? { href: g.href } : {}) },
              ...(Array.isArray(g?.paths) ? g.paths : []).map((href) => ({ href })),
            ]),
          },
        }
      : { type: 'list', props },
  // "Points with icon" is a "List": each point's icon, heading, text and page are a row's. The text of the link after a point's text (`more`) is gone:
  // the whole row is the link, with an arrow.
  points: ({ items, ...props }) =>
    Array.isArray(items) ? { type: 'list', props: { ...props, items: items.map(({ more, ...row }) => row) } } : { type: 'list', props },
  // A "Segmented list" is a "List" with the design `segmented` (each row on its own surface) when its rows were always open (`show` 'all'), else a
  // "List - Expand" (the rows that fold out) with the design `segmented`, which is how it was drawn. `show` is gone. A row's text buttons were never
  // drawn in a list that is always open, so a List has none (its rows are one link each).
  segmented: ({ show, only, items, ...props }) =>
    show === 'all'
      ? {
          type: 'list',
          props: {
            ...props,
            design: 'segmented',
            ...(Array.isArray(items)
              ? {
                  items: items.map((row) =>
                    row && typeof row === 'object' && 'buttons' in row ? (({ buttons, ...rest }) => rest)(row) : row,
                  ),
                }
              : {}),
          },
        }
      : {
          type: 'expand',
          props: { ...props, design: 'segmented', ...(only === undefined ? {} : { only }), ...(items === undefined ? {} : { items }) },
        },
  // An "Accordion" is a "List - Expand" with the design `segmented`: each row's heading, text and page (the closing link of a row is the page's link; a row
  // with no text shows the opening of its page). The links to more pages in a row (`more`) are the row's text buttons at the bottom (`buttons`).
  accordion: ({ items, ...props }) =>
    Array.isArray(items)
      ? {
          type: 'expand',
          props: {
            ...props,
            design: 'segmented',
            items: items.map(({ label, href, text, more }) => ({
              title: label,
              ...(text?.trim() ? { text } : {}),
              ...(href ? { href } : {}),
              ...(Array.isArray(more) && more.length ? { buttons: more.map((m) => ({ label: m?.label ?? '', href: m?.href ?? '' })) } : {}),
            })),
          },
        }
      : { type: 'expand', props },
  // A "FAQ list" is a "List - Expand" marked as a FAQ (`faq`: its rows are questions and answers in the page's structured data), in the design `segmented`, which is how it
  // was drawn: each question is a row's heading (`title`) and its answer the row's text (`text`, still Markdown). Everything else (the head, `only`, Columns,
  // the text button, and the rows it reads from a list) stays.
  faq: ({ items, ...props }) => ({
    type: 'expand',
    props: {
      ...props,
      design: 'segmented',
      faq: true,
      ...(Array.isArray(items)
        ? {
            items: items.map((row) => {
              if (!row || typeof row !== 'object') return row;
              const { question, answer, ...rest } = row;
              return { ...(question === undefined ? {} : { title: question }), ...(answer === undefined ? {} : { text: answer }), ...rest };
            }),
          }
        : {}),
    },
  }),
  // "Cards": the media at the top is one choice for the whole block (`media`: none, icon, image or video; an icon when it is not there), the
  // cards' type is `design` (outlined when empty, filled or elevated) with the filled card's `color` (Material's surface container when
  // empty, else the primary, secondary or tertiary container). Cards from before: the block's old `design` ('text', 'icon', 'image') is
  // `media`; the accent `background` is a filled card in the primary colour; the first version of the new cards (`kind`, and a `media` on
  // each card) gives its `kind` to `design` and the first card's `media` to the block. A card with a page is one link and has no buttons:
  // where a card had both, the page stays. Cards in the new form are read as they are. A Cards block that was a carousel (`phone: 'carousel'`, gone in 0.19.8) is
  // a Carousel block (lib/migrate-carousel.mjs); any other loses the carousel's settings.
  cards: (raw) => carouselOf(oldCards(raw)),
  // "Testimonials" has the layouts Cards and List: the carousel it had (`layout` 'slider') is Cards, now what the layout is called.
  testimonials: ({ layout, ...props }) => ({
    type: 'testimonials',
    props: { ...props, ...(layout === 'slider' ? { layout: 'cards' } : layout ? { layout } : {}) },
  }),
  // A "List" keeps its `design` (the plain design has none, `segmented` is each row on its own surface). A row that was a small heading of the rows after
  // it (`heading`, gone) is a plain row with the same title (and page), so no text is lost.
  list: (raw) => {
    const { design, ...props } = raw;
    const headings = Array.isArray(props.items) && props.items.some((row) => row && typeof row === 'object' && 'heading' in row);
    // Without a heading row, a List with no design, or the design `segmented`, is read as it is written (so a text already written so is not changed).
    if (!headings && (design === undefined || design === 'segmented')) return { type: 'list', props: raw };
    const plain = headings
      ? {
          ...props,
          items: props.items.map((row) =>
            row && typeof row === 'object' && 'heading' in row ? (({ heading, ...rest }) => rest)(row) : row,
          ),
        }
      : props;
    return { type: 'list', props: design === 'segmented' ? { ...plain, design } : plain };
  },
};

// The buttons of a "Buttons" block (`items`), of each card of "Cards" and of each price card (`items[].buttons`): an `elevated` button, a choice
// they no longer offer (0.18), is a tonal one, the quieter button it was meant to be. Everything else stays as it is.
const tonal = (list) =>
  Array.isArray(list) ? list.map((b) => (b && typeof b === 'object' && b.kind === 'elevated' ? { ...b, kind: 'tonal' } : b)) : list;
const NO_ELEVATED = {
  buttons: (props) => (Array.isArray(props.items) ? { ...props, items: tonal(props.items) } : props),
  cards: (props) => noElevatedCards(props),
  carousel: (props) => noElevatedCards(props),
  pricecards: (props) => noElevatedCards(props),
};
const noElevatedCards = (props) =>
  Array.isArray(props.items)
    ? {
        ...props,
        items: props.items.map((c) => (c && typeof c === 'object' && Array.isArray(c.buttons) ? { ...c, buttons: tonal(c.buttons) } : c)),
      }
    : props;

// types: the blocks that count (the folders in src/apps/<app>/blocks/); null for any.
const read = (type, props, types) => {
  let block;
  try {
    block = { type, props: props ? JSON.parse(unescape(props)) : {} };
  } catch {
    return null;
  }
  if (FORMER[type]) block = FORMER[type](block.props);
  if (NO_ELEVATED[block.type]) block = { type: block.type, props: NO_ELEVATED[block.type](block.props) };
  return types && !types.includes(block.type) ? null : block;
};

/** The block a piece of HTML is, when it is written in an old form that is read as another block (FORMER) or with props that
 * are read differently ({ type, props }, as the editor writes it when the page is saved), else null.
 * @param {string} html
 * @returns {{ type: string; props: Record<string, any> } | null} */
export function migratedBlock(html) {
  const m = html.trim().match(new RegExp(`^${BLOCK.source}$`));
  if (!m || !(FORMER[m[1]] || NO_ELEVATED[m[1]])) return null;
  const block = read(m[1], m[2], null);
  if (!block) return null;
  let props;
  try {
    props = m[2] ? JSON.parse(unescape(m[2])) : {};
  } catch {
    return null;
  }
  return block.type === m[1] && JSON.stringify(block.props) === JSON.stringify(props) ? null : block;
}

/** The block a piece of HTML is (and nothing else), or null; of any type unless types are given.
 * @param {string} html
 * @param {string[] | null} [types] */
export function parseBlock(html, types = null) {
  const m = html.trim().match(new RegExp(`^${BLOCK.source}$`));
  return m ? read(m[1], m[2], types) : null;
}

/** Every block in a text, hidden ones too, in order ({ type, props }), of any type. nested: also those in the text of a
 * block (a block inside the text of another block, written in its props), each after the block it is in.
 * @param {string} html
 * @returns {{ type: string; props: Record<string, any> }[]} */
export function blocksIn(html, nested = false) {
  const found = [...html.matchAll(new RegExp(BLOCK.source, 'g'))].map((m) => read(m[1], m[2], null)).filter((b) => b !== null);
  if (!nested) return found;
  const inside = (b) =>
    Object.values(b.props).flatMap((v) => (typeof v === 'string' && v.includes('data-block=') ? blocksIn(v, true) : []));
  return found.flatMap((b) => [b, ...inside(b)]);
}

/** Rendered HTML in pieces: text ({ html }) and the blocks of these types in it ({ type, props }); a
 * hidden block (`hidden`, "Hide on page" in the editor) is left out. */
export function splitBlocks(html, types) {
  const parts = [];
  const all = new RegExp(BLOCK.source, 'g');
  let last = 0;
  for (const m of html.matchAll(all)) {
    const block = read(m[1], m[2], types);
    if (!block) continue;
    parts.push({ html: html.slice(last, m.index) });
    if (!block.props.hidden) parts.push(block);
    last = m.index + m[0].length;
  }
  parts.push({ html: html.slice(last) });
  return parts.filter((p) => p.html === undefined || p.html.trim());
}
