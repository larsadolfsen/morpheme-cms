// "Avanceret" under "Indstillinger" (Advanced.tsx): R2 caching, the copy of the site's files in Cloudflare R2
// (r2Caching.ts).
export const advanced = {
  r2Caching: 'R2-caching',
  r2CachingHint: 'Workeren giver editoren hjemmesidens filer fra Cloudflare R2 og spørger kun GitHub om det, der er ændret.',
  checking: 'Spørger Cloudflare, om R2 er klar.',
  /** Why it cannot be turned on, by what the Worker says of the bucket at Cloudflare (packages/editor/worker/r2-status.js); with the
   * jurisdiction it is kept within, when it has one. */
  bucket: {
    ready: (bucket: string, jurisdiction: string | null): string =>
      `Bucket'en ${bucket} er klar hos Cloudflare${jurisdiction ? ` i ${jurisdiction}` : ''}.`,
    'no-bucket': (bucket: string, jurisdiction: string | null): string =>
      `Kan slås til, når bucket'en ${bucket} er lavet under R2 hos Cloudflare${jurisdiction ? ` med jurisdiktionen ${jurisdiction}` : ''}.`,
    'no-r2': (): string => 'Kan slås til, når R2 er slået til hos Cloudflare.',
    'no-key': (): string => 'Workeren har ingen nøgle til Cloudflare, så den kan ikke se, om R2 er slået til.',
    refused: (): string => 'Cloudflare godtog ikke Workerens nøgle til R2.',
    failed: (): string => 'Cloudflare svarede ikke på, om R2 er klar. Prøv igen senere.',
  },
  place: 'Placering',
  placeHint: 'Kan kun skiftes, når R2-caching er slået fra.',
  placeAuto: 'Automatisk',
  onWhenBuilt: 'Slås til, når hjemmesiden er opdateret.',
  offWhenBuilt: 'Slås fra, når hjemmesiden er opdateret.',
  loading: 'Henter Workerens indstillinger',
  notLoaded: (error: string) => `Workerens indstillinger kunne ikke hentes: ${error}`,
  noSettings: 'Hjemmesiden har ingen indstillinger til Workeren (wrangler.jsonc).',
  noLine: 'Workerens indstillinger (wrangler.jsonc) har ingen linje til R2-caching.',
  /** The commit (siteT). */
  r2CachingCommit: (on: boolean): string => (on ? 'Editor: slå R2-caching til' : 'Editor: slå R2-caching fra'),
  placeCommit: (jurisdiction: string | null): string =>
    jurisdiction ? `Editor: hold R2-cachingens bucket i ${jurisdiction}` : 'Editor: lad Cloudflare placere R2-cachingens bucket',
};
