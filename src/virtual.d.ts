declare module 'virtual:material-symbols' {
  const files: Record<string, string>;
  export default files;
}

declare module 'virtual:material-symbols-ssr' {
  const files: Record<string, string>;
  export default files;
}

// What is in each app's folder (appFoldersPlugin in lib/apps.mjs): its files, by their paths in it, and its csp.json.
declare module 'virtual:app-folders' {
  const folders: Record<string, { files: string[]; csp?: Partial<Record<string, string[]>> }>;
  export default folders;
}

// A loader for the page-colors hook of each app that has no app.json (oldPageColorsModule in lib/apps.mjs).
declare module 'virtual:old-page-colors' {
  const loaders: Record<string, () => Promise<{ default: unknown }>>;
  export default loaders;
}

// The icons of the theme in use and of the icon pack in use, as text by their Material name (`home`, `play_arrow-fill`; themeIconsModule in site/theme.mjs).
declare module 'virtual:theme-icons' {
  export const themeIcons: Record<string, string>;
}

// How the theme in use covers Material's parts, null for the standard theme (coverageModule in site/themeCoverageFiles.mjs).
declare module 'virtual:theme-coverage' {
  const coverage: {
    theme: string;
    parts: Record<string, { group: 'ui' | 'frame'; status: 'own' | 'partly' | 'material'; pieces: number; missing: string[] }>;
  } | null;
  export default coverage;
}

// The id of the app whose folder the importing file is in (appSelf in site/appSelf.mjs; app contract 3).
declare module '@app/self' {
  const self: { readonly id: string };
  export default self;
}

// What the site's files tell the site settings: the files folders there are, the pages' addresses, the contact page's
// text (detectFacts in lib/siteFacts.mjs, read when the site is built; site/settings.ts).
declare module 'virtual:site-facts' {
  const facts: { dirs: string[]; pageAddresses: string[]; contactText: string };
  export default facts;
}
