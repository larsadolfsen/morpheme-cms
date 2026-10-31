// "Forhåndsvis" beside "Gem ændringer" and in the top bar (FormFrame.tsx): the page with what is in the
// form now, in a sheet (pagePreview.tsx).
export const preview = {
  /** The button, the icon in the top bar, and the sheet. */
  button: 'Preview',
  title: 'Preview',
  /** How wide the page is shown. */
  device: 'Show as',
  phone: 'Phone',
  computer: 'Computer',
  making: 'Making the preview…',
  failed: (error: string) => `Couldn’t create the preview: ${error}`,
  notHere: 'That page can’t be previewed',
  pageNotLoaded: (status: number) => `The page answered ${status}`,
};
