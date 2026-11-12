import type { Messages } from '../en-US';

export const advanced: Messages['advanced'] = {
  r2Caching: 'R2-caching',
  r2CachingHint:
    'Gemmer en kopi af hjemmesidens filer i R2, så editoren kun spørger GitHub om det, der er ændret. Automatisk gemning kræver den.',
  checking: 'Tjekker, om Cloudflare er klar…',
  bucket: {
    ready: (bucket, jurisdiction) => `Lageret ${bucket} er klar hos Cloudflare${jurisdiction ? ` i ${jurisdiction}` : ''}.`,
    'no-bucket': (bucket, jurisdiction) =>
      `Kan slås til, når lageret ${bucket} er lavet under R2 hos Cloudflare${jurisdiction ? ` og ligger i ${jurisdiction}` : ''}.`,
    'no-r2': () => 'Kan slås til, når R2 er slået til hos Cloudflare.',
    'no-key': () => 'Editoren har ingen nøgle til Cloudflare, så den kan ikke se, om R2 er slået til.',
    refused: () => 'Cloudflare godtog ikke editorens nøgle til R2.',
    failed: () => 'Cloudflare svarede ikke på, om R2 er klar. Prøv igen senere.',
  },
  builds: 'Bygning',
  contentOnlyBuilds: 'Bygning kun af indhold',
  contentOnlyBuildsHint:
    'Når kun indhold er ændret, springer bygningen hjemmesidens fulde tjek over. Slå fra for at køre alle tjek hver gang.',
  paidBuilds: 'Workers Paid-plan',
  paidBuildsHint: 'Editoren venter 10 minutter på en bygning i stedet for 20. Slå til, når Cloudflare-kontoen har Workers Paid.',
  plan: {
    no: 'Kan slås til, når Cloudflare-kontoen har Workers Paid.',
    'no-key': 'Editoren har ingen nøgle til Cloudflare, så den kan ikke se, om kontoen har Workers Paid.',
    refused: 'Cloudflare lod ikke editorens nøgle læse kontoens plan. Nøglen skal have Billing: Read.',
    failed: 'Cloudflare svarede ikke på, om kontoen har Workers Paid. Prøv igen senere.',
  },
  billing: 'Åbn betaling hos Cloudflare',
  skipDraftBuildsTitle: 'Spring over opbygning for ventende versioner',
  skipDraftBuilds:
    'Når du gemmer ændringer, der venter på at blive udgivet, bygges hjemmesiden kun med editorens kontroller. For at springe den opbygning over skal du åbne hjemmesidens byggeindstillinger i Cloudflare, vælge Build watch paths og under Exclude paths tilføje src/drafts/**. Kun du kan ændre det i Cloudflare.',
  buildSettingsNotLoaded: (error) => `Indstillingerne for bygning kunne ikke hentes: ${error}`,
  place: 'R2-placering',
  placeHint: 'Kan kun skiftes, når R2-caching er slået fra.',
  placeAuto: 'Automatisk',
  onWhenBuilt: 'Slås til, når hjemmesiden er opdateret.',
  offWhenBuilt: 'Slås fra, når hjemmesiden er opdateret.',
  loading: 'Henter indstillingerne…',
  notLoaded: (error) => `Indstillingerne kunne ikke hentes: ${error}`,
  noSettings: 'Hjemmesiden har ingen indstillinger til editoren',
  noLine: 'Hjemmesidens indstillinger har ingen plads til R2-caching',
  r2CachingCommit: (on) => (on ? 'Editor: slå R2-caching til' : 'Editor: slå R2-caching fra'),
  contentOnlyBuildsCommit: (on) => (on ? 'Editor: slå bygning kun af indhold til' : 'Editor: slå bygning kun af indhold fra'),
  paidBuildsCommit: (on) => (on ? 'Editor: slå betalt bygning til' : 'Editor: slå betalt bygning fra'),
  placeCommit: (jurisdiction) =>
    jurisdiction ? `Editor: hold R2-cachingens bucket i ${jurisdiction}` : 'Editor: lad Cloudflare placere R2-cachingens bucket',
};
