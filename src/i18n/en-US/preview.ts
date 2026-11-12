// "Preview" beside "Save changes" and in the top bar (FormFrame.tsx): the page with what is in the
// form now, full screen (pagePreview.tsx).
export const preview = {
  /** The button, the icon in the top bar, and the screen. */
  button: 'Preview',
  title: 'Preview',
  /** How wide the page is shown: Material 3's window sizes, each at its narrowest. */
  size: 'Window size',
  sizes: { compact: 'Compact', medium: 'Medium', expanded: 'Expanded', large: 'Large', extraLarge: 'Extra-large' },
  /** The handle at the page's edges, and the width shown as a number with the size's name. */
  pageWidth: 'Page width',
  current: (width: number, size: string) => `${width} pixels, ${size}`,
  /** The preview of a part every page has (partPreview.tsx, the header): on a phone and on a computer. */
  phone: 'Phone',
  computer: 'Computer',
  making: 'Loading the preview…',
  failed: (error: string) => `Couldn’t create the preview: ${error}`,
  notHere: 'That page can’t be previewed',
  pageNotLoaded: (status: number) => `The page couldn’t be loaded, error ${status}`,
};
