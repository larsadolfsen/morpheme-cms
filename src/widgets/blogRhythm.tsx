// "Blog rhythm" on the start screen, the widget cms:blog-rhythm: when the next blog post is due (the setting `every`: a
// week, two weeks or a month after the last post on the blog), it says how long ago the last one was and links to a new
// post; with no post on the blog yet, it links to the first. Exposes BlogRhythmWidget. The dates are blogRhythm.mjs's, the
// entries entries.mjs's (from the files in startData.ts). Not due, it shows nothing, unless it is being edited: then it
// says when the next post is due.
import { useId } from 'react';
import { Pen } from '@phosphor-icons/react';
import { locale, t } from '../i18n';
import { collections } from '../site';
import { entriesOf } from '../entries.mjs';
import { isDue, lastPostOf, nextDue, weeksSince } from '../blogRhythm.mjs';
import { useStartData } from '../startData';
import type { WidgetProps } from '../widgets';
import { SiteCard } from '../themeUi';
import { LinkButton } from '../ui';

const lists = collections.flatMap((c) => (c.kind === 'markdown' ? [{ id: c.id, folder: c.folder }] : []));
const NEW_POST = '#new/blog';

export function BlogRhythmWidget({ settings, editing }: WidgetProps) {
  const { files } = useStartData();
  const titleId = useId();
  const every = String(settings.every ?? 'month');
  const now = Date.now();
  const last = lastPostOf(entriesOf(files, lists), now);
  const due = last === null || isDue(last, every, now);
  if (!due && !editing) return null;
  const text =
    last === null
      ? t.library.blogRhythmNone
      : due
        ? t.library.blogRhythmLast(weeksSince(last, now))
        : t.library.blogRhythmNext(
            nextDue(last, every).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
          );
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby={titleId} className="[--card-padding:1rem]">
      <h2 id={titleId} className="pb-2 font-medium">
        {t.library.blogRhythmWidgetLabel}
      </h2>
      <p className="text-sm text-on-surface-variant">{text}</p>
      {due && (
        <div className="pt-3">
          <LinkButton href={NEW_POST} icon={Pen} kind="tonal" size="small">
            {last === null ? t.library.blogRhythmWriteFirst : t.library.blogRhythmWriteNew}
          </LinkButton>
        </div>
      )}
    </SiteCard>
  );
}
