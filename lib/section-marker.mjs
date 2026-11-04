// The colour of a section of a page or blog post (the *Sektionsfarve* button on an H2): in the Markdown a line of HTML right before
// the H2 (or before the label above it), <div data-section="tint"></div>. Only the theme's own colours, by name. Exposes
// SECTION_COLORS, sectionMarker, markerColor and isLabelLine. Depends on lib/eyebrow.mjs; no React or browser.
import { eyebrowText } from './eyebrow.mjs';

/** The colours, by the theme colour they are: --block-surface, --block-tint and --block-accent. */
export const SECTION_COLORS = ['surface', 'tint', 'accent'];

const MARKER = new RegExp(`^<div data-section="(${SECTION_COLORS.join('|')})"></div>$`);

/** The marker line of a colour. @param {string} color */
export const sectionMarker = (color) => `<div data-section="${color}"></div>`;

/** The colour a piece of HTML is the marker of, or null (also for a colour the theme has not). @param {string} html @returns {string | null} */
export const markerColor = (html) => String(html).trim().match(MARKER)?.[1] ?? null;

/** Whether a piece of HTML is the line of a label above a heading (lib/eyebrow.mjs). @param {string} html */
export const isLabelLine = (html) => eyebrowText(html) !== null;
