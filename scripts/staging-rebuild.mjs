// Decides whether morpheme-staging must be rebuilt because npm's `next` tag moved (used by
// .github/workflows/staging-follows-next.yml). Pure logic, so it can be tested; the CLI at the bottom reads the
// versions and the hook from the environment and writes `action` to $GITHUB_OUTPUT.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * @param {{ next?: string, last?: string, hook?: string }} input
 * @returns {'none' | 'rebuild' | 'no-hook' | 'no-next'}
 */
export function decide({ next = '', last = '', hook = '' }) {
  next = next.trim();
  if (!next) return 'no-next';
  if (next === last.trim()) return 'none';
  if (!hook.trim()) return 'no-hook';
  return 'rebuild';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const action = decide({
    next: process.env.NEXT_VERSION,
    last: process.env.LAST_VERSION,
    hook: process.env.STAGING_DEPLOY_HOOK,
  });
  console.log(`next=${process.env.NEXT_VERSION} last=${process.env.LAST_VERSION || '(none)'} -> ${action}`);
  if (action === 'no-hook') {
    console.log(
      '::error::The repository secret STAGING_DEPLOY_HOOK is empty or missing. Staging is NOT rebuilt. ' +
        'The owner must set it (Cloudflare: morpheme-staging > Settings > Builds > Deploy Hooks).',
    );
  }
  if (action === 'no-next') console.log('::error::npm view returned no version for the next tag.');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `action=${action}\n`);
  if (action === 'no-hook' || action === 'no-next') process.exitCode = 1;
}
