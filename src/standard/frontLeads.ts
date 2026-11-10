// The text above a block's card that is the block's own on the front page, from each block's lead.ts (the standard
// blocks' and the apps'). Exposes frontLeads (re-exported by defaults/standardPages.ts); depends on Vite's import.meta.glob.
import type { Lead } from '../schema';
import { leadsOf } from './leads.mjs';

type Found = Record<string, { lead: Lead }>;

/** The text above a block's card that is the block's own on the front page: its heading, text and picture (the top: the "Banner"'s text up to its "Buttons" block). */
export const frontLeads: Record<string, Lead> = leadsOf({
  ...import.meta.glob<{ lead: Lead }>('./*/lead.ts', { eager: true }),
  ...(import.meta.glob<{ lead: Lead }>('/src/apps/*/blocks/*/lead.ts', { eager: true }) as Found),
});
