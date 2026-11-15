// "Business" and "Blocks" (CompanyForm.tsx), and "Appearance" › "Logo and favicon" (BrandForm.tsx, brand.ts).
export const company = {
  noChanges: 'There are no changes to save',
  preview: 'Preview',
  brand: {
    notLoaded: (error: string) => `Couldn’t load the logo: ${error}`,
    notLoadedYet: 'The logo and favicon haven’t loaded yet. Wait a moment, or reload the page.',
    solid: 'The logo needs a transparent background. Use PNG or SVG.',
    logo: 'Logo',
    logoHint: 'SVG or PNG with a transparent background.',
    newLogo: 'Change logo',
    icon: 'Favicon',
    iconHint: 'The icon in the browser tab.',
    newIcon: 'Change favicon',
    iconFromLogo: 'Create from logo',
    /** brand.ts */
    svgUnreadable: 'The SVG file couldn’t be read',
    cannotOpen: 'The image couldn’t be opened. Use an SVG, PNG, JPEG, or WebP image.',
    notReady: 'The image couldn’t be prepared',
  },
  /** The commits, in the site's language (siteT). */
  commit: {
    edit: (part: string) => `Editor: edit ${part}`,
    brand: (logo: boolean, icon: boolean) => `Editor: new ${[logo && 'logo', icon && 'favicon'].filter(Boolean).join(' and ')}`,
  },
};
