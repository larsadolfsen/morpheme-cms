// The Appstore's three sections (Themes, Connectors, Plugins): which apps each lists and which one opens first (pure).
// Exposes SECTIONS, filterByRole(list, role), readSection(storage), saveSection(storage, section), serviceOf(app), mcpOf(mcp); used by StoreSections.tsx and AppList.tsx.
import { roleOf } from '../lib/storeCategories.mjs';

/** The sections, in the order of the switch. */
export const SECTIONS = /** @type {const} */ (['themes', 'connectors', 'plugins']);

/** @typedef {typeof SECTIONS[number]} Section */

/** Whether `id` names a section (the last part of #settings/appstore/<section>).
 * @param {string} id
 * @returns {id is Section}
 */
export const isSection = (id) => SECTIONS.includes(/** @type {Section} */ (id));

/** The section opened first when none is kept. */
export const FIRST_SECTION = 'plugins';

const KEY = 'morpheme-store-section';

/**
 * The apps of one role: an app with no (or an unknown) role is a plugin (roleOf).
 * @template {{ kind?: unknown, role?: unknown, category?: unknown }} T
 * @param {T[]} list
 * @param {'connector' | 'plugin'} role
 * @returns {T[]}
 */
export function filterByRole(list, role) {
  return list.filter((a) => roleOf(a) === role);
}

/**
 * The section the owner used last in this browser, else Plugins. Never throws (storage may be missing or blocked).
 * @param {Pick<Storage, 'getItem'> | undefined} [storage]
 * @returns {Section}
 */
export function readSection(storage) {
  try {
    const saved = (storage ?? globalThis.localStorage)?.getItem(KEY);
    if (SECTIONS.includes(/** @type {Section} */ (saved))) return /** @type {Section} */ (saved);
  } catch {}
  return FIRST_SECTION;
}

/**
 * Keeps the section for next time. Never throws.
 * @param {Pick<Storage, 'setItem'> | undefined} storage
 * @param {Section} section
 */
export function saveSection(storage, section) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(KEY, section);
  } catch {}
}

/**
 * The service a connector connects to: the `service` of its entry, else the hosts it loads from or sends to.
 * Empty when it has none to name.
 * @param {{ service?: unknown, needs?: { loads?: string[], sends?: string[] } }} app
 * @returns {string}
 */
export function serviceOf(app) {
  if (typeof app.service === 'string' && app.service.trim()) return app.service.trim();
  const hosts = [...new Set([...(app.needs?.loads ?? []), ...(app.needs?.sends ?? [])])];
  return hosts.slice(0, 2).join(', ');
}

/**
 * A connector's MCP server from its catalog entry: its host and the tools it uses, or undefined when the entry has none
 * (or its address is not a URL). Shown before install, as the hosts and what it reads are.
 * @param {unknown} mcp
 * @returns {{ host: string, tools: string[] } | undefined}
 */
export function mcpOf(mcp) {
  const server = /** @type {{ server?: unknown } | null | undefined} */ (mcp)?.server;
  if (typeof server !== 'string') return undefined;
  let host;
  try {
    host = new URL(server).host;
  } catch {
    return undefined;
  }
  const tools = /** @type {{ tools?: unknown }} */ (mcp).tools;
  return { host, tools: Array.isArray(tools) ? tools.filter((x) => typeof x === 'string') : [] };
}
