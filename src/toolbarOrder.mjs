// The order of the text toolbar's tools in a section's heading (MarkdownEditor.tsx): the tools in `first` (Section settings and
// the kinds of text) come first, the rest after them, each group in its own order, so on a phone Section settings stays
// on the toolbar's first line instead of under the arrow. Exposes toolsInOrder(tools, first, inSection).
/**
 * The tools, with those `first` (a function of a tool) ahead of the rest when `inSection`; else as they are.
 * @template T
 * @param {T[]} tools
 * @param {(tool: T) => boolean} first
 * @param {boolean} inSection
 * @returns {T[]}
 */
export function toolsInOrder(tools, first, inSection) {
  return inSection ? [...tools.filter(first), ...tools.filter((tool) => !first(tool))] : tools;
}
