// Colours in the editor's block parts come only from the context tokens (the theme's --mo-* roles, which a section on a colour swaps,
// currentColor and color-mix of them), never from a fixed value: a fixed colour does not follow the section's colours (the check list
// marks and the List's rows once did not). Fails on a hex, rgb()/hsl() or named colour in src/editor.css and src/Inline*.tsx, except
// where the allowlist below gives a reason. Run by npm run check.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;
// Lines (the text before the colour, a custom property's name or a selector) that may hold a fixed colour, and why.
const allowed = [
  [/--editor-status-/, "the ratings of a check (good, average, bad) are PageSpeed's own colours"],
  [/--google-/, "the search-result preview is Google's own look, in light and dark"],
  [/transparent|#0000\b/, 'no colour'],
  [/(box-)?shadow/, 'a shadow is black over any colour'],
];
const named = /\b(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta)\b/;
const fixed = new RegExp(`#[0-9a-fA-F]{3,8}\\b|\\b(?:rgb|rgba|hsl|hsla)\\(|(?<![\\w-])${named.source}(?![\\w-])`, 'i');

const files = ['editor.css', ...readdirSync(SRC).filter((f) => /^Inline.*\.tsx$/.test(f))];
const problems = [];
for (const file of files) {
  let comment = false;
  readFileSync(join(SRC, file), 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      // Comments and the data: URLs of icons (their fill is a mask) are not colours.
      let line = raw.replace(/url\("data:[^"]*"\)/g, 'url()').replace(/\/\*.*?\*\//g, '');
      if (comment) {
        if (!line.includes('*/')) return;
        line = line.slice(line.indexOf('*/') + 2);
        comment = false;
      }
      if (line.includes('/*')) {
        line = line.slice(0, line.indexOf('/*'));
        comment = true;
      }
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return;
      if (fixed.test(line) && !allowed.some(([re]) => re.test(line)))
        problems.push(
          `src/${file}:${i + 1}: a fixed colour (${line.trim()}): use the theme's tokens (--mo-*, currentColor, color-mix) so it follows the section`,
        );
    });
}
if (problems.length) {
  console.error(`${problems.length} fixed colours in the editor's block parts:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log("The editor's block parts take their colours from the theme's tokens.");
