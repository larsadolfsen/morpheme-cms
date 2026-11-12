// How an image in the text is cut (packages/editor/lib/crop.mjs), in its sheet (BlockDialog.tsx): its format
// (Original, or one of FORMATS), and the part of the image that is shown in it, moved by dragging
// the image (or with the arrow keys) and made larger with the slider. A new format, or another
// image, starts with the largest part in the middle.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { FORMATS, middleCrop, ratioOf } from '../lib/crop.mjs';
import { shownAt } from './images';
import { FilterChip, SupportingText, Slider } from './ui';
import { t } from './i18n';

export type Cut = number[] | null;

type Props = {
  src: string;
  format: string;
  crop: Cut;
  /** The new format and crop; a function of them as they are then, as the image loads later. */
  onChange: (next: (was: { format: string; crop: Cut }) => { format: string; crop: Cut }) => void;
};

const MAX_ZOOM = 4;
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

// The crop moved (in percent of the image) and kept inside it.
const moved = ([x, y, w, h]: number[], dx: number, dy: number) => [clamp(x + dx, 0, 100 - w), clamp(y + dy, 0, 100 - h), w, h];

export default function CropField({ src, format, crop, onChange }: Props) {
  // Width divided by height of the image, once it is loaded (of the image it was loaded for).
  const [size, setSize] = useState({ src: '', aspect: 0 });
  const aspect = size.src === src ? size.aspect : 0;
  useEffect(() => {
    let gone = false;
    const img = new Image();
    img.onload = () => !gone && img.naturalHeight && setSize({ src, aspect: img.naturalWidth / img.naturalHeight });
    img.src = shownAt(src);
    return () => {
      gone = true;
    };
  }, [src]);

  // Another image: the part in the middle of it.
  const first = useRef(src);
  useEffect(() => {
    if (src === first.current) return;
    first.current = src;
    onChange((was) => ({ ...was, crop: null }));
  }, [src]);
  useEffect(() => {
    if (format && !crop && aspect) onChange((was) => ({ ...was, crop: middleCrop(aspect, was.format) }));
  }, [format, crop, aspect]);

  const ratio = ratioOf(format);
  const whole = aspect ? middleCrop(aspect, format) : null;
  const zoom = crop && whole ? whole[2] / crop[2] : 1;

  function setZoom(z: number) {
    if (!crop || !whole) return;
    const [x, y, w, h] = crop;
    const [nw, nh] = [whole[2] / z, whole[3] / z];
    onChange((was) => ({ ...was, crop: moved([x + w / 2 - nw / 2, y + h / 2 - nh / 2, nw, nh], 0, 0) }));
  }

  // Dragging the image: the part shown follows the finger (or the mouse).
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; crop: number[] } | null>(null);
  function down(e: PointerEvent) {
    if (!crop) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, crop };
  }
  function move(e: PointerEvent) {
    const d = drag.current;
    const box = frame.current?.getBoundingClientRect();
    if (!d || d.id !== e.pointerId || !box?.width) return;
    const [, , w, h] = d.crop;
    const next = moved(d.crop, (-(e.clientX - d.x) / box.width) * w, (-(e.clientY - d.y) / box.height) * h);
    onChange((was) => ({ ...was, crop: next }));
  }
  const up = (e: PointerEvent) => drag.current?.id === e.pointerId && (drag.current = null);
  function key(e: KeyboardEvent) {
    const step = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key];
    if (!step || !crop) return;
    e.preventDefault();
    onChange((was) => ({ ...was, crop: was.crop && moved(was.crop, step[0], step[1]) }));
  }

  return (
    <div>
      <p className="mb-1 font-medium" id="crop-format">
        {t.media.crop.format}
      </p>
      <SupportingText className="mb-2">{t.media.crop.formatHint}</SupportingText>
      <div role="radiogroup" aria-labelledby="crop-format" className="flex flex-wrap gap-2">
        {['', ...FORMATS].map((f) => {
          const r = ratioOf(f);
          return (
            <FilterChip
              key={f || 'original'}
              selected={f === format}
              onClick={() => onChange(() => ({ format: f, crop: f && aspect ? middleCrop(aspect, f) : null }))}
            >
              {r > 0 && (
                <span
                  aria-hidden="true"
                  className="rounded-[3px] border-[1.5px] border-current"
                  style={{ width: r >= 1 ? 18 : 18 * r, height: r >= 1 ? 18 / r : 18 }}
                />
              )}
              {f || t.media.crop.original}
            </FilterChip>
          );
        })}
      </div>
      {ratio > 0 && crop && (
        <>
          <div
            ref={frame}
            tabIndex={0}
            role="group"
            aria-label={t.media.crop.frame}
            className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-2xl bg-surface-container-high select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
            style={{ aspectRatio: ratio, width: `min(100%, calc(45dvh * ${ratio}))` }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={key}
          >
            <img
              src={shownAt(src)}
              alt=""
              draggable={false}
              className="pointer-events-none absolute top-0 left-0 h-auto max-w-none"
              style={{ width: `${(100 / crop[2]) * 100}%`, transform: `translate(${-crop[0]}%, ${-crop[1]}%)` }}
            />
          </div>
          <SupportingText className="mt-2 text-center">{t.media.crop.drag}</SupportingText>
          <Slider
            label={t.media.crop.zoom}
            className="mt-3"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!whole}
            onChange={setZoom}
          />
        </>
      )}
    </div>
  );
}
