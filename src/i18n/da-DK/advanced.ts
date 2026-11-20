import type { Messages } from '../en-US';

export const advanced: Messages['advanced'] = {
  r2Caching: 'R2-caching',
  r2CachingHint:
    'Gemmer en kopi af hjemmesidens filer i R2, så editoren kun spørger GitHub om det, der er ændret. Automatisk gemning kræver den.',
  checking: 'Tjekker, om Cloudflare er klar…',
  bucket: {
    ready: (bucket, jurisdiction) => `R2-bucketen ${bucket} er klar hos Cloudflare${jurisdiction ? ` i ${jurisdiction}` : ''}.`,
    'no-bucket': (bucket, jurisdiction) =>
      `Kan slås til, når R2-bucketen ${bucket} er lavet hos Cloudflare${jurisdiction ? ` og ligger i ${jurisdiction}` : ''}.`,
    'no-r2': () => 'Kan slås til, når R2 er slået til hos Cloudflare.',
    'no-key': () => 'Editoren har intet Cloudflare API-token, så den kan ikke se, om R2 er slået til.',
    refused: () => 'Cloudflare godtog ikke editorens API-token til R2.',
    failed: () => 'Cloudflare svarede ikke på, om R2 er klar. Prøv igen senere.',
  },
  builds: 'Builds',
  contentOnlyBuilds: 'Builds kun med indhold',
  contentOnlyBuildsHint:
    'Når kun indhold er ændret, springer buildet hjemmesidens fulde tjek over. Slå fra for at køre alle tjek hver gang.',
  paidBuilds: 'Workers Paid-plan',
  paidBuildsHint: 'Editoren venter 10 minutter på et build i stedet for 20. Slå til, når Cloudflare-kontoen har Workers Paid.',
  plan: {
    no: 'Kan slås til, når Cloudflare-kontoen har Workers Paid.',
    'no-key': 'Editoren har intet Cloudflare API-token, så den kan ikke se, om kontoen har Workers Paid.',
    refused: 'Cloudflare lod ikke editorens API-token læse kontoens plan. API-tokenet skal have Billing: Read.',
    failed: 'Cloudflare svarede ikke på, om kontoen har Workers Paid. Prøv igen senere.',
  },
  billing: 'Åbn betaling hos Cloudflare',
  skipDraftBuildsTitle: 'Spring build over for ventende versioner',
  skipDraftBuilds:
    'Når du gemmer ændringer, der venter på at blive udgivet, bygges hjemmesiden kun med editorens kontroller. For at springe det build over skal du åbne hjemmesidens build-indstillinger i Cloudflare, vælge Build watch paths og under Exclude paths tilføje src/drafts/**. Kun du kan ændre det i Cloudflare.',
  buildSettingsNotLoaded: (error) => `Indstillingerne for builds kunne ikke hentes: ${error}`,
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
  contentOnlyBuildsCommit: (on) => (on ? 'Editor: slå builds kun med indhold til' : 'Editor: slå builds kun med indhold fra'),
  paidBuildsCommit: (on) => (on ? 'Editor: slå Workers Paid til' : 'Editor: slå Workers Paid fra'),
  placeCommit: (jurisdiction) =>
    jurisdiction ? `Editor: hold R2-cachingens bucket i ${jurisdiction}` : 'Editor: lad Cloudflare placere R2-cachingens bucket',
};
