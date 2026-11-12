// "Caching and builds" under Developer (Advanced.tsx): R2 caching (a copy of the website's files in Cloudflare R2,
// r2Caching.ts), and the build switches (buildSettings.ts).
export const advanced = {
  r2Caching: 'R2 caching',
  r2CachingHint: 'Keeps a copy of the website’s files in R2, so the editor asks GitHub only for what changed. Autosave needs it.',
  checking: 'Checking whether Cloudflare is ready…',
  /** Why it cannot be turned on, by what the editor finds at Cloudflare (packages/editor/worker/r2-status.js); `bucket` is the name
   * of the storage, `jurisdiction` where it is kept, when it has one. */
  bucket: {
    ready: (bucket: string, jurisdiction: string | null): string =>
      `The storage ${bucket} is ready at Cloudflare${jurisdiction ? ` in the ${jurisdiction}` : ''}.`,
    'no-bucket': (bucket: string, jurisdiction: string | null): string =>
      `Can be turned on once the storage ${bucket} is made under R2 at Cloudflare${jurisdiction ? ` and kept in the ${jurisdiction}` : ''}.`,
    'no-r2': (): string => 'Can be turned on once R2 is turned on at Cloudflare.',
    'no-key': (): string => 'The editor has no key for Cloudflare, so it can’t see whether R2 is turned on.',
    refused: (): string => 'Cloudflare didn’t accept the editor’s key for R2.',
    failed: (): string => 'Cloudflare didn’t answer whether R2 is ready. Try again later.',
  },
  builds: 'Builds',
  contentOnlyBuilds: 'Content-only builds',
  contentOnlyBuildsHint: 'When only content changed, the build skips the full site check. Turn off to run every check each time.',
  paidBuilds: 'Workers Paid plan',
  paidBuildsHint: 'The editor waits 10 minutes for a build instead of 20. Turn on when your Cloudflare account has Workers Paid.',
  /** Why the Workers Paid switch can't be turned on, by what the editor finds of the account's plan (packages/editor/worker/plan-status.js). */
  plan: {
    no: 'Can be turned on once the Cloudflare account has Workers Paid.',
    'no-key': 'The editor has no key for Cloudflare, so it can’t see whether the account has Workers Paid.',
    refused: 'Cloudflare didn’t let the editor’s key read the account’s plan. The key needs Billing: Read.',
    failed: 'Cloudflare didn’t answer whether the account has Workers Paid. Try again later.',
  },
  billing: 'Open billing at Cloudflare',
  /** Once, after a change was saved as a waiting version (src/drafts/): the steps in Cloudflare that skip the build it starts. */
  skipDraftBuildsTitle: 'Skip builds for waiting versions',
  skipDraftBuilds:
    'Saving changes that wait to be published builds the website with only the editor’s checks. To skip that build, open the website’s build settings in Cloudflare, choose Build watch paths, and under Exclude paths add src/drafts/**. Only you can change this in Cloudflare.',
  buildSettingsNotLoaded: (error: string) => `The build settings couldn’t be loaded: ${error}`,
  place: 'R2 location',
  placeHint: 'Can only be changed while R2 caching is off.',
  placeAuto: 'Automatic',
  onWhenBuilt: 'Turned on when the website is built.',
  offWhenBuilt: 'Turned off when the website is built.',
  loading: 'Loading settings…',
  notLoaded: (error: string) => `The settings couldn’t be loaded: ${error}`,
  noSettings: 'The website has no settings for the editor',
  noLine: 'The website’s settings have no place for R2 caching',
  /** The commit (siteT). */
  r2CachingCommit: (on: boolean): string => (on ? 'Editor: turn on R2 caching' : 'Editor: turn off R2 caching'),
  contentOnlyBuildsCommit: (on: boolean): string => (on ? 'Editor: turn on content-only builds' : 'Editor: turn off content-only builds'),
  paidBuildsCommit: (on: boolean): string => (on ? 'Editor: turn on the paid build plan' : 'Editor: turn off the paid build plan'),
  placeCommit: (jurisdiction: string | null): string =>
    jurisdiction ? `Editor: keep the R2 caching bucket in the ${jurisdiction}` : 'Editor: let Cloudflare place the R2 caching bucket',
};
