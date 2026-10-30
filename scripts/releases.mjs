// What of the apps and themes in the app store is released and what is not yet (store-release.mjs, check-content.mjs).
// The catalog (store/catalog.json) is what is released: an app or a theme is released when the owner asks for it, with
// `npm run store:release -- <id>`, not by each merge. Between two releases, what is changed in its folder waits for the
// next one under the next version, given once: the next patch, minor or major release after the one in the catalog
// (whichever the changes together are), with one release note saying all that is new in it.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const git = (args, input) => execFileSync('git', args, { encoding: 'utf8', input }).trim();
const parts = (v) => v.split('.').map((n) => Number.parseInt(n, 10) || 0);

/** Whether a version is newer than another (as `newer` in packages/editor/src/store.ts). */
function newer(a, b) {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
}

/** The versions that can follow one: its next patch, minor and major release ("1.2.1": 1.2.2, 1.3.0, 2.0.0). */
export function nextVersions(version) {
  const [x, y, z] = parts(version);
  return [`${x}.${y}.${z + 1}`, `${x}.${y + 1}.0`, `${x + 1}.0.0`];
}

/** A folder's files as they are now, committed or not (but those git ignores and its store.json), by their path in it,
 * with their blob ids. */
function filesNow(folder) {
  const paths = git(['ls-files', '-co', '--exclude-standard', '--', folder])
    .split('\n')
    .filter((p) => p && p !== `${folder}/store.json` && existsSync(p));
  const oids = paths.length ? git(['hash-object', '--stdin-paths'], paths.join('\n')).split('\n') : [];
  return new Map(paths.map((p, i) => [p.slice(folder.length + 1), oids[i]]));
}

/** Whether a folder is not as its entry in the catalog has it (another file, one more or one less). */
export function changedSince(folder, entry) {
  const now = filesNow(folder);
  return now.size !== entry.files.length || entry.files.some((f) => now.get(f.path) !== f.oid);
}

/** What is wrong with the version of an app or a theme of the store against what the catalog has released of it.
 * `item`: `kind` ('apps' or 'themes'), `id`, `folder`, `version`, `notes` (its release notes by version, one object
 * for each language it writes them in, by the language: [[null, notes]] for an app) and `where` (the file with its
 * version). One never released can have any version. */
export function releaseProblems(catalog, item) {
  const entry = catalog[item.kind]?.find((x) => x.id === item.id);
  if (!entry) return [];
  const { version, where, folder } = item;
  const released = entry.version;
  if (newer(released, version))
    return [`${where}: version ${version} er lavere end ${released}, som er udgivet. En udgivet version sættes aldrig ned.`];
  if (!changedSince(folder, entry))
    return version === released
      ? []
      : [`${where}: version ${version}, men intet i ${folder} er ændret, siden ${released} blev udgivet. Sæt den tilbage til ${released}.`];
  const next = nextVersions(released);
  const problems = [];
  if (version === released)
    problems.push(
      `${where}: ${folder} er ændret, siden ${released} blev udgivet, så den skal have den næste version, ${next.join(', ')} (efter, hvad ændringerne er), med en release note. Den udgives først, når ejeren beder om det.`,
    );
  else if (!next.includes(version))
    problems.push(
      `${where}: version ${version} følger ikke ${released}, som er udgivet. Mellem to udgivelser får den den næste version én gang: ${next.join(', ')}, og det nye står i dens ene release note.`,
    );
  else
    for (const [language, notes] of item.notes)
      if (!notes?.[version]) problems.push(`${where}: version ${version} har ingen release note${language ? ` på ${language}` : ''}.`);
  for (const [language, notes] of item.notes)
    for (const v of Object.keys(notes ?? {}))
      if (v !== version && newer(v, released))
        problems.push(
          `${where}: release noten til ${v}${language ? ` (${language})` : ''} er til en version, der aldrig blev udgivet. Skriv det i noten til ${version}.`,
        );
  return problems;
}

/** An app's or a theme's release notes as releaseProblems takes them. */
export const notesOf = (releaseNotes, byLanguage) =>
  byLanguage && Object.keys(releaseNotes ?? {}).length ? Object.entries(releaseNotes) : [[null, releaseNotes ?? {}]];
