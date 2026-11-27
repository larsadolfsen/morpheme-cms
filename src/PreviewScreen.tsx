// The inside of the Preview page (pagePreview.tsx, a page of the editor under its top bar): a row across the top with the site's window sizes (Material 3's
// five, from the site and its theme: previewBreakpoints.ts) and their widths, the page in a frame below at the chosen width
// and the height a window of that size usually has, and a handle at each of the page's edges to drag it to any width. The
// current width shows as a number with the size's name. The page scrolls in its frame, which is made smaller to fit the
// screen (as Chrome's device toolbar does), and nothing in it runs (sandbox).
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Breakpoint } from '../lib/breakpoints.mjs';
import { HEIGHT, MAX_WIDTH, MIN_WIDTH, SIZES, siteBreakpoints, sizeAt, widthOf } from './previewBreakpoints';
import { BREAKPOINTS } from '../lib/breakpoints.mjs';
import { ConnectedButtons } from './ui';
import { SiteToolbar } from './themeUi';
import { t } from './i18n';
import { announce } from '../lib/announce';

// The handle's width, px, on each edge of the page.
const HANDLE = 20;

/** `html`: the page, or null while it is made (`message` says so, or what went wrong). */
export function PreviewScreen({ html, message, title }: { html: string | null; message: string; title: string }) {
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
        className="mo-editor-preview-handle"
        style={{ width: grip, height: height * scale }}
      >
        <span className="mo-editor-preview-handle-grip" />
      </div>
    );

  return (
    <>
      <SiteToolbar label={t.preview.size} kind="docked" className="mo-editor-preview-bar">
        <div className="mo-editor-preview-sizes">
          <div className="mo-editor-preview-sizes-inner">
            <ConnectedButtons
              label={t.preview.size}
              value={size}
              options={SIZES.map((s) => ({ value: s, label: `${t.preview.sizes[s]} ${Math.round(widthOf(s, at))}` }))}
              onChange={(s: Breakpoint) => {
                setWidth(widthOf(s, at));
                // Said when the person picks a size, not while the preview resizes.
                announce(`${t.preview.sizes[s]} ${Math.round(widthOf(s, at))}`);
              }}
            />
          </div>
        </div>
        <p className="mo-type-body-medium mo-editor-preview-width" data-preview-width>
          <span className="mo-type-title-medium mo-editor-preview-width-value">{width}</span> · {t.preview.sizes[size]}
        </p>
      </SiteToolbar>
      {/* The frame is drawn over the place (absolute), so its height never makes the page taller than the window. */}
      <div className="mo-editor-preview-place">
        <div ref={stage} className="mo-editor-preview-stage">
          {!html && <p className="mo-editor-preview-message">{message}</p>}
          {html && room.width > 0 && (
            <>
              {handle(-1)}
              <iframe
                title={title}
                srcDoc={html}
                sandbox="allow-same-origin"
                className="mo-editor-preview-frame"
                style={{
                  width,
                  height,
                  marginRight: width * (scale - 1),
                  marginBottom: height * (scale - 1),
                  transform: `scale(${scale})`,
                }}
                // A picture of the site, not a place to work: hidden from screen readers and out of the tab order, and nothing in it takes focus
                // (its links and controls are inert, as in the header and footer preview). The page itself is not inert, so it still scrolls.
                aria-hidden="true"
                tabIndex={-1}
                onLoad={(e) => {
                  const doc = e.currentTarget.contentDocument;
                  doc
                    ?.querySelectorAll<HTMLElement>('a, button, input, select, textarea, summary, [tabindex]')
                    .forEach((el) => (el.inert = true));
                  setAt(siteBreakpoints(doc));
                }}
              />
              {handle(1)}
            </>
          )}
        </div>
      </div>
    </>
  );
}
