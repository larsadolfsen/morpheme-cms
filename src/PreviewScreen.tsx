// The inside of the full-screen Preview (pagePreview.tsx): a bar across the top with the site's window sizes (Material 3's
// five, from the site and its theme: previewBreakpoints.ts) and their widths, the page in a frame below at the chosen width
// and the height a window of that size usually has, and a handle at each of the page's edges to drag it to any width. The
// current width shows as a number with the size's name. The page scrolls in its frame, which is made smaller to fit the
// screen (as Chrome's device toolbar does), and nothing in it runs (sandbox).
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Breakpoint } from '../lib/breakpoints.mjs';
import { HEIGHT, MAX_WIDTH, MIN_WIDTH, SIZES, siteBreakpoints, sizeAt, widthOf } from './previewBreakpoints';
import { X } from '@phosphor-icons/react';
import { BREAKPOINTS } from '../lib/breakpoints.mjs';
import { IconButton, SegmentedButton } from './ui';
import { t } from './i18n';

// The handle's width, px, on each edge of the page.
const HANDLE = 20;

/** `html`: the page, or null while it is made (`message` says so, or what went wrong); `onClose`: the cross in the one row at the top. */
export function PreviewScreen({
  html,
  message,
  title,
  onClose,
}: {
  html: string | null;
  message: string;
  title: string;
  onClose: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const [at, setAt] = useState(() => siteBreakpoints(null));
  const [width, setWidth] = useState(() => widthOf(sizeAt(innerWidth, at), at));
  const drag = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const watch = new ResizeObserver(([e]) => setRoom({ width: e.contentRect.width, height: e.contentRect.height }));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const size = sizeAt(width, at);
  // On a phone-wide window the page has the whole screen (its width, its height, no handles); wider, it keeps its size's
  // height and is made smaller to fit, with a handle at each edge.
  const phone = room.width > 0 && room.width < BREAKPOINTS.medium;
  const grip = phone ? 0 : HANDLE;
  const scale = room.width ? Math.min(1, (room.width - 2 * grip) / width, phone ? Infinity : room.height / HEIGHT[size]) : 1;
  const height = phone ? room.height / scale : HEIGHT[size];
  const limit = (w: number) => Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w)));

  // The page is centred, so an edge moved by dx makes it 2 × dx wider; `edge` is -1 for the start edge.
  const start = (e: PointerEvent<HTMLElement>) => {
    drag.current = { x: e.clientX, width };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLElement>, edge: 1 | -1) => {
    if (!drag.current) return;
    const dir = getComputedStyle(e.currentTarget).direction === 'rtl' ? -1 : 1;
    setWidth(limit(drag.current.width + (2 * dir * edge * (e.clientX - drag.current.x)) / scale));
  };
  const key = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 100 : 10;
    const to = {
      ArrowRight: width + step,
      ArrowUp: width + step,
      ArrowLeft: width - step,
      ArrowDown: width - step,
      Home: MIN_WIDTH,
      End: MAX_WIDTH,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setWidth(limit(to));
  };
  const handle = (edge: 1 | -1) =>
    !phone && (
      <div
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-label={t.preview.pageWidth}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        aria-valuetext={t.preview.current(width, t.preview.sizes[size])}
        onKeyDown={key}
        onPointerDown={start}
        onPointerMove={(e) => move(e, edge)}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="group flex shrink-0 cursor-ew-resize touch-none items-center justify-center outline-none"
        style={{ width: grip, height: height * scale }}
      >
        <span className="h-12 w-1 rounded-full bg-outline group-hover:bg-primary group-focus-visible:bg-primary" />
      </div>
    );

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 border-b border-outline-variant py-1 ps-1 pe-3 min-[600px]:flex-nowrap">
        <IconButton icon={X} label={t.common.close} onClick={onClose} />
        <div className="order-last min-w-0 basis-full overflow-x-auto pe-2 pb-1 min-[600px]:order-none min-[600px]:flex-1 min-[600px]:basis-0 min-[600px]:pb-0">
          <div className="w-max">
            <SegmentedButton
              label={t.preview.size}
              value={size}
              options={SIZES.map((s) => ({ value: s, label: `${t.preview.sizes[s]} ${Math.round(widthOf(s, at))}` }))}
              onChange={(s: Breakpoint) => setWidth(widthOf(s, at))}
            />
          </div>
        </div>
        <p className="ms-auto shrink-0 text-on-surface-variant min-[600px]:ms-0" aria-live="polite" data-preview-width>
          <span className="text-title-medium text-on-surface tabular-nums">{width}</span> · {t.preview.sizes[size]}
        </p>
      </div>
      <div ref={stage} className="flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-outline-variant/40">
        {!html && <p className="p-5 text-on-surface-variant">{message}</p>}
        {html && room.width > 0 && (
          <>
            {handle(-1)}
            <iframe
              title={title}
              srcDoc={html}
              sandbox="allow-same-origin"
              className="shrink-0 origin-top-left border-0 bg-white"
              style={{ width, height, marginRight: width * (scale - 1), marginBottom: height * (scale - 1), transform: `scale(${scale})` }}
              onLoad={(e) => setAt(siteBreakpoints(e.currentTarget.contentDocument))}
            />
            {handle(1)}
          </>
        )}
      </div>
    </>
  );
}
