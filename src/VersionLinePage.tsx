// A minor line's own page (#morpheme/<line>, e.g. #morpheme/0.13), from "Earlier versions" on the Morpheme page:
// "Morpheme 0.13" with the notes of each of its versions (ReleaseNotes), newest first, and at the bottom arrows to the
// newer and the older line. Exposes VersionLinePage, EarlierVersions (the rows to these pages) and LineNav (the arrows). Depends on bundledNotes.ts (runningNotes, runningLine) and
// lib/releaseNotes.mjs (versionLines).
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import Screen from './Screen';
import { CMS_ROUTE } from './CmsPage';
import { ReleaseNotes } from './ReleaseNotes';
import { EmptyNote, Group, LinkButton, ListItem } from './ui';
import { runningLine, runningNotes } from './bundledNotes';
import { versionLines } from '../lib/releaseNotes.mjs';
import { t } from './i18n';

/** Every line, newest first, and those older than the running one. */
const lines = () => versionLines(runningNotes);
const earlier = () => lines().filter(({ line }) => line !== runningLine);
/** A line's page: the running line's is the Morpheme page. */
const lineHref = (line: string) => (line === runningLine ? `#${CMS_ROUTE}` : `#${CMS_ROUTE}/${line}`);

/** At the bottom of a line's notes: back to the newer line (←) and forward to the older one (→), as "Earlier versions"
 * lists them: small buttons with the line's number ("← 0.14", "→ 0.12"; "Morpheme 0.14" for screen readers), so both
 * fit on a phone, each icon before its label, as Material 3 places it. */
export function LineNav({ line }: { line: string }) {
  const all = lines();
  const at = all.findIndex((x) => x.line === line);
  if (at < 0) return null;
  const newer = all[at - 1];
  const older = all[at + 1];
  if (!newer && !older) return null;
  return (
    <nav aria-label={t.cms.otherVersions} className="mb-8 flex flex-wrap justify-between gap-2 px-4">
      {newer ? (
        <LinkButton kind="outlined" size="small" href={lineHref(newer.line)} icon={ArrowLeft} aria-label={t.library.cmsVersion(newer.line)}>
          {newer.line}
        </LinkButton>
      ) : (
        <span />
      )}
      {older && (
        <LinkButton
          kind="outlined"
          size="small"
          href={lineHref(older.line)}
          icon={ArrowRight}
          aria-label={t.library.cmsVersion(older.line)}
        >
          {older.line}
        </LinkButton>
      )}
    </nav>
  );
}

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
      {found ? (
        <>
          <ReleaseNotes entries={found.entries} />
          <LineNav line={line} />
        </>
      ) : (
        <EmptyNote>{t.cms.lineNotFound}</EmptyNote>
      )}
    </Screen>
  );
}
