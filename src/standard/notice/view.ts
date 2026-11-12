// What "Notice" shows (its view, drawn by the theme's View.tsx): its text with bold, italic and links as written, inside
// a <p> of its own, and when it stops being shown (milliseconds since 1970), or null. In the editor: viewOf; on the
// site: load.ts.
import { inlineNow } from '../../../lib/markdown';
import { untilTime } from '../../../lib/notice.mjs';
import type { ViewOf } from '../view';

export type NoticeView = { html: string; until: number | null };

export const viewOf: ViewOf<NoticeView> = (props) => ({ html: inlineNow(String(props.text ?? '')), until: untilTime(props.until) });
