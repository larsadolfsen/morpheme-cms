// "Virksomheden" and "Blokke" (CompanyForm.tsx), and "Udseende" › "Logo og ikon" (BrandForm.tsx, brand.ts).
export const company = {
  noChanges: 'Der er ingen ændringer at gemme.',
  preview: 'Forhåndsvisning',
  brand: {
    notLoaded: (error: string) => `Kunne ikke hente logoet: ${error}`,
    notLoadedYet: 'Logoet og ikonet er ikke hentet endnu. Vent et øjeblik, eller genindlæs siden.',
    solid: 'Logoet skal have gennemsigtig baggrund. Brug PNG eller SVG.',
    logo: 'Logo',
    logoHint: 'SVG eller PNG med gennemsigtig baggrund.',
    newLogo: 'Vælg et nyt logo',
    icon: 'Ikon',
    newIcon: 'Vælg et nyt ikon',
    iconFromLogo: 'Opret ikonet ud fra logoet',
    /** brand.ts */
    svgUnreadable: 'SVG-filen kunne ikke læses.',
    cannotOpen: 'Billedet kunne ikke åbnes. Brug et SVG-, PNG-, JPEG- eller WebP-billede.',
    notReady: 'Billedet kunne ikke klargøres.',
  },
  /** The commits, in the site's language (siteT). */
  commit: {
    edit: (part: string) => `Editor: ret ${part}`,
    brand: (logo: boolean, icon: boolean) => `Editor: nyt ${[logo && 'logo', icon && 'ikon'].filter(Boolean).join(' og ')}`,
  },
};
