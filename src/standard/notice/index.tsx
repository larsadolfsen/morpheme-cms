// "Notice", a standard block: a short notice in a box with the accent along its left edge. With "Show until" it goes by
// itself at that time (packages/editor/lib/notice.mjs); then its card is greyed. How it looks is the theme's
// (packages/editor/theme/blocks/notice/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Info } from '@phosphor-icons/react';
import { cut, defineBlock, plain } from '../../blocks';
import { isOver, untilTime } from '../../../lib/notice.mjs';
import { locale, t } from '../../i18n';

// When it stops being shown, for its card: "Shown until 1 Mar 2026 at 12:00", or that it is over (in
// the editor's language).
function untilLine(until: unknown): string {
  const at = untilTime(String(until ?? ''));
  if (at === null) return '';
  const zone = { timeZone: 'Europe/Copenhagen' } as const;
  const day = new Date(at).toLocaleDateString(locale, { ...zone, day: 'numeric', month: 'short', year: 'numeric' });
  const time = new Date(at).toLocaleTimeString(locale, { ...zone, hour: '2-digit', minute: '2-digit' });
  return isOver(String(until)) ? t.blocks.notice.over(day, time) : t.blocks.notice.shownUntil(day, time);
}

export default defineBlock({
  group: 'banners',
  label: t.blocks.notice.label,
  icon: Info,
  hint: t.blocks.notice.hint,
  // Typed in place (InlineNotice.tsx): the text in the notice; `Show until` is in the sheet.
  inline: {
    item: '',
    single: true,
    fields: ['text'],
    settings: ['until'],
    texts: { addAbove: '', addBelow: '', link: '', row: t.blocks.notice.label, settings: t.blocks.notice.until, icon: '' },
  },
  fields: [
    { name: 'text', label: t.blocks.notice.text, type: 'markdown', required: true },
    { name: 'until', label: t.blocks.notice.until, type: 'datetime', hint: t.blocks.notice.untilHint },
  ],
  detail: (p) => [cut(plain(p.text), 140), untilLine(p.until)],
  over: (p) => isOver(String(p.until ?? '')),
});
