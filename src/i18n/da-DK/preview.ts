import type { Messages } from '../en-US';

export const preview: Messages['preview'] = {
  button: 'Forhåndsvis',
  title: 'Forhåndsvisning',
  device: 'Vis som',
  phone: 'Telefon',
  computer: 'Computer',
  making: 'Forhåndsvisningen laves…',
  failed: (error) => `Kunne ikke oprette forhåndsvisningen: ${error}`,
  notHere: 'Den side kan ikke forhåndsvises.',
  pageNotLoaded: (status) => `Siden svarede ${status}.`,
};
