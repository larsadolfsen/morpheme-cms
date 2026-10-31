// "Virksomheden" and "Blokke" (CompanyForm.tsx), and "Udseende" › "Logo og ikon" (BrandForm.tsx, brand.ts).
export const company = {
  noChanges: 'There are no changes to save',
  preview: 'Preview',
  brand: {
    notLoaded: (error: string) => `Couldn’t load the logo: ${error}`,
    notLoadedYet: 'The logo and icon haven’t loaded yet. Wait a moment, or reload the page.',
    solid: 'The logo needs a transparent background. Use PNG or SVG.',
    logo: 'Logo',
    logoHint: 'SVG or PNG with a transparent background.',
    newLogo: 'Choose a new logo',
    icon: 'Icon',
    newIcon: 'Choose a new icon',
    iconFromLogo: 'Create the icon from the logo',
    /** brand.ts */
    svgUnreadable: 'The SVG file couldn’t be read',
    cannotOpen: 'The picture couldn’t be opened. Use an SVG, PNG, JPEG, or WebP picture.',
    notReady: 'The picture couldn’t be prepared',
  },
  /** The commits, in the site's language (siteT). */
  commit: {
    edit: (part: string) => `Editor: edit ${part}`,
    brand: (logo: boolean, icon: boolean) => `Editor: new ${[logo && 'logo', icon && 'icon'].filter(Boolean).join(' and ')}`,
  },
};
