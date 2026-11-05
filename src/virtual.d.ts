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
