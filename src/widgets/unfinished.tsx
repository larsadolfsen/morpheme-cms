// "Unfinished" on the start screen, the widget cms:unfinished: a card with the pages and blog posts that are drafts,
// hidden or scheduled, each a row that opens its form. Exposes UnfinishedWidget. The rows are unfinished.mjs's, the
// entries entries.mjs's (from the files in startData.ts), the status texts those of the lists (t.library.status).
// With nothing unfinished it shows nothing, unless it is being edited: then it renders with its empty text.
import { useId } from 'react';
import { t } from '../i18n';
import { collections, icons } from '../site';
import { when } from '../when';
import { entriesOf } from '../entries.mjs';
import { unfinishedOf } from '../unfinished.mjs';
import { useStartData } from '../startData';
import type { WidgetProps } from '../widgets';
import { SiteCard } from '../themeUi';
import { ListItem, plainListClass } from '../ui';

const lists = collections.flatMap((c) => (c.kind === 'markdown' ? [{ id: c.id, folder: c.folder }] : []));

/** "Draft" or "Scheduled Nov 1 at 8:00 AM" (without the time when publishAt is not usable). */
const statusText = (status: string, at: number | null) =>
  status === 'draft' ? t.library.status.draft : at === null ? t.library.status.scheduled : t.library.status.scheduledAt(when(new Date(at)));

export function UnfinishedWidget({ editing }: WidgetProps) {
  const { files } = useStartData();
  const titleId = useId();
  const rows = unfinishedOf(entriesOf(files, lists));
  if (!rows.length && !editing) return null;
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby={titleId} className="[--card-padding:1rem_0_0.5rem]">
      <h2 id={titleId} className="ps-4 pe-4 pb-2 font-medium">
        {t.library.unfinishedTitle}
      </h2>
      {rows.length ? (
        <ul className={plainListClass}>
          {rows.map((row) => (
            <ListItem
              key={row.path}
              href={`#${row.path}`}
              icon={icons[row.collection]}
              headline={row.title}
              supporting={statusText(row.status, row.at)}
              truncate
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-2 text-sm text-on-surface-variant">{t.library.unfinishedEmpty}</p>
      )}
    </SiteCard>
  );
}
