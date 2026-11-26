// `morpheme accessibility [<theme>]`: measures the theme (default: the theme in use) with the checks and writes its accessibility.json (score and checks; lib/accessibility.mjs).
// Material (`saturn`) is written to this package's theme/accessibility.json, another theme to src/themes/<theme>/accessibility.json. It is a measurement, never a gate:
// the command never fails on a theme's values (spec 2026-11-25-themes-classified-design.md). Run it on a built demo or site: npm run build, then the command.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [theme] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const env = {
  ...process.env,
  CONTRAST_WRITE: '1',
  CONTRAST_TARGET_ONLY: '1',
  MORPHEME_COMPONENTS_PATH: '/ui/',
  ...(theme ? { CONTRAST_THEMES: theme } : {}),
};
delete env.CONTRAST_SECTIONS;
const file = fileURLToPath(new URL('./check-contrast.mjs', import.meta.url));
const { status } = spawnSync(process.execPath, [file], { stdio: 'inherit', env });
process.exit(status ?? 1);
