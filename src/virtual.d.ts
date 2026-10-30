// What is in each app's folder (appFoldersPlugin in lib/apps.mjs): its files, by their paths in it, and its csp.json.
declare module 'virtual:app-folders' {
  const folders: Record<string, { files: string[]; csp?: Partial<Record<string, string[]>> }>;
  export default folders;
}
