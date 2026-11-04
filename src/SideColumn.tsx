// "Udseende" › "Sidekolonne" (#udseende/sidekolonne): the block drawn in a column beside the text of the pages, chosen
// among "Ingen" and the installed blocks that can be (`beside` in their load.ts), saved in the site's file (config.side)
// in its own commit. Exposes SideColumn, sideSettingOf and sideChoicesOf (also used by the page form and by Library.tsx).
// Uses ui.tsx (ChoiceRow, Group), registry.tsx (siteBlocks) and lib/side-block.mjs.
import { useState } from 'react';
import { config } from '@site/editor';
import { ConflictError, type RepoFile } from './github';
import Screen from './Screen';
import { ChoiceRow, EmptyNote, Group } from './ui';
import type { Env } from './App';
import { kindAndName } from './deploy';
import { ask } from './ask';
import { installedApps } from './apps';
import { siteBlocks } from './registry';
import { locale, siteT, t } from './i18n';
import { sideChoices } from '../lib/side-block.mjs';

// The text of each block's load.ts (the editor never imports it: it runs on the site), by the block's type.
const sources: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...import.meta.glob<string>('./standard/*/load.ts', { eager: true, query: '?raw', import: 'default' }),
    ...import.meta.glob<string>('/src/apps/*/blocks/*/load.ts', { eager: true, query: '?raw', import: 'default' }),
  }).map(([path, text]) => [path.split('/').at(-2)!, text]),
);

const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
const back = { href: '#udseende', label: t.common.parts.appearance };

/** The block type the site's file (config.side) chooses, or null. */
export function sideSettingOf(files: { path: string; text: string }[]): string | null {
  try {
    const block = JSON.parse(files.find((f) => f.path === config.side)?.text ?? '{}').block;
    return typeof block === 'string' && block ? block : null;
  } catch {
    return null;
  }
}

/** The installed blocks that can be drawn beside a page's text, with their names in the editor's language. */
export const sideChoicesOf = (files: { path: string; text: string }[]) =>
  sideChoices(siteBlocks, sources, installedApps(files)) as { type: string; label: string }[];

/** "Sidekolonne": "Ingen" and each block that can be drawn beside the text, the one chosen ticked. A tap on another asks
 * first and then saves it (`{ "block": "<type>" }`, or `{ "block": null }`) at once, in its own commit, as an icon pack is. */
export default function SideColumn({ env, files }: { env: Env; files: RepoFile[] }) {
  const [saving, setSaving] = useState(false);
  const chosen = sideSettingOf(files);
  const choices = sideChoicesOf(files);

  async function choose(type: string | null, name: string) {
    if (saving || type === chosen) return;
    if (!(await ask(type ? t.library.changeSideAsk(name) : t.library.changeSideNoneAsk, t.library.changeSide))) return;
    const path = config.side;
    const file = files.find((f) => f.path === path);
    const text = `${JSON.stringify({ block: type }, null, 2)}\n`;
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const change = t.app.changes.chosen(kindAndName(t.app.changes.sideColumn, name));
      const siteName = choices.find((x) => x.type === type)?.label ?? name;
      const message = type ? siteT.library.sideCommit(siteName) : siteT.library.sideCommitNone;
      const oids = await env.commit(message, [{ path, content: text, oid: file?.oid || null }], change);
      env.onSaved({ path, oid: oids[path], text });
      env.notify({ text: t.library.sideSaved(capital(change)), kind: 'saved' });
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={t.common.parts.sideColumn} wide back={back}>
      <Group>
        <ChoiceRow selected={!chosen} onClick={() => choose(null, t.library.sideNone)} headline={t.library.sideNone} supporting={t.library.sideNoneHint} />
        {choices.map((x) => (
          <ChoiceRow key={x.type} selected={x.type === chosen} onClick={() => choose(x.type, x.label)} headline={x.label} />
        ))}
      </Group>
      {!choices.length && <EmptyNote>{t.library.sideEmpty}</EmptyNote>}
    </Screen>
  );
}
