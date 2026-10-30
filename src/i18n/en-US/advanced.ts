import type { Messages } from '../da-DK';

export const advanced: Messages['advanced'] = {
  r2Caching: 'R2 caching',
  r2CachingHint: "The Worker gives the editor the site's files from Cloudflare R2 and asks GitHub only for what has changed.",
  checking: 'Asking Cloudflare whether R2 is ready.',
  bucket: {
    ready: (bucket, jurisdiction) => `The bucket ${bucket} is ready at Cloudflare${jurisdiction ? ` in the ${jurisdiction}` : ''}.`,
    'no-bucket': (bucket, jurisdiction) =>
      `Can be turned on once the bucket ${bucket} is made under R2 at Cloudflare${jurisdiction ? ` with the jurisdiction ${jurisdiction}` : ''}.`,
    'no-r2': () => 'Can be turned on once R2 is turned on at Cloudflare.',
    'no-key': () => 'The Worker has no key for Cloudflare, so it cannot see whether R2 is turned on.',
    refused: () => "Cloudflare did not accept the Worker's key for R2.",
    failed: () => 'Cloudflare did not answer whether R2 is ready. Try again later.',
  },
  place: 'Location',
  placeHint: 'Can only be changed while R2 caching is off.',
  placeAuto: 'Automatic',
  onWhenBuilt: 'Turned on when the site is updated.',
  offWhenBuilt: 'Turned off when the site is updated.',
  loading: "Loading the Worker's settings",
  notLoaded: (error: string) => `The Worker's settings could not be loaded: ${error}`,
  noSettings: 'The site has no settings for the Worker (wrangler.jsonc).',
  noLine: "The Worker's settings (wrangler.jsonc) have no line for R2 caching.",
  r2CachingCommit: (on: boolean) => (on ? 'Editor: turn on R2 caching' : 'Editor: turn off R2 caching'),
  placeCommit: (jurisdiction: string | null) =>
    jurisdiction ? `Editor: keep the R2 caching bucket in the ${jurisdiction}` : 'Editor: let Cloudflare place the R2 caching bucket',
};
