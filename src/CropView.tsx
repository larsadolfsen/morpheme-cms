// The crop view (docs/superpowers/specs/2026-11-14-image-tools-design.md, section 3): a page of the editor, on every width (owner, 14 Nov: full-screen
// views are pages): a top app bar with a back arrow and its title, the whole image in its real proportions with a frame of the chosen aspect ratio over it
// and everything outside the frame under the theme's scrim (the one its dialogs have behind their container: --mo-comp-dialog-scrim), the aspect ratios and the
// zoom, and a bottom bar with Save (and Cancel from medium). A drag places the image under the frame, a pinch (touch) or the wheel (mouse) zooms around
// the fingers or the pointer, the slider with its minus and plus buttons zooms around the middle. It is a layer over the editor (a modal <dialog> the size
// of the window, so the form under it keeps its changes and its scroll place), with a step of its own in the history so the phone's back gesture leaves it
// (useSheetBack). Back (the arrow, the gesture, Esc) with changes asks "Keep your changes?". It opens only when asked (the bar's Crop, the image sheet's
// Aspect ratio), never by itself after an image is picked. `cropView(...)` opens it and answers with the new aspect ratio and crop (crop.mjs), or null when
// it was left; <CropViewHost /> is in App.tsx.
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react';
import { FORMATS, middleCrop, ratioOf } from '../lib/crop.mjs';
import { closeChanged } from './ask';
import { shownAt } from './images';
import { ActionSheet, Button, FilterChip, IconButton, Slider, TopAppBar, useAtLeast } from './ui';
import { useSheetBack } from './useSheetBack';
import { t } from './i18n';
import { safeImageSrc } from '../lib/safe-url.mjs';

export type Cut = number[] | null;
export type CropResult = { format: string; crop: Cut };
export type CropRequest = {
  src: string;
  format: string;
  crop: Cut;
  /** The aspect ratios offered ('' is Original): all of them by default; one only (a Cards block's own) offers no choice. */
  ratios?: string[];
};

const MAX_ZOOM = 4;
/** The room round the frame in the image area, in dp. */
const PAD = 16;
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

type Rect = { x: number; y: number; w: number; h: number };
/** The scrim's shape: the image's whole box with the frame cut out (both in px, the frame inside the image). */
const shadeHole = (picture: Rect, frame: Rect) => {
  const [x, y] = [frame.x - picture.x, frame.y - picture.y];
  const [x2, y2] = [x + frame.w, y + frame.h];
  return `polygon(evenodd, 0 0, ${picture.w}px 0, ${picture.w}px ${picture.h}px, 0 ${picture.h}px, 0 0, ${x}px ${y}px, ${x}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y}px, ${x}px ${y}px)`;
};

let open: (request: CropRequest, resolve: (answer: CropResult | null) => void) => void = (_, resolve) => resolve(null);

/** Opens the crop view for an image and answers with its new aspect ratio and crop, or null when it was closed without keeping them. */
export const cropView = (request: CropRequest) => new Promise<CropResult | null>((resolve) => open(request, resolve));

type Open = { request: CropRequest; resolve: (answer: CropResult | null) => void };
type Gesture = { crop: number[]; zoom: number; mid: { x: number; y: number }; dist: number };

export default function CropViewHost() {
  const [shown, setShown] = useState<Open | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    open = (request, resolve) => {
      setShown({ request, resolve });
      // The dialog is drawn with the request, then opened (its element is there already).
      setTimeout(() => {
        dialog.current?.showModal();
        // No control has the focus at the start: the page itself does, without a ring (editor.css .mo-editor-crop-page:focus).
        dialog.current?.focus({ preventScroll: true });
      });
    };
  }, []);
  const answer = (result: CropResult | null) => {
    shown?.resolve(result);
    setShown(null);
    dialog.current?.close();
  };
  return <CropDialog key={shown ? shown.request.src + shown.request.format : 'closed'} ref={dialog} shown={shown} answer={answer} />;
}

function CropDialog({
  ref,
  shown,
  answer,
}: {
  ref: Ref<HTMLDialogElement>;
  shown: Open | null;
  answer: (result: CropResult | null) => void;
}) {
  const request = shown?.request;
  const medium = useAtLeast('medium');
  const headline = useId();
  const ratios = request?.ratios ?? ['', ...FORMATS];
  const [cut, setCut] = useState<CropResult>({ format: request?.format ?? '', crop: request?.crop ?? null });
  const cutNow = useRef(cut);
  cutNow.current = cut;
  const was = useRef(JSON.stringify(cut));

  // Width divided by height of the image, once it is loaded.
  const src = request?.src ?? '';
  const [aspect, setAspect] = useState(0);
  useEffect(() => {
    if (!src) return;
    let gone = false;
    const img = new Image();
    img.onload = () => !gone && img.naturalHeight && setAspect(img.naturalWidth / img.naturalHeight);
    img.src = shownAt(src);
    return () => {
      gone = true;
    };
  }, [src]);
  // A ratio without a crop shows the largest part in the middle.
  useEffect(() => {
    if (!cut.format || cut.crop || !aspect) return;
    const crop = middleCrop(aspect, cut.format);
    // The ratio the view opened with is not a change; one picked before the image had loaded is.
    if (cut.format === request?.format) was.current = JSON.stringify({ format: cut.format, crop });
    setCut({ format: cut.format, crop });
  }, [cut.format, cut.crop, aspect]);

  // The image area's size, in px.
  const area = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, [!!shown, medium]);

  const ratio = ratioOf(cut.format);
  const crop = ratio > 0 ? cut.crop : null;
  const whole = aspect && ratio ? middleCrop(aspect, cut.format) : null;
  const zoom = crop && whole ? whole[2] / crop[2] : 1;

  // Where the frame and the image are in the area, in px. Original: no frame, the whole image fits the area.
  const frame = (() => {
    if (!room.w || !room.h) return null;
    if (!ratio) return null;
    const h = Math.min(room.h - 2 * PAD, (room.w - 2 * PAD) / ratio);
    const w = h * ratio;
    return { x: (room.w - w) / 2, y: (room.h - h) / 2, w, h };
  })();
  const picture = (() => {
    if (!aspect || !room.w || !room.h) return null;
    if (!frame || !crop) {
      const w = Math.min(room.w - 2 * PAD, (room.h - 2 * PAD) * aspect);
      return { x: (room.w - w) / 2, y: (room.h - w / aspect) / 2, w, h: w / aspect };
    }
    const w = (frame.w * 100) / crop[2];
    const h = w / aspect;
    return { x: frame.x - (crop[0] / 100) * w, y: frame.y - (crop[1] / 100) * h, w, h };
  })();

  // The crop that keeps the image point that was under `from` (a place in the frame, 0 to 1 each way) under `to`, at the zoom `z`.
  function placed(base: number[], from: { x: number; y: number }, to: { x: number; y: number }, z: number) {
    if (!whole) return base;
    const zz = clamp(z, 1, MAX_ZOOM);
    const [nw, nh] = [whole[2] / zz, whole[3] / zz];
    const px = base[0] + from.x * base[2];
    const py = base[1] + from.y * base[3];
    return [clamp(px - to.x * nw, 0, 100 - nw), clamp(py - to.y * nh, 0, 100 - nh), nw, nh];
  }
  // A place on the screen as a place in the frame.
  const inFrame = (p: { x: number; y: number }) => {
    const box = area.current?.getBoundingClientRect();
    if (!box || !frame) return { x: 0.5, y: 0.5 };
    return { x: (p.x - box.left - frame.x) / frame.w, y: (p.y - box.top - frame.y) / frame.h };
  };
  const setCrop = (next: number[]) => setCut((c) => ({ ...c, crop: next }));
  const zoomBy = (z: number, at = { x: 0.5, y: 0.5 }) => crop && whole && setCrop(placed(crop, at, at, z));

  // One finger or the mouse drags, two fingers pinch (and drag); the wheel zooms around the pointer.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const base = useRef<Gesture | null>(null);
  const middle = () => {
    const [a, b] = [...pointers.current.values()];
    return b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dist: Math.hypot(a.x - b.x, a.y - b.y) } : { ...a, dist: 0 };
  };
  const snapshot = () => {
    const c = cutNow.current.crop;
    if (!pointers.current.size || !c || !whole) return void (base.current = null);
    const { dist, ...mid } = middle();
    base.current = { crop: c, zoom: whole[2] / c[2], mid, dist };
  };
  function down(e: ReactPointerEvent) {
    if (!crop) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    snapshot();
  }
  function move(e: ReactPointerEvent) {
    const b = base.current;
    if (!b || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const now = middle();
    const z = b.dist && now.dist ? b.zoom * (now.dist / b.dist) : b.zoom;
    setCrop(placed(b.crop, inFrame(b.mid), inFrame(now), z));
  }
  function up(e: ReactPointerEvent) {
    if (!pointers.current.delete(e.pointerId)) return;
    snapshot();
  }
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      const c = cutNow.current.crop;
      if (!c || !whole) return;
      e.preventDefault();
      const at = inFrame({ x: e.clientX, y: e.clientY });
      const z = (whole[2] / c[2]) * Math.exp(-e.deltaY * 0.0015);
      setCrop(placed(c, at, at, z));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });
  function key(e: KeyboardEvent) {
    const step = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key];
    if (!step || !crop) return;
    e.preventDefault();
    setCrop([clamp(crop[0] + step[0], 0, 100 - crop[2]), clamp(crop[1] + step[1], 0, 100 - crop[3]), crop[2], crop[3]]);
  }

  const changed = JSON.stringify(cut) !== was.current;
  const save = () => answer(changed ? cut : null);
  // Left (the back arrow, Cancel, Esc, the phone's back gesture) with changes: keep them, leave them or stay (the question every sheet asks).
  // The gesture has taken the page's step in the history already: staying gives it back.
  async function leave(fromGesture = false) {
    if (!changed) return answer(null);
    const choice = await closeChanged();
    if (choice === 'keep') answer(cut);
    else if (choice === 'discard') answer(null);
    else if (fromGesture) history.pushState({ ...history.state, sheet: 'mo-editor-crop-view' }, '');
  }
  const leaveNow = useRef(leave);
  leaveNow.current = leave;
  const onBack = useCallback(() => void leaveNow.current(true), []);
  useSheetBack(!!shown, onBack, 'mo-editor-crop-view');

  const picked = (f: string) => setCut({ format: f, crop: f && aspect ? middleCrop(aspect, f) : null });
  const body = (
    <div className="mo-editor-crop-view">
      <div
        ref={area}
        className="mo-editor-crop-view-area"
        data-original={!crop || undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {picture && (
          <img
            src={safeImageSrc(shownAt(src))}
            alt=""
            draggable={false}
            className="mo-editor-crop-view-image"
            style={{ left: picture.x, top: picture.y, width: picture.w, height: picture.h }}
          />
        )}
        {picture && frame && crop && (
          // The scrim is on the image only, with the frame cut out of it (an even-odd hole): the stage's own blank part, where the image does not reach,
          // keeps the page's colour instead of a grey strip.
          <div
            aria-hidden="true"
            className="mo-editor-crop-view-shade"
            style={{
              left: picture.x,
              top: picture.y,
              width: picture.w,
              height: picture.h,
              clipPath: shadeHole(picture, frame),
            }}
          />
        )}
        {frame && crop && (
          <div
            tabIndex={0}
            role="group"
            aria-label={t.media.crop.frame}
            className="mo-editor-crop-view-frame"
            style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
            onKeyDown={key}
          />
        )}
      </div>
      {crop && <p className="mo-editor-crop-view-hint">{t.media.crop.drag}</p>}
      {ratios.length > 1 && (
        <div>
          <p className="mo-editor-crop-view-label" id={`${headline}-ratio`}>
            {t.media.crop.ratio}
          </p>
          <div role="radiogroup" aria-labelledby={`${headline}-ratio`} className="mo-editor-crop-view-ratios">
            {ratios.map((f) => {
              const r = ratioOf(f);
              return (
                <FilterChip key={f || 'original'} selected={f === cut.format} onClick={() => picked(f)}>
                  {r > 0 && (
                    <span
                      aria-hidden="true"
                      className="mo-editor-crop-ratio-box"
                      style={{ width: r >= 1 ? 18 : 18 * r, height: r >= 1 ? 18 / r : 18 }}
                    />
                  )}
                  {f || t.media.crop.original}
                </FilterChip>
              );
            })}
          </div>
        </div>
      )}
      <div className="mo-editor-crop-view-zoom">
        <IconButton icon="remove" label={t.media.crop.zoomOut} disabled={!crop} onClick={() => zoomBy(zoom - 0.25)} />
        <Slider
          label={t.media.crop.zoom}
          hideLabel
          className="mo-editor-grow"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!crop || !whole}
          onChange={(z) => zoomBy(z)}
        />
        <IconButton icon="add" label={t.media.crop.zoomIn} disabled={!crop} onClick={() => zoomBy(zoom + 0.25)} />
      </div>
    </div>
  );

  return (
    <dialog
      ref={ref}
      // The headline is drawn while the page is shown: until then a label names the dialog.
      aria-labelledby={shown ? headline : undefined}
      aria-label={shown ? undefined : t.media.crop.title}
      className="mo-editor-crop-page"
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        void leave();
      }}
    >
      {shown && (
        <>
          <TopAppBar>
            <div className="mo-editor-crop-bar">
              <IconButton icon="arrow_back" label={t.common.backTo(t.text.image)} onClick={() => void leave()} />
              <h1 id={headline} className="mo-fill mo-truncate mo-type-title-large">
                {t.media.crop.title}
              </h1>
            </div>
          </TopAppBar>
          <main className="mo-editor-crop-page-main">{body}</main>
          <ActionSheet label={t.common.saveChanges}>
            <div className="mo-editor-crop-actions">
              {medium && (
                <Button kind="outlined" onClick={() => void leave()}>
                  {t.common.cancel}
                </Button>
              )}
              <Button kind="filled" onClick={save}>
                {t.common.save}
              </Button>
            </div>
          </ActionSheet>
        </>
      )}
    </dialog>
  );
}
