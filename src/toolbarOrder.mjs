// The order of the text toolbar's tools (MarkdownEditor.tsx). The line wraps by position, so the tools that may go under the
// arrow stand last: Undo and Redo first, then the link; "+" (Insert) never goes first, and Section settings is the last tool
// of the first line. Three arrangements, tried in this order until what must stay fits on the first line:
//   'all'      every tool in its natural order, Section settings last (all of them fit on one line);
//   'mid'      the natural order but Section settings, then Undo and Redo, at the end (they wrap, Section settings stays);
//   'priority' the same as 'mid' (the link no longer moves: Bold, Italic and the link are always the first three tools);
//   'bare'     also the list tools moved to the end, before Undo and Redo (only when nothing else fits).
// Exposes ARRANGEMENTS, arrangeTools(tools, mode), nextArrangement(mode, wrapped). A tool's `role` is 'settings', 'link',
// 'italic', 'list' (each of the list tools: Bulleted list, Check list, Numbered list), 'undo' or 'redo'; the others have none.

export const ARRANGEMENTS = ['all', 'mid', 'priority', 'bare'];

/**
 * @template {{ role?: string }} T
 * @param {T[]} tools in their natural order
 * @param {'all' | 'mid' | 'priority' | 'bare'} mode
 * @returns {T[]}
 */
export function arrangeTools(tools, mode) {
  const is = (role) => (tool) => tool.role === role;
  const settings = tools.filter(is('settings'));
  const history = tools.filter((tool) => tool.role === 'undo' || tool.role === 'redo');
  const lists = tools.filter(is('list'));
  const rest = tools.filter((tool) => !['settings', 'undo', 'redo'].includes(tool.role ?? ''));
  if (mode === 'all') return [...rest, ...history, ...settings];
  // Bold, Italic and the link are always the first three tools, in every arrangement: nothing moves ahead of or behind them.
  if (mode === 'mid' || mode === 'priority') return [...rest, ...settings, ...history];
  return [...rest.filter((tool) => tool.role !== 'list'), ...settings, ...lists, ...history];
}

/**
 * The arrangement to try next: `wrapped` says which tools do not fit on the first line, as { any, kept } (any tool wrapped; a
 * tool that must stay wrapped: not Undo, Redo, the link, Italic or the lists, as far as the arrangement lets them wrap). Stays when it already works.
 * @param {'all' | 'mid' | 'priority' | 'bare'} mode
 * @param {{ any: boolean; kept: boolean }} wrapped
 * @returns {'all' | 'mid' | 'priority' | 'bare'}
 */
export function nextArrangement(mode, wrapped) {
  if (mode === 'all') return wrapped.any ? 'mid' : 'all';
  if (mode === 'mid') return wrapped.kept ? 'priority' : 'mid';
  if (mode === 'priority') return wrapped.kept ? 'bare' : 'priority';
  return 'bare';
}
