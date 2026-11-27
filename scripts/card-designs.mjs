// Every theme styles all three designs of a card (Material 3's Outlined, Filled and Elevated, `.mo-card.mo-is-outlined`, `.mo-card.mo-is-filled` and
// `.mo-card.mo-is-elevated` in theme/ui/Card.tsx) and the three containers of a filled "Cards" block (`.mo-block-cards__primary`, `-secondary`,
// `-tertiary`), so a card never lacks a design when the owner swaps the theme (docs/superpowers/specs/2026-11-11-intuitive-editor-design.md,
// finding 17). `cardDesignProblems(css)` says which the CSS of a built site leaves unstyled; check:themes (check-themes.mjs) fails a theme
// with a problem. No dependencies.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const CARD_DESIGNS = ['outlined', 'filled', 'elevated'];
export const CARD_COLORS = ['primary', 'secondary', 'tertiary'];

/** The bodies of the rules whose selector has the class `.name` (nested rules and at-rules are looked into, as the built CSS keeps them). */
function bodies(css, name, prefix = '') {
  const found = [];
  const re = new RegExp(`${prefix}\\.${name}(?![\\w-])[^{};]*\\{([^{}]*)\\}`, 'g');
  for (const m of css.matchAll(re)) found.push(m[1]);
  return found;
}

/** What a theme's CSS leaves unstyled: a design without a surface (a background), a colour without a surface or text colour. */
export function cardDesignProblems(css) {
  const problems = [];
  // The Carousel block: the row is the theme's, scrolled sideways (`overflow-x`), under .mo-block-carousel.
  if (!bodies(css, 'mo-block-carousel').some((b) => /overflow-x\s*:\s*(auto|scroll)/.test(b)))
    problems.push('the Carousel block (.mo-block-carousel) does not scroll sideways (no overflow-x: auto)');
  for (const design of CARD_DESIGNS) {
    if (!bodies(css, `mo-is-${design}`, '(?::where\\()?\\.mo-card\\)?').some((b) => /(^|[;\s])background(-color)?\s*:/.test(b)))
      problems.push(`the card design "${design}" (.mo-card.mo-is-${design}) has no background`);
  }
  for (const color of CARD_COLORS) {
    if (
      !bodies(css, `mo-block-cards__${color}`).some((b) =>
        /--mo-comp-filled-card-container-color\s*:|(^|[;\s])background(-color)?\s*:/.test(b),
      )
    )
      problems.push(`the filled card color "${color}" (.mo-block-cards__${color}) has no surface`);
  }
  return problems;
}

/** The CSS of a built site under a folder, joined: its .css files and the <style> blocks of its pages (the build inlines its stylesheets, `inlineStylesheets: 'always'`, so the CSS is in the pages, not in _astro/). */
export function cssIn(folder) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.css')) out.push(readFileSync(path, 'utf8'));
      else if (name.endsWith('.html'))
        for (const m of readFileSync(path, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) out.push(m[1]);
    }
  };
  walk(folder);
  return out.join('\n');
}
