// Every bold word in a text the site shows (Markdown's **word**, HTML's <strong>) gets the class "emphasize", which a
// theme may style in its global.css; the standard theme leaves it bold. Exposes EMPHASIZE and rehypeEmphasize (a rehype
// plugin, in the site's pipeline in astro.mjs, in inline.ts and in the editor's in markdown.ts). No dependencies.

/** The class of a bold word, on the site and in the editor (strongAttr in src/markdown.mjs). */
export const EMPHASIZE = 'emphasize';

/** The rehype plugin: the class on every <strong>, its own classes kept. */
export function rehypeEmphasize() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'strong') {
        const names = [].concat(node.properties.className ?? []);
        if (!names.includes(EMPHASIZE)) node.properties.className = [...names, EMPHASIZE];
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
