// "Morpheme" (#morpheme), under "Indstillinger": the CMS version the site runs, the notes of its minor line (from the
// package itself, bundledNotes.ts), a newer one with its notes, why it is not taken by itself, and an update's progress (all as text; only the update button is a control), and the site's connection to the
// Morpheme store (MorphemeConnection) as its last group. Exposes CMS_ROUTE and the page. Depends on cmsView.mjs, bundledNotes.ts,
// ReleaseNotes (the notes as an article), MorphemeConnection and the Worker's /api/cms.
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sparkle, WarningCircle, type Icon } from '@phosphor-icons/react';
import Screen from './Screen';
import { MorphemeConnection } from './MorphemeConnection';
import { ReleaseNotes, type VersionNotes } from './ReleaseNotes';
import { Button, EmptyNote, ProblemNote } from './ui';
import { backFrom } from './site';
import { cmsView } from './cmsView.mjs';
import { runningLine, runningNotes } from './bundledNotes';
import { EarlierVersions, LineNav } from './VersionLinePage';
import { minorOf } from '../lib/releaseNotes.mjs';
import { snackbar } from '../lib/snackbar';
import { t } from './i18n';
import { when } from './when';

export const CMS_ROUTE = 'morpheme';

type Problem = 'unreachable' | 'cannot-write' | 'no-token' | 'no-kv' | 'not-managed' | 'slow-undo';
type UpdateState = 'waiting' | 'undoing' | 'done' | 'undone' | 'stuck';
type View = {
  running: string;
  checkedAt: string | null;
  latest: string | null;
  notes: VersionNotes[];
  action: 'update' | 'try-again' | null;
  npmCommand: string | null;
  update: { state: UpdateState; to: string; at: string } | null;
  problems: Problem[];
};
type Status = object;

/** The Worker's error code in words; any other answer says what status it was. */
function errorText(code: unknown, status: number, version = '') {
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

/** Why the site does not take the newer version by itself, or nothing. */
const reasonOf = (view: View) =>
  view.action === 'update' ? t.cms.major : view.action === 'try-again' && view.latest ? t.cms.skipped(view.latest) : null;

/** A line of the status text, with its icon only where the icon means something (a warning, an update). */
function StatusLine({ icon: Glyph, tone, children }: { icon?: Icon; tone?: 'accent'; children: ReactNode }) {
  return (
    <p className={`flex items-start gap-2 ${tone ? 'text-primary' : ''}`}>
      {Glyph && <Glyph aria-hidden size={20} className="shrink-0" />}
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

/** What the update does now (waiting, done, undone, stuck) and when: text, there is nothing to tap. */
function UpdateStatus({ update }: { update: NonNullable<View['update']> }) {
  const bad = update.state === 'undone' || update.state === 'stuck';
  return (
    <div>
      <StatusLine icon={bad ? WarningCircle : undefined} tone={bad ? 'accent' : undefined}>
        {t.cms[update.state](update.to)}
      </StatusLine>
      <p className="text-sm text-on-surface-variant">{when(new Date(update.at))}</p>
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
        throw new Error(errorText(json.error, res.status, version));
      }
      await load();
    } catch (e) {
      snackbar({ text: (e as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const reason = view && reasonOf(view);
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
          <section className="mb-6 max-w-prose space-y-3 px-4 text-base not-first:mt-8">
            <div>
              <p>{t.cms.running(view.running)}</p>
              {!view.latest && <p className="text-sm text-on-surface-variant">{t.cms.upToDate}</p>}
              <p className="text-sm text-on-surface-variant">
                {view.checkedAt ? t.cms.checked(when(new Date(view.checkedAt))) : t.cms.notChecked}
              </p>
            </div>
            {view.update && <UpdateStatus update={view.update} />}
            {view.latest && (
              <div>
                <StatusLine icon={Sparkle} tone="accent">
                  {t.cms.available(view.latest)}
                </StatusLine>
                {reason && <p className="text-sm text-on-surface-variant">{reason}</p>}
              </div>
            )}
            {view.npmCommand && (
              <div>
                <p>{t.cms.needsNpm}</p>
                <p className="text-sm text-on-surface-variant">
                  <code>{view.npmCommand}</code>
                </p>
              </div>
            )}
            {view.problems.map((kind) => (
              <StatusLine key={kind} icon={WarningCircle} tone="accent">
                {t.cms[kindText[kind]]}
              </StatusLine>
            ))}
          </section>
          {view.action && view.latest && (
            <Button kind="filled" disabled={busy} onClick={() => void update(view.latest!)}>
              {view.action === 'update' ? t.cms.update : t.cms.tryAgain}
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

const kindText: Record<Problem, 'unreachable' | 'cannotWrite' | 'noToken' | 'noKv' | 'notManaged' | 'slowUndo'> = {
  unreachable: 'unreachable',
  'cannot-write': 'cannotWrite',
  'no-token': 'noToken',
  'no-kv': 'noKv',
  'not-managed': 'notManaged',
  'slow-undo': 'slowUndo',
};
