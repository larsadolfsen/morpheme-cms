// `morpheme locale <code>`: lays the site's i18n/<code>/ over the site, sets `locale` in src/site/config.ts and deletes i18n/.
// Exposes applyLocale. Run once, in a new site's root.
// Depends on: lib/locale.mjs.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layerPlan } from '../lib/locale.mjs';

/**
 * Applies the layer for `code` in the site at `root`.
 * @param {string} root
 * @param {string} code
 */
export function applyLocale(root, code) {
  const i18n = join(root, 'i18n');
  if (!/^[A-Za-z0-9_-]+$/.test(code) || !existsSync(join(i18n, code))) {
    const available = existsSync(i18n)
      ? readdirSync(i18n, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
      : [];
    throw new Error(`There is no i18n/${code}/ folder here. Available: ${available.length ? available.join(', ') : 'none'}.`);
  }
  const configFile = join(root, 'src/site/config.ts');
  const config = existsSync(configFile) ? readFileSync(configFile, 'utf8') : '';
  const LOCALE = /(\blocale:\s*)(['"])[^'"]*\2/;
  if (!LOCALE.test(config)) throw new Error(`Found no \`locale: '...'\` in src/site/config.ts, so it cannot be set to '${code}'.`);

  const files = readdirSync(i18n, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) =>
      join(e.parentPath, e.name)
        .slice(root.length)
        .replace(/^[/\\]+/, '')
        .split('\\')
        .join('/'),
    );
  const { copy, remove } = layerPlan(files, code);
  for (const [from, to] of copy) {
    mkdirSync(dirname(join(root, to)), { recursive: true });
    cpSync(join(root, from), join(root, to));
  }
  for (const path of remove) rmSync(join(root, path), { force: true });
  writeFileSync(configFile, config.replace(LOCALE, `$1'${code}'`));
  rmSync(i18n, { recursive: true, force: true });
  return { copied: copy.length, removed: remove.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: morpheme locale <code>, for example: morpheme locale da-DK');
    process.exit(1);
  }
  try {
    const { copied, removed } = applyLocale(process.cwd(), code);
    console.log(`Locale ${code}: ${copied} files laid over the site, ${removed} removed. i18n/ deleted.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
