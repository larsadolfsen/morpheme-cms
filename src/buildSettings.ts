// The build settings the editor writes under Settings › Developer › Caching and builds (Advanced.tsx): src/data/build.json, read by
// the build (content-only lane) and by the editor's wait for a build. Exposes buildSettingsOf and withBuildSetting; the
// defaults come from packages/editor/lib/build-settings.mjs.
import { readBuildSettings } from '../lib/build-settings.mjs';

export type BuildSettings = { contentLane: boolean; paidBuilds: boolean };
export type BuildSetting = keyof BuildSettings;

/** The settings in the file's text, with the defaults filled in; a missing file (undefined) or text that is not JSON gives the defaults. */
export function buildSettingsOf(text: string | undefined): BuildSettings {
  try {
    return readBuildSettings(text === undefined ? undefined : JSON.parse(text));
  } catch {
    return readBuildSettings(undefined);
  }
}

/** The file's text with one setting changed; both settings are written, as the file is read with the defaults. */
export const withBuildSetting = (text: string | undefined, key: BuildSetting, value: boolean): string =>
  `${JSON.stringify({ ...buildSettingsOf(text), [key]: value }, null, 2)}\n`;
