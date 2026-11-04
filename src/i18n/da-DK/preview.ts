import type { Messages } from '../en-US';

export const preview: Messages['preview'] = {
  button: 'Forhåndsvis',
  title: 'Forhåndsvisning',
  size: 'Vinduesstørrelse',
  sizes: { compact: 'Kompakt', medium: 'Mellem', expanded: 'Udvidet', large: 'Stor', extraLarge: 'Ekstra stor' },
  making: 'Henter forhåndsvisningen…',
  failed: (error) => `Kunne ikke oprette forhåndsvisningen: ${error}`,
  notHere: 'Den side kan ikke forhåndsvises',
  pageNotLoaded: (status) => `Siden kunne ikke hentes, fejl ${status}`,
};
