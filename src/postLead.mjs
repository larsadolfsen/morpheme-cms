// What the editor's preview puts in a post's lead and in its text: a post's text is split with splitLead, a page's never is.
// Exposes isPostPage (reads draft.post from pagePreview.tsx) and leadFill. Depends on lib/lead.mjs.
import { splitLead } from '../lib/lead.mjs';

/** @param {{ post?: boolean }} draft */
export const isPostPage = (draft) => draft.post === true;

/** @param {string} html the text as HTML @param {boolean} isPost @returns {{ lead: string, rest: string }} */
export const leadFill = (html, isPost) => (isPost ? splitLead(html) : { lead: '', rest: html });
