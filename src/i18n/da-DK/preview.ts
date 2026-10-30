// "Forhåndsvis" beside "Gem ændringer" and in the top bar (FormFrame.tsx): the page with what is in the
// form now, in a sheet (pagePreview.tsx).
export const preview = {
  /** The button, the icon in the top bar, and the sheet. */
  button: 'Forhåndsvis',
  title: 'Forhåndsvisning',
  /** How wide the page is shown. */
  device: 'Vis som',
  phone: 'Telefon',
  computer: 'Computer',
  making: 'Forhåndsvisningen laves…',
  failed: (error: string) => `Kunne ikke oprette forhåndsvisningen: ${error}`,
  notHere: 'Den side kan ikke forhåndsvises.',
  pageNotLoaded: (status: number) => `Siden svarede ${status}.`,
};
