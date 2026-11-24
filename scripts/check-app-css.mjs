// What the scoped app CSS (lib/appCss.mjs, docs/superpowers/specs/2026-11-20-scoped-app-css-design.md) would rename or refuse in each app. Batch 0 and 1: it only
// reports and never fails (`--report` is the only mode), so the owner's apps and a site's apps are known before the contract changes. Per app, it lists
//   renamed   the private custom properties, keyframes, font families and layers the build renames,
//   refused   what the contract's check will refuse (batch 2): a rule on :root, html or body; a private custom property set or read from code
//             (`style` objects, setProperty, getPropertyValue, a `var(--mo-…)` string in View.tsx or script.ts); an attribute selector on `data-mo-app`,
//   limits    what the build does not scope: an `@import` in the app's CSS.
// Run: npm run check:app-css -- --report [--site <folder>]… (a folder with src/apps/; default: the working directory, then the demo and the starter).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { cmsDeclared } from '../site/appCss.mjs';
import { collectNames } from '../lib/appCss.mjs';

const here = fileURLToPath(new URL('..', import.meta.url));
const PAGE_RULE = /(^|[\s,>+~(])(:root|html|body)(?![\w-])/i;

const walk = (dir, test) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(join(dir, e.name), test)) : test(e.name) ? [join(dir, e.name)] : [],
  );

/** The report of one app folder: `{ id, files, renamed: {vars, keyframes, fonts, layers}, refused: string[], limits: string[] }`. */
export function reportApp(folder, id, cmsNames = new Set()) {
  const css = walk(folder, (n) => n.endsWith('.css'));
  const code = walk(folder, (n) => /\.(tsx?|jsx?|mjs)$/.test(n) && !/\.test\./.test(n));
  const texts = css.map((f) => [f, readFileSync(f, 'utf8')]);
  const names = collectNames(
    texts.map(([, t]) => t),
    id,
    cmsNames,
  );
  const refused = [];
  const limits = [];
  for (const [file, text] of texts) {
    const rel = relative(folder, file);
    let tree;
    try {
      tree = postcss.parse(text);
    } catch (e) {
      limits.push(`${rel}: does not parse (${e.reason ?? e.message})`);
      continue;
    }
    tree.walkRules((rule) => {
      if (rule.selectors.some((s) => PAGE_RULE.test(s))) refused.push(`${rel}:${rule.source?.start?.line}: a rule on ${rule.selector}`);
      if (/\[\s*data-mo-app/.test(rule.selector)) refused.push(`${rel}:${rule.source?.start?.line}: an attribute selector on data-mo-app`);
    });
    tree.walkAtRules('import', (r) => limits.push(`${rel}:${r.source?.start?.line}: @import ${r.params} is not scoped`));
  }
  const priv = [...names.vars];
  for (const file of code) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const name of priv)
        if (line.includes(name) || (/setProperty\(|getPropertyValue\(/.test(line) && line.includes('--mo-')))
          refused.push(`${relative(folder, file)}:${i + 1}: a custom property in code (${name})`);
    });
  }
  return {
    id,
    files: css.map((f) => relative(folder, f)),
    renamed: Object.fromEntries(Object.entries(names).map(([k, v]) => [k, [...v]])),
    refused: [...new Set(refused)],
    limits,
  };
}

/** The report of every app under a site's `src/apps/`. @param {string} site */
export function reportSite(site, cmsNames) {
  const dir = join(site, 'src/apps');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => reportApp(join(dir, e.name), e.name, cmsNames));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const sites = args.flatMap((a, i) => (args[i - 1] === '--site' ? [a] : []));
  const roots = sites.length ? sites : [process.cwd(), join(here, 'demo'), join(here, 'starter')];
  const cms = cmsDeclared([join(here, 'theme'), join(here, 'src')]);
  let apps = 0;
  for (const site of new Set(roots)) {
    for (const r of reportSite(site, cms)) {
      apps++;
      const count = Object.values(r.renamed).reduce((n, l) => n + l.length, 0);
      console.log(
        `${relative(process.cwd(), site) || '.'} · ${r.id}: ${r.files.length} css file(s), ${count} name(s) renamed, ${r.refused.length} refused, ${r.limits.length} not scoped`,
      );
      for (const [k, l] of Object.entries(r.renamed)) if (l.length) console.log(`  renamed ${k}: ${l.join(', ')}`);
      for (const p of r.refused) console.log(`  refused: ${p}`);
      for (const p of r.limits) console.log(`  limit: ${p}`);
    }
  }
  console.log(`check:app-css (report only): ${apps} app(s) read.`);
}
