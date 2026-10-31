// "Avanceret" under "Indstillinger" (Advanced.tsx): R2 caching, the copy of the site's files in Cloudflare R2
// (r2Caching.ts).
export const advanced = {
  r2Caching: 'R2 caching',
  r2CachingHint: "The Worker gives the editor the site's files from Cloudflare R2 and asks GitHub only for what has changed.",
  checking: 'Asking Cloudflare whether R2 is ready.',
  /** Why it cannot be turned on, by what the Worker says of the bucket at Cloudflare (packages/editor/worker/r2-status.js); with the
   * jurisdiction it is kept within, when it has one. */
  bucket: {
    ready: (bucket: string, jurisdiction: string | null): string =>
      `The bucket ${bucket} is ready at Cloudflare${jurisdiction ? ` in the ${jurisdiction}` : ''}.`,
    'no-bucket': (bucket: string, jurisdiction: string | null): string =>
      `Can be turned on once the bucket ${bucket} is made under R2 at Cloudflare${jurisdiction ? ` with the jurisdiction ${jurisdiction}` : ''}.`,
    'no-r2': (): string => 'Can be turned on once R2 is turned on at Cloudflare.',
    'no-key': (): string => 'The Worker has no key for Cloudflare, so it can’t see whether R2 is turned on.',
    refused: (): string => "Cloudflare didn’t accept the Worker's key for R2.",
    failed: (): string => 'Cloudflare didn’t answer whether R2 is ready. Try again later.',
  },
  place: 'Location',
  placeHint: 'Can only be changed while R2 caching is off.',
  placeAuto: 'Automatic',
  onWhenBuilt: 'Turned on when the site is updated.',
  offWhenBuilt: 'Turned off when the site is updated.',
  loading: "Loading the Worker's settings",
  notLoaded: (error: string) => `The Worker's settings couldn’t be loaded: ${error}`,
  noSettings: 'The site has no settings for the Worker (wrangler.jsonc)',
  noLine: "The Worker's settings (wrangler.jsonc) have no line for R2 caching",
  /** The commit (siteT). */
  r2CachingCommit: (on: boolean): string => (on ? 'Editor: turn on R2 caching' : 'Editor: turn off R2 caching'),
  placeCommit: (jurisdiction: string | null): string =>
    jurisdiction ? `Editor: keep the R2 caching bucket in the ${jurisdiction}` : 'Editor: let Cloudflare place the R2 caching bucket',
};
