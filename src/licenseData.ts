// The licences of the third-party work the site and the editor are made with ("Licenses" under "Settings",
// Licenses.tsx), as the build finds them (/editor/licenses.json, licensesIntegration in packages/editor/lib/licenses.mjs),
// what an app (defineApp) and a theme (theme.json) declare (their own licence and the third-party work they bring), and
// what the store's catalog has of them (scripts/store-release.mjs, storeLicenses). Also splits the CMS's own licence out
// of the works the editor and the site bring (splitCms), to be shown first. Depends on PACKAGE (lib/cms-version.mjs).
import { PACKAGE } from '../lib/cms-version.mjs';

/** What a third-party work is to the site: a font, icons, code (a library, also styles) or pictures. */
export type LicenseKind = 'font' | 'icons' | 'library' | 'image';

/** A third-party work an app or a theme brings, as it declares it (`thirdParty`): an npm package it imports (its
 * version, who made it, its licence and its text are its folder's; `author`, and `file`, a file in the app's or the
 * theme's folder with the licence's text, for a package that has neither); or another work (a font or pictures in its
 * folder), with its name, who made it, its licence's name and the file in its folder with its text. A theme's icon
 * packs (icon-packs/) are not declared here: each pack's manifest says its licence. */
export type ThirdParty =
  | { package: string; kind: LicenseKind; author?: string; file?: string }
  | { name: string; version?: string; author: string; license: string; file: string; kind: LicenseKind };

/** The licence of one's own work that grants nothing ("all rights reserved"), as npm writes it. */
export const UNLICENSED = 'UNLICENSED';

/** Who brings a work: the editor, the site's own code, or an app or a theme (`app/<id>`, `theme/<id>`, LicenseOwner.id). */
export type LicenseWhere = 'editor' | 'site' | `app/${string}` | `theme/${string}`;

/** A third-party work as the build found it: its id (a package's name; `icons/<id>` for an icon set; `<owner>/<name>`
 * for another work an app or a theme declares), its name, version, who made it, its licence's name and text (`standard`:
 * the licence's standard text, as the package has none of its own), what it is, who brings it (`where`, none for an
 * icon set or a work only an app or a theme not in use brings) and through which packages (`via`, when the site does not
 * import it itself). `shipped: false`: brought by an app or a theme the site is built with, but not in what is downloaded (the Worker's, the
 * build's). */
export type LicensedWork = {
  id: string;
  name: string;
  version: string | null;
  author: string;
  license: string;
  text: string;
  standard?: boolean;
  kind: LicenseKind;
  where: LicenseWhere[];
  via?: string[];
  shipped?: false;
};

/** An app or a theme with its own licence (`text`: LICENSE in its folder, none when it is UNLICENSED) and the works it
 * brings (their ids: those it declares, and those shipped through them alone), and whether the site is built with it. */
export type LicenseOwner = {
  id: `app/${string}` | `theme/${string}`;
  kind: 'app' | 'theme';
  /** Its folder's name in src/apps/ or src/themes/. */
  key: string;
  name: string;
  version: string | null;
  author: string;
  license: string;
  text: string | null;
  works: string[];
  inUse: boolean;
};

/** What the build wrote (/editor/licenses.json). */
export type LicensesFile = { works: LicensedWork[]; owners: LicenseOwner[] };

/** A work an app or a theme declares, as the store's catalog has it: without its text. */
export type StoreLicense = Pick<LicensedWork, 'name' | 'version' | 'author' | 'license' | 'kind'>;

/** An app's or a theme's licences as the store's catalog has them: its own licence's name and what it brings. */
export type StoreLicenses = { license: string; works: StoreLicense[] };

// The file, fetched once each time the editor opens: undefined while it loads, null when there is none (the site is not
// built since it came, or the editor is offline).
let loaded: Promise<LicensesFile | null> | undefined;

/** The licences as the site was last built (/editor/licenses.json). */
export function loadLicenses(): Promise<LicensesFile | null> {
  loaded ??= fetch('/editor/licenses.json', { cache: 'no-store' })
    .then((res) => (res.ok ? (res.json() as Promise<LicensesFile>) : null))
    .catch(() => null);
  return loaded;
}

/** The works the editor and the site bring, split in the CMS's own licence (the work with the CMS's package name, none
 * when the build did not find it) and the rest, which keeps its order. */
export function splitCms<W extends Pick<LicensedWork, 'id'>>(works: W[]): { cms: W | null; rest: W[] } {
  return { cms: works.find((w) => w.id === PACKAGE) ?? null, rest: works.filter((w) => w.id !== PACKAGE) };
}

/** The CMS's name in its own licence row ("Morpheme CMS itself"); a product name, so it is not translated. */
export const CMS_NAME = 'Morpheme CMS';
