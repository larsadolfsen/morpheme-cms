// "Assistants" under "Settings" (Assistants.tsx): the assistants, such as Claude, that are connected to the site and can read it.
export const assistants = {
  intro: 'Connect an assistant such as Claude, so it can read your website. It can’t change anything.',
  /** The group with the address to give the assistant. */
  connectTitle: 'Connect',
  connectText: 'In your assistant, add a connector with this address. Sign in with GitHub, then tap Allow.',
  address: 'Address',
  copy: 'Copy address',
  copied: 'Address copied',
  /** The group with the assistants that are connected. */
  connectedTitle: 'Connected assistants',
  none: 'No assistants are connected.',
  loading: 'Loading assistants…',
  by: (login: string) => `Connected by ${login}`,
  lastUsed: (when: string) => `Last used ${when}`,
  neverUsed: 'Not used yet',
  disconnect: 'Disconnect',
  disconnectAsk: (name: string) => `Disconnect ${name}? It can’t read your website until you connect it again.`,
  notReady: 'Assistants aren’t switched on for this website yet. Ask whoever looks after the website to add MCP_VAULT_KEY.',
  failed: 'Couldn’t reach your website. Try again.',
  forbidden: 'Only people who can edit the website can do this.',
};
