// "Caching and builds" under Developer (Advanced.tsx): the faster editor (a copy of the website's files in Cloudflare R2,
// r2Caching.ts), and the switches for updating the website (buildSettings.ts).
export const advanced = {
  morpheme: 'Morpheme',
  r2Caching: 'Faster editor',
  r2CachingHint: "The editor loads the website's files faster and asks GitHub only for what has changed.",
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
  builds: 'Updating the website',
  fastContentBuilds: 'Faster updates for content',
  fastContentBuildsHint: 'The website updates sooner when you only change content.',
  paidBuilds: 'Workers Paid plan',
  paidBuildsHint: 'Turn on when your Cloudflare account has Workers Paid.',
  /** Why the Workers Paid switch can't be turned on, by what the editor finds of the account's plan (packages/editor/worker/plan-status.js). */
  plan: {
    no: 'Can be turned on once the Cloudflare account has Workers Paid.',
    'no-key': 'The editor has no key for Cloudflare, so it can’t see whether the account has Workers Paid.',
    refused: 'Cloudflare didn’t let the editor’s key read the account’s plan. The key needs Billing: Read.',
    failed: 'Cloudflare didn’t answer whether the account has Workers Paid. Try again later.',
  },
  billing: 'Open billing at Cloudflare',
  buildSettingsNotLoaded: (error: string) => `The settings for updating the website couldn’t be loaded: ${error}`,
  place: 'Location',
  placeHint: 'Can only be changed while Faster editor is off.',
  placeAuto: 'Automatic',
  onWhenBuilt: 'Turned on when the website is updated.',
  offWhenBuilt: 'Turned off when the website is updated.',
  loading: 'Loading settings…',
  notLoaded: (error: string) => `The settings couldn’t be loaded: ${error}`,
  noSettings: 'The website has no settings for the editor',
  noLine: 'The website’s settings have no place for Faster editor',
  /** The commit (siteT). */
  r2CachingCommit: (on: boolean): string => (on ? 'Editor: turn on R2 caching' : 'Editor: turn off R2 caching'),
  fastContentBuildsCommit: (on: boolean): string => (on ? 'Editor: turn on fast content builds' : 'Editor: turn off fast content builds'),
  paidBuildsCommit: (on: boolean): string => (on ? 'Editor: turn on the paid build plan' : 'Editor: turn off the paid build plan'),
  placeCommit: (jurisdiction: string | null): string =>
    jurisdiction ? `Editor: keep the R2 caching bucket in the ${jurisdiction}` : 'Editor: let Cloudflare place the R2 caching bucket',
};
