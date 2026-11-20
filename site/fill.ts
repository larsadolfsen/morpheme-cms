// The shared texts of the blocks (src/data/blocks.json, "Blocks" in the editor) have
// places like {count} for what differs from block to block.

/** The text with each {name} replaced by its value; a name without a value stays as it is. */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (all, name: string) => (name in values ? String(values[name]) : all));

/** The text before and after {name}, for a value that is drawn on its own (in bold); with no {name}
 * the text is all before. */
export function around(text: string, name: string): [string, string] {
  const at = text.indexOf(`{${name}}`);
  return at < 0 ? [text, ''] : [text.slice(0, at), text.slice(at + name.length + 2)];
}
