// "Besked" on the site (view.ts): with `until` (Danish time) it is left out once that time has passed, and the script
// right after it (`after`) removes it in a browser where the time has come since the site was built
// (../../../lib/notice.mjs).
import { inlineHtml } from '../../../lib/inline';
import { isOver, untilTime } from '../../../lib/notice.mjs';
import type { Load } from '../view';
import type { NoticeView } from './view';

export const load: Load<NoticeView> = async (props) =>
  isOver(props.until) ? null : { html: await inlineHtml(props.text ?? ''), until: untilTime(props.until) };

// Runs as the page is read, right after the box, so a notice that is over is never shown.
export const after = (view: NoticeView) =>
  view.until === null
    ? undefined
    : '<script>(() => { const n = document.currentScript.previousElementSibling; if (Date.now() >= +n.dataset.until) n.remove(); })();</script>';
