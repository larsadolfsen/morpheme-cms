import type { Messages } from '../en-US';

export const company: Messages['company'] = {
  noChanges: 'Der er ingen ændringer at gemme',
  preview: 'Forhåndsvisning',
  brand: {
    notLoaded: (error) => `Kunne ikke hente logoet: ${error}`,
    notLoadedYet: 'Logoet og faviconet er ikke hentet endnu. Vent et øjeblik, eller genindlæs siden.',
    solid: 'Logoet skal have gennemsigtig baggrund. Brug PNG eller SVG.',
    logo: 'Logo',
    logoHint: 'SVG eller PNG med gennemsigtig baggrund.',
    newLogo: 'Skift logo',
    icon: 'Favicon',
    iconHint: 'Ikonet i browserfanen.',
    newIcon: 'Skift favicon',
    iconFromLogo: 'Opret ud fra logo',
    svgUnreadable: 'SVG-filen kunne ikke læses',
    cannotOpen: 'Billedet kunne ikke åbnes. Brug et SVG-, PNG-, JPEG- eller WebP-billede.',
    notReady: 'Billedet kunne ikke klargøres',
  },
  commit: {
    edit: (part) => `Editor: ret ${part}`,
    brand: (logo, icon) => `Editor: nyt ${[logo && 'logo', icon && 'favicon'].filter(Boolean).join(' og ')}`,
  },
};
