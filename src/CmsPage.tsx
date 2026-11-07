// "Morpheme" (#morpheme), under "Indstillinger": the CMS version the site runs, the notes of the update just installed,
// a newer one with its notes, why it is not taken by itself, and an update's progress, and the site's connection to the
// Morpheme store (MorphemeConnection) as its last group. Exposes CMS_ROUTE and the page. Depends on cmsView.mjs,
// ReleaseNotes (the notes as cards), MorphemeConnection and the Worker's /api/cms.
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, Info, Sparkle, WarningCircle } from '@phosphor-icons/react';
import Screen from './Screen';
import { MorphemeConnection } from './MorphemeConnection';
import { ReleaseNotes, type VersionNotes } from './ReleaseNotes';
import { Button, EmptyNote, Group, ListItem, ProblemNote } from './ui';
import { backFrom } from './site';
import { cmsView } from './cmsView.mjs';
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
  installed: VersionNotes[];
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

function UpdateRow({ update }: { update: NonNullable<View['update']> }) {
  const text = t.cms[update.state](update.to);
  const bad = update.state === 'undone' || update.state === 'stuck';
  return (
    <ListItem
      icon={bad ? WarningCircle : update.state === 'done' ? CheckCircle : Clock}
      tone={bad ? 'accent' : undefined}
      headline={text}
      supporting={when(new Date(update.at))}
    />
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
  return (
    <Screen title={t.common.parts.morpheme} back={backFrom(CMS_ROUTE)}>
      {problem && <ProblemNote alert>{problem}</ProblemNote>}
      {!view && !problem && <EmptyNote busy>{t.app.loading}</EmptyNote>}
      {view && (
        <>
          {view.installed.length > 0 && <ReleaseNotes title={t.cms.newInYourVersion} entries={view.installed} />}
          <Group>
            <ListItem icon={Info} headline={t.cms.running(view.running)} supporting={view.latest ? undefined : t.cms.upToDate} />
            <ListItem icon={Clock} headline={view.checkedAt ? t.cms.checked(when(new Date(view.checkedAt))) : t.cms.notChecked} />
            {view.update && <UpdateRow update={view.update} />}
            {view.latest && <ListItem icon={Sparkle} tone="accent" headline={t.cms.available(view.latest)} supporting={reason} />}
            {view.npmCommand && <ListItem headline={t.cms.needsNpm} supporting={<code>{view.npmCommand}</code>} />}
            {view.problems.map((kind) => (
              <ListItem key={kind} icon={WarningCircle} tone="accent" headline={t.cms[kindText[kind]]} />
            ))}
          </Group>
          {view.action && view.latest && (
            <Button kind="filled" disabled={busy} onClick={() => void update(view.latest!)}>
              {view.action === 'update' ? t.cms.update : t.cms.tryAgain}
            </Button>
          )}
          {view.notes.length > 0 && <ReleaseNotes title={t.cms.whatsNew} entries={view.notes} />}
        </>
      )}
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
