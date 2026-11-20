// The front page's leads of the blocks (lead.ts in a block's folder), keyed by block type: what leadsOf makes of the
// glob results of the standard blocks and the apps' blocks. Exposes leadsOf; used by frontLeads.ts. No imports.

/**
 * @param {Record<string, { lead: import('../schema').Lead }>} modules glob results, keyed by the path of each lead.ts
 * @returns {Record<string, import('../schema').Lead>} the leads, keyed by block type (the folder of lead.ts);
 * an app's lead (a path under /apps/) over a standard one of the same type, whatever the order of the keys
 */
export function leadsOf(modules) {
  const own = (path) => path.includes('/apps/');
  const entries = Object.entries(modules).map(([path, m]) => ({ path, type: path.split('/').at(-2), lead: m.lead }));
  const ordered = [...entries.filter((e) => !own(e.path)), ...entries.filter((e) => own(e.path))];
  return Object.fromEntries(ordered.map((e) => [e.type, e.lead]));
}
