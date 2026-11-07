// A minor line's own page (#morpheme/<line>, e.g. #morpheme/0.13), from "Earlier versions" on the Morpheme page:
// "Morpheme 0.13" with the notes of each of its versions (ReleaseNotes), newest first. Exposes VersionLinePage and
// EarlierVersions (the rows to these pages). Depends on bundledNotes.ts (runningNotes, runningLine) and
// lib/releaseNotes.mjs (versionLines).
import Screen from './Screen';
import { CMS_ROUTE } from './CmsPage';
import { ReleaseNotes } from './ReleaseNotes';
import { EmptyNote, Group, ListItem } from './ui';
import { runningLine, runningNotes } from './bundledNotes';
import { versionLines } from '../lib/releaseNotes.mjs';
import { t } from './i18n';

/** The lines older than the running one, newest first. */
const earlier = () => versionLines(runningNotes).filter(({ line }) => line !== runningLine);

/** "Earlier versions": a row per older minor line, with how many versions it has, to its page. */
export function EarlierVersions() {
  const lines = earlier();
  if (!lines.length) return null;
  return (
    <Group title={t.cms.earlierVersions}>
      {lines.map(({ line, entries }) => (
        <ListItem
          key={line}
          href={`#${CMS_ROUTE}/${line}`}
          headline={t.library.cmsVersion(line)}
          supporting={t.cms.versionCount(entries.length)}
          arrow
        />
      ))}
    </Group>
  );
}

export function VersionLinePage({ line }: { line: string }) {
  const found = earlier().find((x) => x.line === line);
  return (
    <Screen title={t.library.cmsVersion(line)} back={{ href: `#${CMS_ROUTE}`, label: t.common.parts.morpheme }}>
      {found ? <ReleaseNotes entries={found.entries} /> : <EmptyNote>{t.cms.lineNotFound}</EmptyNote>}
    </Screen>
  );
}
