import type { Messages } from '../en-US';

export const advanced: Messages['advanced'] = {
  r2Caching: 'Hurtigere editor',
  r2CachingHint: 'Editoren henter hjemmesidens filer hurtigere og spørger kun GitHub om det, der er ændret.',
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
  builds: 'Opdatering af hjemmesiden',
  fastContentBuilds: 'Hurtigere opdateringer af indhold',
  fastContentBuildsHint: 'Hjemmesiden bliver opdateret hurtigere, når du kun har ændret indhold.',
  paidBuilds: 'Workers Paid-plan',
  paidBuildsHint: 'Slå til, når Cloudflare-kontoen har Workers Paid.',
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
  buildSettingsNotLoaded: (error) => `Indstillingerne for opdatering af hjemmesiden kunne ikke hentes: ${error}`,
  place: 'Placering',
  placeHint: 'Kan kun skiftes, når Hurtigere editor er slået fra.',
  placeAuto: 'Automatisk',
  onWhenBuilt: 'Slås til, når hjemmesiden er opdateret.',
  offWhenBuilt: 'Slås fra, når hjemmesiden er opdateret.',
  loading: 'Henter indstillingerne…',
  notLoaded: (error) => `Indstillingerne kunne ikke hentes: ${error}`,
  noSettings: 'Hjemmesiden har ingen indstillinger til editoren',
  noLine: 'Hjemmesidens indstillinger har ingen plads til Hurtigere editor',
  r2CachingCommit: (on) => (on ? 'Editor: slå R2-caching til' : 'Editor: slå R2-caching fra'),
  fastContentBuildsCommit: (on) => (on ? 'Editor: slå hurtig bygning af indhold til' : 'Editor: slå hurtig bygning af indhold fra'),
  paidBuildsCommit: (on) => (on ? 'Editor: slå betalt bygning til' : 'Editor: slå betalt bygning fra'),
  placeCommit: (jurisdiction) =>
    jurisdiction ? `Editor: hold R2-cachingens bucket i ${jurisdiction}` : 'Editor: lad Cloudflare placere R2-cachingens bucket',
};
