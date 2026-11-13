// Every theme styles all three designs of a card (Material 3's Outlined, Filled and Elevated, `.card-outlined`, `.card-filled` and
// `.card-elevated` in theme/ui/Card.tsx) and the three containers of a filled "Cards" block (`.block-cards-primary`, `-secondary`,
// `-tertiary`), so a card never lacks a design when the owner swaps the theme (docs/superpowers/specs/2026-11-11-intuitive-editor-design.md,
// finding 17). `cardDesignProblems(css)` says which the CSS of a built site leaves unstyled; check:themes (check-themes.mjs) fails a theme
// with a problem. No dependencies.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const CARD_DESIGNS = ['outlined', 'filled', 'elevated'];
export const CARD_COLORS = ['primary', 'secondary', 'tertiary'];

/** The bodies of the rules whose selector has the class `.name` (nested rules and at-rules are looked into, as the built CSS keeps them). */
function bodies(css, name) {
  const found = [];
  const re = new RegExp(`\\.${name}(?![\\w-])[^{};]*\\{([^{}]*)\\}`, 'g');
  for (const m of css.matchAll(re)) found.push(m[1]);
  return found;
}

/** What a theme's CSS leaves unstyled: a design without a surface (a background), a colour without a surface or text colour. */
export function cardDesignProblems(css) {
  const problems = [];
  // Cards that are a carousel on phones: the row is the theme's, scrolled sideways (`overflow-x`), under .block-cards-carousel.
  if (!bodies(css, 'block-cards-carousel').some((b) => /overflow-x\s*:\s*(auto|scroll)/.test(b)))
    problems.push('the Cards carousel on phones (.block-cards-carousel) does not scroll sideways (no overflow-x: auto)');
  for (const design of CARD_DESIGNS) {
    if (!bodies(css, `card-${design}`).some((b) => /(^|[;\s])background(-color)?\s*:/.test(b)))
      problems.push(`the card design "${design}" (.card-${design}) has no background`);
  }
  for (const color of CARD_COLORS) {
    if (!bodies(css, `block-cards-${color}`).some((b) => /--card-filled-surface\s*:|(^|[;\s])background(-color)?\s*:/.test(b)))
      problems.push(`the filled card color "${color}" (.block-cards-${color}) has no surface`);
  }
  return problems;
}

/** The CSS files under a folder, joined (a built site's _astro/). */
export function cssIn(folder) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.css')) out.push(readFileSync(path, 'utf8'));
    }
  };
  walk(folder);
  return out.join('\n');
}
