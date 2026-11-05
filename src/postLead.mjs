// What the editor's preview puts in a post's lead and in its text: a post's text is split with splitLead, a page's never is.
// Exposes isPostPage and leadFill. Depends on lib/lead.mjs.
import { splitLead } from '../lib/lead.mjs';

/** A post is a page whose document has a lead or a picture slot, or whose draft changes the picture (only posts have one).
 * @param {{ hasLeadSlot: boolean, hasImageSlot: boolean, draftHasImage: boolean }} signs */
export const isPostPage = ({ hasLeadSlot, hasImageSlot, draftHasImage }) => hasLeadSlot || hasImageSlot || draftHasImage;

/** @param {string} html the text as HTML @param {boolean} isPost @returns {{ lead: string, rest: string }} */
export const leadFill = (html, isPost) => (isPost ? splitLead(html) : { lead: '', rest: html });
