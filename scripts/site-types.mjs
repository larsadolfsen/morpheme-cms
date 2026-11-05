// The tsconfig of the site-style type check (check-site-types.mjs): the demo site's own, plus the package's whole TS source.
// Exposes siteTypesConfig(packageDir). No dependencies.

const DIRS = ['src', 'site', 'lib', 'defaults', 'theme'];

/**
 * @param {string} packageDir the package's folder, relative to the site, with forward slashes
 * @returns {{ extends: string, include: string[], exclude: string[] }}
 */
export const siteTypesConfig = (packageDir) => ({
  extends: './tsconfig.json',
  include: ['.astro/types.d.ts', '**/*', ...DIRS.flatMap((dir) => [`${packageDir}/${dir}/**/*.ts`, `${packageDir}/${dir}/**/*.tsx`])],
  exclude: ['dist', `${packageDir}/**/*.test.*`],
});
