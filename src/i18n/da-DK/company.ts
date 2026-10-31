import type { Messages } from '../en-US';

export const company: Messages['company'] = {
  noChanges: 'Der er ingen ændringer at gemme.',
  preview: 'Forhåndsvisning',
  brand: {
    notLoaded: (error) => `Kunne ikke hente logoet: ${error}`,
    notLoadedYet: 'Logoet og ikonet er ikke hentet endnu. Vent et øjeblik, eller genindlæs siden.',
    solid: 'Logoet skal have gennemsigtig baggrund. Brug PNG eller SVG.',
    logo: 'Logo',
    logoHint: 'SVG eller PNG med gennemsigtig baggrund.',
    newLogo: 'Vælg et nyt logo',
    icon: 'Ikon',
    newIcon: 'Vælg et nyt ikon',
    iconFromLogo: 'Opret ikonet ud fra logoet',
    svgUnreadable: 'SVG-filen kunne ikke læses.',
    cannotOpen: 'Billedet kunne ikke åbnes. Brug et SVG-, PNG-, JPEG- eller WebP-billede.',
    notReady: 'Billedet kunne ikke klargøres.',
  },
  commit: {
    edit: (part) => `Editor: ret ${part}`,
    brand: (logo, icon) => `Editor: nyt ${[logo && 'logo', icon && 'ikon'].filter(Boolean).join(' og ')}`,
  },
};
