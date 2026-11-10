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

// All Phosphor's icons (regular) as text, by their file (allIconsModule in site/theme.mjs).
declare module 'virtual:all-icons' {
  export const allIcons: Record<string, string>;
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
