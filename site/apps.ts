// The apps on the site (src/apps/<app>/, packages/editor/src/apps.ts): which are installed under
// "Indstillinger" › "Apps" in the editor (apps.json), and each app's settings (apps/<app>.json), as the
// site's build reads them. What an app puts on every page (AppSlot.astro) is there only while it is
// installed; what was made with it (a pop-up, a block on a page) stays when it is uninstalled.
import data from '@data/apps.json';

/** The ids of the apps installed. */
export const installed: string[] = Array.isArray(data.installed) ? data.installed.map(String) : [];

// Each app's saved settings, by its id (the file's name).
const saved = Object.fromEntries(
  Object.entries(import.meta.glob<Record<string, unknown>>('@data/apps/*.json', { eager: true, import: 'default' })).map(
    ([file, values]) => [file.replace(/^.*\/|\.json$/g, ''), values],
  ),
);

/** An app's settings as saved in the editor, over those it starts with (its settings.ts `values`). */
export const settingsOf = (id: string, values: Record<string, unknown> = {}): Record<string, any> => ({
  ...values,
  ...saved[id],
});
