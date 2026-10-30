// "Avanceret" (#avanceret), under "Indstillinger": R2 caching, the copy of the site's files in Cloudflare R2 the Worker
// answers the editor from (packages/editor/worker/files.js), turned on and off with "Aktiveret" in the Worker's settings (r2Caching.ts),
// saved at once in its own commit. Off, the Worker asks GitHub for everything. It can only be turned on when Cloudflare
// has the bucket (the Worker asks, /api/r2), else a deploy would fail; under the switch, why not, and, until the site is
// built with the change, that it comes then. Above it, where the bucket is kept ("Placering": placed by Cloudflare, or
// within the EU), changed only while it is off, also in its own commit.
import { useEffect, useState } from 'react';
import Screen from './Screen';
import { EmptyNote, FormField, GroupTitle, ProblemNote, SegmentedButton, SupportingText, SwitchRow } from './ui';
import { ConflictError, type RepoFile } from './github';
import type { Env } from './App';
import { SAVED } from './deploy';
import { backFrom } from './site';
import {
  bucketOf,
  JURISDICTIONS,
  jurisdictionName,
  jurisdictionOf,
  r2CachingOn,
  r2Status,
  withJurisdiction,
  withR2Caching,
  type BucketState,
} from './r2Caching';
import { config } from '@site/editor';
import { siteT, t } from './i18n';

export const ADVANCED_ROUTE = 'avanceret';

// "Placering" when Cloudflare places the bucket (no jurisdiction).
const AUTO = 'auto';

export default function Advanced({ env }: { env: Env }) {
  const [file, setFile] = useState<RepoFile | null>(null);
  const [status, setStatus] = useState<{ bound: boolean; bucket: BucketState } | null>(null);
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    env
      .load([config.wrangler])
      .then(([found]) => {
        if (!found) return setProblem(t.advanced.noSettings);
        setFile(found);
        ask(found.text);
      })
      .catch((e) => setProblem(t.advanced.notLoaded((e as Error).message)));
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

  async function save(text: string, message: string): Promise<boolean> {
    if (!file) return false;
    const path = file.path;
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, [{ path, content: text, oid: file.oid }]);
      const saved = { path, oid: oids[path], text };
      setFile(saved);
      env.onSaved(saved);
      env.notify({ text: SAVED, kind: 'saved' });
      return true;
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function turn(next: boolean) {
    if (!file || on === null || (next && !ready)) return;
    await save(withR2Caching(file.text, next), siteT.advanced.r2CachingCommit(next));
  }

  // Another place names another bucket, so it is asked about again.
  async function place(next: string) {
    if (!file || on !== false) return;
    const kept = next === AUTO ? null : next;
    const text = withJurisdiction(file.text, kept);
    if (await save(text, siteT.advanced.placeCommit(kept && jurisdictionName(kept)))) ask(text);
  }

  return (
    <Screen title={t.common.parts.advanced} wide back={backFrom(ADVANCED_ROUTE)}>
      <section className="mb-8">
        <GroupTitle>{t.advanced.r2Caching}</GroupTitle>
        <div className="px-4">
          {problem ? (
            <ProblemNote>{problem}</ProblemNote>
          ) : !file ? (
            <EmptyNote busy>{t.advanced.loading}</EmptyNote>
          ) : on === null || !bucket ? (
            <ProblemNote>{t.advanced.noLine}</ProblemNote>
          ) : (
            <>
              <div className="mb-6">
                <FormField label={t.advanced.place} hint={t.advanced.placeHint}>
                  <SegmentedButton
                    label={t.advanced.place}
                    value={jurisdiction ?? AUTO}
                    options={places.map((p) => ({ value: p, label: p === AUTO ? t.advanced.placeAuto : jurisdictionName(p) }))}
                    disabled={saving || on}
                    onChange={place}
                  />
                </FormField>
              </div>
              <SwitchRow
                label={t.blockSettings.active}
                texts={[t.library.on, t.library.off]}
                selected={on}
                disabled={saving || (!on && !ready)}
                onChange={turn}
              />
              <SupportingText className="mt-2">{note}</SupportingText>
            </>
          )}
        </div>
      </section>
    </Screen>
  );
}
