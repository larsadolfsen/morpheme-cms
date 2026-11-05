// Which parts of Material a theme styles with its own rules (site/themeParts.mjs lists the parts). Pure functions on
// CSS text, no file access. Exposes styledClasses, partOf, partPieces, themeCoverage. Uses postcss and
// postcss-selector-parser.

import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

/** @typedef {{ id: string, group: 'ui' | 'frame', prefixes: string[] }} ThemePart */
/** @typedef {{ group: 'ui' | 'frame', status: 'own' | 'partly' | 'material', pieces: number, missing: string[] }} PartCoverage */

/**
 * @param {string} themeCss
 * @returns {Set<string>}
 */
export function styledClasses(themeCss) {
  const classes = new Set();
  const root = postcss.parse(themeCss);

  root.walkRules(rule => {
    // Skip if inside @layer
    let node = rule.parent;
    while (node) {
      if (node.type === 'atrule' && node.name === 'layer') {
        return; // Stop walking this rule
      }
      node = node.parent;
    }

    // Skip if no non-custom property declarations
    const hasNormalDecl = rule.nodes.some(
      n => n.type === 'decl' && !n.prop.startsWith('--')
    );
    if (!hasNormalDecl) return;

    // Extract subject classes
    rule.selectors.forEach(selector => {
      selectorParser((selectors) => {
        selectors.each(sel => {
          // Find subject compound: nodes after last combinator
          let lastCombinatorIdx = -1;
          sel.nodes.forEach((n, i) => {
            if (n.type === 'combinator') {
              lastCombinatorIdx = i;
            }
          });

          const subjectNodes = lastCombinatorIdx === -1 ? sel.nodes : sel.nodes.slice(lastCombinatorIdx + 1);

          const extractFromCompound = (compound) => {
            if (compound.type === 'class') {
              classes.add(compound.value);
            } else if (compound.type === 'pseudo' && (compound.value === ':is' || compound.value === ':where')) {
              if (compound.nodes) {
                compound.nodes.forEach(n => {
                  if (n.type === 'selector') {
                    n.nodes.forEach(sub => extractFromCompound(sub));
                  } else {
                    extractFromCompound(n);
                  }
                });
              }
            } else if (compound.type === 'pseudo') {
              // Skip :not, :has, etc.
            } else if (compound.nodes) {
              compound.nodes.forEach(n => extractFromCompound(n));
            }
          };

          subjectNodes.forEach(n => extractFromCompound(n));
        });
      }).processSync(selector);
    });
  });

  return classes;
}

/**
 * @param {string} className
 * @param {ThemePart[]} parts
 * @returns {string | null}
 */
export function partOf(className, parts) {
  let bestId = null;
  let bestLength = -1;

  for (const part of parts) {
    for (const prefix of part.prefixes) {
      if (className === prefix || className.startsWith(prefix + '-')) {
        const len = prefix.length;
        if (len > bestLength) {
          bestLength = len;
          bestId = part.id;
        }
      }
    }
  }

  return bestId;
}

/**
 * @param {string} materialCss
 * @param {ThemePart[]} parts
 * @returns {Record<string, string[]>}
 */
export function partPieces(materialCss, parts) {
  const root = postcss.parse(materialCss);
  const classMap = new Map();

  root.walkRules(rule => {
    rule.selectors.forEach(selector => {
      selectorParser((selectors) => {
        selectors.each(sel => {
          sel.walk(n => {
            if (n.type === 'class') {
              const partId = partOf(n.value, parts);
              if (partId) {
                if (!classMap.has(partId)) {
                  classMap.set(partId, new Set());
                }
                classMap.get(partId).add(n.value);
              }
            }
          });
        });
      }).processSync(selector);
    });
  });

  const result = {};
  for (const [id, cls] of classMap.entries()) {
    result[id] = [...cls].sort();
  }
  return result;
}

/**
 * @param {{ materialCss: string, themeCss: string, parts: ThemePart[] }} args
 * @returns {Record<string, PartCoverage>}
 */
export function themeCoverage({ materialCss, themeCss, parts }) {
  const piecesMap = partPieces(materialCss, parts);
  const styledSet = styledClasses(themeCss);

  const result = {};

  for (const part of parts) {
    if (!piecesMap[part.id]) continue;

    const pieces = piecesMap[part.id];
    const missing = pieces.filter(p => !styledSet.has(p)).sort();

    let status;
    if (missing.length === 0) {
      status = 'own';
    } else if (missing.length === pieces.length) {
      status = 'material';
    } else {
      status = 'partly';
    }

    result[part.id] = {
      group: part.group,
      status,
      pieces: pieces.length,
      missing
    };
  }

  return result;
}
