import type { Messages } from '../en-US';

export const assistants: Messages['assistants'] = {
  intro: 'Forbind en assistent som Claude, så den kan læse din hjemmeside. Den kan ikke ændre noget.',
  connectTitle: 'Forbind',
  connectText: 'Tilføj en forbindelse med denne adresse i din assistent. Log ind med GitHub, og tryk på Tillad.',
  address: 'Adresse',
  copy: 'Kopiér adresse',
  copied: 'Adressen er kopieret',
  connectedTitle: 'Forbundne assistenter',
  none: 'Ingen assistenter er forbundet.',
  loading: 'Henter assistenter…',
  by: (login) => `Forbundet af ${login}`,
  lastUsed: (when) => `Sidst brugt ${when}`,
  neverUsed: 'Ikke brugt endnu',
  disconnect: 'Afbryd',
  disconnectAsk: (name) => `Afbryd ${name}? Den kan ikke læse din hjemmeside, før du forbinder den igen.`,
  notReady: 'Assistenter er ikke slået til på hjemmesiden endnu. Bed den, der passer hjemmesiden, om at tilføje MCP_VAULT_KEY.',
  failed: 'Kunne ikke få forbindelse til din hjemmeside. Prøv igen.',
  forbidden: 'Kun personer, der kan redigere hjemmesiden, kan gøre dette.',
};
