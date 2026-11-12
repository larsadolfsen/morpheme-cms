// The switch at the top of a page or post that has changes waiting (src/drafts/, lib/versions.mjs): `Live` and `Scheduled` (or `Draft`
// when they have no time), to edit either one, so a mistake on the live page can be fixed without touching the waiting changes. It is
// the named slot `versionSwitch` of an app (AppDefinition.slots): the form draws the one of the first app installed that has it, else this one.
import type { Version } from '../lib/versions.mjs';
import { Notice, SegmentedButton } from './ui';
import { t } from './i18n';

/** What the form gives the component of the slot `versionSwitch`. The functions do what the buttons of the form do, with a version id
 * (the core has `live` and `waiting`). */
export type VersionSwitchProps = {
  /** The page or post: its file, its list's id, its title and whether it is a blog post. */
  entry: { path: string; collection: string; title: string; post: boolean };
  /** The page file (`live`) first, then each waiting version (lib/versions.mjs `versionsOf`). */
  versions: Version[];
  /** The id of the version the form is editing now. */
  editing: string;
  /** True while something is being saved. */
  busy: boolean;
  /** Edits another version: the form asks first when something is unsaved. */
  onEdit: (id: string) => void;
  /** Make a version live (`Publish changes`). */
  publish: (id?: string) => Promise<unknown>;
  /** Go live at a time ("2026-11-20T08:00", Danish time), or `null` for no time. */
  schedule: (at: string | null, id?: string) => Promise<unknown>;
  /** Take the page off the website. */
  unpublish: () => Promise<unknown>;
  /** Throw a waiting version away. */
  discard: (id?: string) => Promise<unknown>;
};

/** The core's switch: the live page and its waiting version, side by side. */
export default function VersionSwitch({ versions, editing, busy, onEdit }: VersionSwitchProps) {
  const waiting = versions.find((v) => v.id !== 'live');
  if (!waiting) return null;
  return (
    <SegmentedButton
      label={t.forms.versions.switchLabel}
      value={editing === 'live' ? 'live' : waiting.id}
      disabled={busy}
      options={[
        { value: 'live', label: t.forms.versions.live },
        { value: waiting.id, label: waiting.publishAt ? t.forms.versions.scheduled : t.forms.versions.draft },
      ]}
      onChange={onEdit}
    />
  );
}

/** The notice under the switch on a page or post that has changes waiting: while `Live` is edited, that what is saved goes on the website at
 * once and the waiting changes stay; while they are edited, that the website shows the published version (`when`: when they go live, if they have a time). */
export function WaitingNotice({ editsLive, when }: { editsLive: boolean; when?: string }) {
  const v = t.forms.versions;
  return editsLive ? (
    <Notice title={v.noticeLiveTitle}>{v.noticeLive}</Notice>
  ) : (
    <Notice title={v.noticeWaitingTitle}>{when ? v.noticeScheduled(when) : v.noticeWaiting}</Notice>
  );
}
