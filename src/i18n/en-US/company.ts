import type { Messages } from '../da-DK';

export const company: Messages['company'] = {
  noChanges: 'There are no changes to save.',
  preview: 'Preview',
  brand: {
    notLoaded: (error) => `Could not load the logo: ${error}`,
    notLoadedYet: 'The logo and icon have not loaded yet. Wait a moment, or reload the page.',
    solid: 'The logo needs a transparent background. Use PNG or SVG.',
    logo: 'Logo',
    logoHint: 'SVG or PNG with a transparent background.',
    newLogo: 'Choose a new logo',
    icon: 'Icon',
    newIcon: 'Choose a new icon',
    iconFromLogo: 'Create the icon from the logo',
    svgUnreadable: 'The SVG file could not be read.',
    cannotOpen: 'The picture could not be opened. Use an SVG, PNG, JPEG or WebP picture.',
    notReady: 'The picture could not be prepared.',
  },
  commit: {
    edit: (part) => `Editor: edit ${part}`,
    brand: (logo, icon) => `Editor: new ${[logo && 'logo', icon && 'icon'].filter(Boolean).join(' and ')}`,
  },
};
