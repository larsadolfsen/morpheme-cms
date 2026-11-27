// "Morpheme" (#morpheme), under "Settings": the CMS version the site runs, the notes of its minor line (from the
// package itself, bundledNotes.ts), a newer one with its notes, why it is not taken by itself, and an update's progress (all as text; only the update button is a control), and the site's connection to the
// Morpheme store (MorphemeConnection) as its last group. Exposes CMS_ROUTE and the page. Depends on cmsView.mjs, bundledNotes.ts,
// ReleaseNotes (the notes as an article), MorphemeConnection and the Worker's /api/cms.
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Screen from './Screen';
import { MorphemeConnection } from './MorphemeConnection';
import { ReleaseNotes, type VersionNotes } from './ReleaseNotes';
import { Button, EmptyNote, LinkButton, ListItem, plainListClass, ProblemNote } from './ui';
import { backFrom } from './site';
import { cmsView } from './cmsView.mjs';
import { runningLine, runningNotes } from './bundledNotes';
import { EarlierVersions, LineNav } from './VersionLinePage';
import { minorOf } from '../lib/releaseNotes.mjs';
import { snackbar } from '../lib/snackbar';
import { t } from './i18n';
import { blockedText, unsafePlaces, type Blocked } from './blockedText';
import { when } from './when';
import { materialIcon, type IconComponent as Icon } from './icon';

export const CMS_ROUTE = 'morpheme';

type Problem = 'unreachable' | 'cannot-write' | 'no-token' | 'no-kv' | 'not-managed' | 'slow-undo' | 'no-preview';
type UpdateState = 'trying' | 'waiting' | 'undoing' | 'done' | 'undone' | 'stuck';
type View = {
  running: string;
  checkedAt: string | null;
  latest: string | null;
  notes: VersionNotes[];
  action: 'try-again' | null;
  npmCommand: string | null;
  update: { state: UpdateState; to: string; at: string; buildUrl: string | null } | null;
  failed: { version: string; reason: string; buildUrl: string | null; retryAt: number | null } | null;
  problems: Problem[];
  blocked: Blocked | null;
};
type Status = object;

/** The Worker's error code in words; any other answer says what status it was. */
function errorText(code: unknown, status: number, version = '', detail?: unknown) {
  if (code === 'unsafe-code' && Array.isArray(detail)) return t.cms.blockedUnsafeCode(version, unsafePlaces(detail.map(String)));
  if (code === 'not-set-up') return t.cms.noToken;
  if (code === 'waiting') return t.cms.waiting(version);
  return t.app.githubAnswered(status);
}

/** The Worker's answer (GET /api/cms) as the page shows it, or why it could not be read. */
async function readStatus(): Promise<Status> {
  const res = await fetch('/api/cms', { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errorText(json.error, res.status));
  return json;
}

/** Why the newer version is not installed: it did not build (or not in time, or could not be saved), the website as it was. */
const failedText = (failed: NonNullable<View['failed']>) =>
  failed.reason === 'cannot-merge'
    ? t.cms.failedMerge(failed.version)
    : failed.reason === 'build-failed'
      ? t.cms.failedBuild(failed.version)
      : t.cms.failedNoAnswer(failed.version);

/** The build's page on GitHub, as a text link under a failed or stuck update. */
const BuildLink = ({ href, version }: { href: string | null; version: string }) =>
  href ? (
    <LinkButton kind="text" href={href} target="_blank" rel="noreferrer">
      {t.cms.seeBuild(version)}
    </LinkButton>
  ) : null;

/** A line of the status text, with its icon only where the icon means something (a warning, an update). */
function StatusLine({ icon: Glyph, children }: { icon?: Icon; children: ReactNode }) {
  return (
    <ul className={`${plainListClass} mo-editor-status-line`}>
      <ListItem icon={Glyph} headline={children} lines={3} />
    </ul>
  );
}

/** What the update does now (waiting, done, undone, stuck) and when: text, there is nothing to tap. */
function UpdateStatus({ update }: { update: NonNullable<View['update']> }) {
  const bad = update.state === 'undone' || update.state === 'stuck';
  return (
    <div>
      <StatusLine icon={bad ? materialIcon('error') : undefined}>{t.cms[update.state](update.to)}</StatusLine>
      <p className="mo-editor-small-note">{when(new Date(update.at))}</p>
      {update.state === 'stuck' && <BuildLink href={update.buildUrl} version={update.to} />}
    </div>
  );
}

export default function CmsPage() {
  const [view, setView] = useState<View | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setView(cmsView(await readStatus()) as View);
      setProblem('');
    } catch (e) {
      setProblem((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function update(version: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/cms/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(errorText(json.error, res.status, version, json.detail));
      }
      await load();
    } catch (e) {
      snackbar({ text: (e as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  // The running minor line's versions; the older lines are on pages of their own (EarlierVersions).
  const yourLine = runningNotes.filter((entry) => minorOf(entry.version) === runningLine);
  return (
    <Screen title={t.common.parts.morpheme} back={backFrom(CMS_ROUTE)}>
      {problem && <ProblemNote alert>{problem}</ProblemNote>}
      {!view && !problem && <EmptyNote busy>{t.app.loading}</EmptyNote>}
      {view && (
        <>
          {yourLine.length > 0 && (
            <>
              <ReleaseNotes title={t.cms.newInYourVersion} entries={yourLine} />
              <LineNav line={runningLine} />
            </>
          )}
          <section className="mo-editor-notes">
            <div>
              <p>{t.cms.running(view.running)}</p>
              {!view.latest && <p className="mo-editor-small-note">{t.cms.upToDate}</p>}
              <p className="mo-editor-small-note">{view.checkedAt ? t.cms.checked(when(new Date(view.checkedAt))) : t.cms.notChecked}</p>
            </div>
            {view.update && <UpdateStatus update={view.update} />}
            {view.latest && (
              <div>
                <StatusLine icon={materialIcon('stars')}>{t.cms.available(view.latest)}</StatusLine>
                {view.failed && (
                  <>
                    <StatusLine icon={materialIcon('error')}>{failedText(view.failed)}</StatusLine>
                    {view.failed.retryAt !== null && (
                      <p className="mo-editor-small-note">{t.cms.nextTry(when(new Date(view.failed.retryAt)))}</p>
                    )}
                    <BuildLink href={view.failed.buildUrl} version={view.failed.version} />
                  </>
                )}
              </div>
            )}
            {view.npmCommand && (
              <div>
                <p>{t.cms.needsNpm}</p>
                <p className="mo-editor-small-note">
                  <code>{view.npmCommand}</code>
                </p>
              </div>
            )}
            {(view.blocked?.kind === 'contract' || view.blocked?.kind === 'unsafe-code') && (
              <StatusLine icon={materialIcon('error')}>{blockedText(view.blocked)}</StatusLine>
            )}
            {view.blocked?.kind === 'unsafe-code' && (
              <p className="mo-editor-small-note">
                {view.blocked.lines.map((line) => (
                  <code key={line}>
                    {line}
                    <br />
                  </code>
                ))}
              </p>
            )}
            {view.problems.map((kind) => (
              <StatusLine key={kind} icon={materialIcon('error')}>
                {t.cms[kindText[kind]]}
              </StatusLine>
            ))}
          </section>
          {view.action && view.latest && (
            <Button kind="filled" disabled={busy} onClick={() => void update(view.latest!)}>
              {t.cms.tryAgain}
            </Button>
          )}
          {view.notes.length > 0 && <ReleaseNotes title={t.cms.whatsNew} entries={view.notes} />}
        </>
      )}
      {view && <EarlierVersions />}
      <MorphemeConnection />
    </Screen>
  );
}

const kindText: Record<Problem, 'unreachable' | 'cannotWrite' | 'noToken' | 'noKv' | 'notManaged' | 'slowUndo' | 'noPreview'> = {
  unreachable: 'unreachable',
  'cannot-write': 'cannotWrite',
  'no-token': 'noToken',
  'no-kv': 'noKv',
  'not-managed': 'notManaged',
  'slow-undo': 'slowUndo',
  'no-preview': 'noPreview',
};
