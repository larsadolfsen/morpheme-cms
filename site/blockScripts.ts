// What the blocks do in a browser on the site: script.ts in a theme's blocks/<type>/ (the rows that fold out, the
// testimonials' "Læs mere" …; the theme in use's, else the standard theme's, as their look, sites.ts), what the theme's
// UI components do (ui/<name>.script.ts: a carousel's page indicator, by `ui/<name>`), in an app's
// block (src/apps/<app>/blocks/<type>/), and in an app's part of a list's entries (src/apps/<app>/<list>/: Mailchimp's
// signup in a pop-up). Each is a function that finds its blocks on the page and does nothing without them; the theme's
// Base.astro runs them all on every page, so they also work where a site or an app shows a block's parts of its own
// (this site's front page).
type Script = () => void;

const byType = (found: Record<string, Script>) =>
  Object.fromEntries(Object.entries(found).map(([file, run]) => [file.split('/').at(-2)!, run]));

// The theme's UI components' by their name (ui/carousel.script.ts: ui/carousel).
const byUi = (found: Record<string, Script>) =>
  Object.fromEntries(Object.entries(found).map(([file, run]) => [`ui/${file.split('/').at(-1)!.replace('.script.ts', '')}`, run]));

/** What each block does in a browser, by its type. */
export const blockScripts: Record<string, Script> = {
  ...byType(import.meta.glob<Script>('@saturn/blocks/*/script.ts', { eager: true, import: 'default' })),
  ...byType(import.meta.glob<Script>('@theme/blocks/*/script.ts', { eager: true, import: 'default' })),
  ...byUi(import.meta.glob<Script>('@saturn/ui/*.script.ts', { eager: true, import: 'default' })),
  ...byUi(import.meta.glob<Script>('@theme/ui/*.script.ts', { eager: true, import: 'default' })),
  ...byType(import.meta.glob<Script>('/src/apps/*/blocks/*/script.ts', { eager: true, import: 'default' })),
  // An app's part of its kind of a list's entries (Mailchimp's signup in a pop-up), by the app and the list.
  ...Object.fromEntries(
    Object.entries(import.meta.glob<Script>('/src/apps/*/*/script.ts', { eager: true, import: 'default' })).map(([file, run]) => [
      file.split('/').slice(-3, -1).join('/'),
      run,
    ]),
  ),
};
