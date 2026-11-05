// "Forhåndsvis" beside "Gem ændringer" and in the top bar (FormFrame.tsx): the page with what is in the
// form now, in a sheet (pagePreview.tsx).
export const preview = {
  /** The button, the icon in the top bar, and the sheet. */
  button: 'Preview',
  title: 'Preview',
  /** How wide the page is shown: Material 3's window sizes, each at its narrowest. */
  size: 'Window size',
  sizes: { compact: 'Compact', medium: 'Medium', expanded: 'Expanded', large: 'Large', extraLarge: 'Extra-large' },
  /** The preview of a part every page has (partPreview.tsx, the header): on a phone and on a computer. */
  phone: 'Phone',
  computer: 'Computer',
  making: 'Loading the preview…',
  failed: (error: string) => `Couldn’t create the preview: ${error}`,
  notHere: 'That page can’t be previewed',
  pageNotLoaded: (status: number) => `The page couldn’t be loaded, error ${status}`,
};
