// The inside of the full-screen Preview (pagePreview.tsx): a bar across the top with the site's window sizes (Material 3's
// five, from the site and its theme: previewBreakpoints.ts) and their widths, the page in a frame below at the chosen width
// and the height a window of that size usually has, and a handle at each of the page's edges to drag it to any width. The
// current width shows as a number with the size's name. The page scrolls in its frame, which is made smaller to fit the
// screen (as Chrome's device toolbar does), and nothing in it runs (sandbox).
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Breakpoint } from '../lib/breakpoints.mjs';
import { HEIGHT, MAX_WIDTH, MIN_WIDTH, SIZES, siteBreakpoints, sizeAt, widthOf } from './previewBreakpoints';
import { SegmentedButton } from './ui';
import { t } from './i18n';

// The handle's width, px, on each edge of the page.
const HANDLE = 20;

export function PreviewScreen({ html, title }: { html: string; title: string }) {
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
  const height = HEIGHT[size];
  const scale = room.width ? Math.min(1, (room.width - 2 * HANDLE) / width, room.height / height) : 1;
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
  const handle = (edge: 1 | -1) => (
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
      style={{ width: HANDLE, height: height * scale }}
    >
      <span className="h-12 w-1 rounded-full bg-outline group-hover:bg-primary group-focus-visible:bg-primary" />
    </div>
  );

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-outline-variant px-4 py-2">
        <div className="max-w-full min-w-0 overflow-x-auto">
          <div className="w-max">
            <SegmentedButton
              label={t.preview.size}
              value={size}
              options={SIZES.map((s) => ({ value: s, label: `${t.preview.sizes[s]} ${Math.round(widthOf(s, at))}` }))}
              onChange={(s: Breakpoint) => setWidth(widthOf(s, at))}
            />
          </div>
        </div>
        <p className="ms-auto text-on-surface-variant" aria-live="polite" data-preview-width>
          <span className="text-title-medium text-on-surface tabular-nums">{width}</span> · {t.preview.sizes[size]}
        </p>
      </div>
      <div ref={stage} className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-outline-variant/40 pt-4">
        {room.width > 0 && (
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
