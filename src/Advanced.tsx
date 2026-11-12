// "Caching and builds" (#developer/caching), under "Developer" (Library.tsx Developer): R2 caching, the copy of the site's files in Cloudflare R2 the Worker
// answers the editor from (packages/editor/worker/files.js), turned on and off with "Enabled" in the Worker's settings (r2Caching.ts),
// saved at once in its own commit. Off, the Worker asks GitHub for everything. It can only be turned on when Cloudflare
// has the bucket (the Worker asks, /api/r2), else a deploy would fail; under the switch, why not, and, until the site is
// built with the change, that it comes then. Above it, where the bucket is kept ("R2 location": placed by Cloudflare, or
// within the EU, a MenuRow with the choice in a dropdown at the right), changed only while it is off, also in its own commit. Under it, the two build switches ("Builds":
// content-only builds, paid build plan) in src/data/build.json (buildSettings.ts), each saved at once in its own commit. The paid
// build plan can only be turned on when Cloudflare says the account has Workers Paid (the Worker asks, /api/plan); under it, why not.
import { useEffect, useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import Screen from './Screen';
import { EmptyNote, GroupTitle, LinkButton, MenuRow, Notice, ProblemNote, SupportingText, SwitchRow } from './ui';
import { DRAFTS } from '../lib/versions.mjs';
import { ConflictError, type RepoFile } from './github';
import type { Env } from './App';
import { savedText } from './deploy';
import { backFrom } from './site';
import {
  bucketOf,
  JURISDICTIONS,
  jurisdictionName,
  jurisdictionOf,
  r2CachingOn,
  planStatus,
  r2Status,
  withJurisdiction,
  withR2Caching,
  type BucketState,
  type PaidState,
} from './r2Caching';
import { config } from '@site/editor';
import { buildSettingsOf, withBuildSetting, type BuildSetting } from './buildSettings';
import { BUILD_SETTINGS_PATH } from '../lib/build-settings.mjs';
import { siteT, t } from './i18n';

export const CACHING_ROUTE = 'developer/caching';

// The hint about skipping the build of a waiting version is closed for good in this browser.
const HINT_KEY = 'editor-hint-skip-draft-builds';
const hintClosed = () => {
  try {
    return localStorage.getItem(HINT_KEY) === 'closed';
  } catch {
    return false;
  }
};

// "Location" when Cloudflare places the bucket (no jurisdiction).
const AUTO = 'auto';

// Cloudflare's dashboard sends on to the account's Billing page.
const BILLING_URL = 'https://dash.cloudflare.com/?to=/:account/billing';

export default function Advanced({ env }: { env: Env }) {
  const [file, setFile] = useState<RepoFile | null>(null);
  const [status, setStatus] = useState<{ bound: boolean; bucket: BucketState } | null>(null);
  // The build settings file: undefined while it loads, null when the site has none yet (the defaults apply).
  const [build, setBuild] = useState<RepoFile | null | undefined>(undefined);
  // What Cloudflare says of the account's plan: null while it is asked.
  const [paid, setPaid] = useState<PaidState | null>(null);
  const [buildProblem, setBuildProblem] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  // Shown once a change has been saved as a waiting version, until it is closed: the editor cannot tell whether the path is excluded.
  const [hintOpen, setHintOpen] = useState(() => !hintClosed());
  const closeHint = () => {
    setHintOpen(false);
    try {
      localStorage.setItem(HINT_KEY, 'closed');
    } catch {
      // The hint comes back next time; nothing is lost.
    }
  };
  const hasWaiting = env.files.some((f) => f.path.startsWith(`${DRAFTS}/`));
  useEffect(() => {
    planStatus().then(setPaid);
    env
      .load([config.wrangler])
      .then(([found]) => {
        if (!found) return setProblem(t.advanced.noSettings);
        setFile(found);
        ask(found.text);
      })
      .catch((e) => setProblem(t.advanced.notLoaded((e as Error).message)));
    env
      .load([BUILD_SETTINGS_PATH])
      .then(([found]) => setBuild(found ?? null))
      .catch((e) => setBuildProblem(t.advanced.buildSettingsNotLoaded((e as Error).message)));
  }, []);

  // What Cloudflare says of the bucket the settings name, where they say it is kept.
  function ask(text: string) {
    const bucket = bucketOf(text);
    setStatus(null);
    if (bucket) r2Status(bucket, jurisdictionOf(text)).then(setStatus);
  }
  const on = file ? r2CachingOn(file.text) : null;
  const bucket = file ? bucketOf(file.text) : null;
  const jurisdiction = file ? jurisdictionOf(file.text) : null;
  // Off, it can be turned on only when Cloudflare has the bucket; on, it can always be turned off.
  const ready = status?.bucket === 'ready';
  const note = !status
    ? t.advanced.checking
    : !on && !ready
      ? t.advanced.bucket[status.bucket](bucket ?? '', jurisdiction && jurisdictionName(jurisdiction))
      : on !== status.bound
        ? on
          ? t.advanced.onWhenBuilt
          : t.advanced.offWhenBuilt
        : t.advanced.r2CachingHint;

  // The places offered: by Cloudflare, the jurisdictions, and one the settings name that is not among them.
  const places = [
    AUTO,
    ...JURISDICTIONS,
    ...(jurisdiction && !(JURISDICTIONS as readonly string[]).includes(jurisdiction) ? [jurisdiction] : []),
  ];

  // Saves one file as its own commit (`oid` null: a new file); the file as saved, or null when it was not.
  async function commitFile(path: string, oid: string | null, text: string, message: string, change: string): Promise<RepoFile | null> {
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, [{ path, content: text, oid }], change);
      const saved = { path, oid: oids[path], text };
      env.onSaved(saved);
      env.notify({ text: savedText(change), kind: 'saved' });
      return saved;
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function save(text: string, message: string, change: string): Promise<boolean> {
    if (!file) return false;
    const saved = await commitFile(file.path, file.oid, text, message, change);
    if (saved) setFile(saved);
    return !!saved;
  }

  const settings = buildSettingsOf(build?.text);
  const buildSwitches: { key: BuildSetting; label: string; hint: string; change: string; commit: (on: boolean) => string }[] = [
    {
      key: 'contentLane',
      label: t.advanced.contentOnlyBuilds,
      hint: t.advanced.contentOnlyBuildsHint,
      change: t.app.changes.contentOnlyBuilds,
      commit: siteT.advanced.contentOnlyBuildsCommit,
    },
    {
      key: 'paidBuilds',
      label: t.advanced.paidBuilds,
      hint: t.advanced.paidBuildsHint,
      change: t.app.changes.paidBuilds,
      commit: siteT.advanced.paidBuildsCommit,
    },
  ];

  // Paid builds are off until Cloudflare says the account has Workers Paid; on, they can always be turned off.
  const paidLocked = (key: BuildSetting, on: boolean) => key === 'paidBuilds' && !on && paid !== 'yes';

  async function turnBuild(key: BuildSetting, next: boolean, commit: (on: boolean) => string, change: string) {
    if (build === undefined || (next && paidLocked(key, settings[key]))) return;
    const saved = await commitFile(
      BUILD_SETTINGS_PATH,
      build?.oid ?? null,
      withBuildSetting(build?.text, key, next),
      commit(next),
      t.app.changes[next ? 'turnedOn' : 'turnedOff'](change),
    );
    if (saved) setBuild(saved);
  }

  async function turn(next: boolean) {
    if (!file || on === null || (next && !ready)) return;
    await save(
      withR2Caching(file.text, next),
      siteT.advanced.r2CachingCommit(next),
      t.app.changes[next ? 'turnedOn' : 'turnedOff'](t.app.changes.r2Caching),
    );
  }

  // Another place names another bucket, so it is asked about again.
  async function place(next: string) {
    if (!file || on !== false) return;
    const kept = next === AUTO ? null : next;
    const text = withJurisdiction(file.text, kept);
    if (await save(text, siteT.advanced.placeCommit(kept && jurisdictionName(kept)), t.app.changes.edited(t.app.changes.place))) ask(text);
  }

  return (
    <Screen title={t.common.parts.caching} wide back={backFrom('caching')}>
      <section className="mb-8">
        <GroupTitle>{t.advanced.r2Caching}</GroupTitle>
        <div className="setting-list px-4">
          {problem ? (
            <ProblemNote>{problem}</ProblemNote>
          ) : !file ? (
            <EmptyNote busy>{t.advanced.loading}</EmptyNote>
          ) : on === null || !bucket ? (
            <ProblemNote>{t.advanced.noLine}</ProblemNote>
          ) : (
            <>
              <MenuRow
                label={t.advanced.place}
                hint={t.advanced.placeHint}
                value={jurisdiction ?? AUTO}
                options={places.map((p) => ({ value: p, label: p === AUTO ? t.advanced.placeAuto : jurisdictionName(p) }))}
                disabled={saving || on}
                onChange={place}
              />
              <SwitchRow label={t.blockSettings.active} hint={note} selected={on} disabled={saving || (!on && !ready)} onChange={turn} />
            </>
          )}
        </div>
      </section>
      <section className="mb-8">
        <GroupTitle>{t.advanced.builds}</GroupTitle>
        {hintOpen && hasWaiting && (
          <div className="mb-4 px-4">
            <Notice title={t.advanced.skipDraftBuildsTitle} onClose={closeHint}>
              {t.advanced.skipDraftBuilds}
            </Notice>
          </div>
        )}
        <div className="setting-list px-4">
          {buildProblem ? (
            <ProblemNote>{buildProblem}</ProblemNote>
          ) : (
            <>
              {buildSwitches.map(({ key, label, hint, change, commit }) => (
                <SwitchRow
                  key={key}
                  label={label}
                  hint={hint}
                  selected={settings[key]}
                  disabled={saving || build === undefined || paidLocked(key, settings[key])}
                  onChange={(next) => turnBuild(key, next, commit, change)}
                />
              ))}
              {paid && !settings.paidBuilds && paid !== 'yes' && <SupportingText className="mt-2">{t.advanced.plan[paid]}</SupportingText>}
              <LinkButton
                href={BILLING_URL}
                target="_blank"
                rel="noopener"
                kind="text"
                size="small"
                icon={ArrowSquareOut}
                className="setting-list-action"
              >
                {t.advanced.billing}
              </LinkButton>
            </>
          )}
        </div>
      </section>
    </Screen>
  );
}
