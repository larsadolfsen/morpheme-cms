// Progress indicators (m3.material.io/components/progress-indicators, .linear-progress-indicator and
// .circular-progress-indicator in ../styles/ui.css): how far something has come (`value`, 0 to 1: determinate), as a
// line that fills up (LinearProgressIndicator) or a ring (CircularProgressIndicator, where there is no room for a
// line), the active indicator on its track; without `value` (indeterminate), that it is on its way, as stretches that
// run along the line or round the ring. M3 Expressive's shape (`shape`: flat, the default, or wavy, the active
// indicator a wave that flows along it) and its thick track (`thick`) are Material's names; how they look is the
// theme's (--linear-progress-indicator-*, --circular-progress-indicator-*). The wave is drawn here as an SVG path (a
// line, not an icon), Material's: 3px high and 40px long on a line (24px while indeterminate), nine waves round a ring
// (six round a thick one).
// Screen readers read a progress bar named by `label`, with its value in percent when it is known. With reduced motion
// the indeterminate ones move slowly, the wave stands still and a value changes at once. The value is the custom
// property --progress on the element, so a script can change it (with aria-valuenow).
import type { CSSProperties } from 'react';

/** A progress indicator's shapes, as M3 Expressive names them. */
export type ProgressIndicatorShape = 'flat' | 'wavy';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

// What a progress bar is to screen readers, and its value for the CSS (with the wave's measures for a wavy one).
function progressbar(value: number | undefined, label: string, wave?: Record<string, string | number>) {
  const known = value !== undefined;
  const style = { ...(known ? { '--progress': clamp(value) } : {}), ...wave } as CSSProperties;
  return {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': known ? Math.round(clamp(value) * 100) : undefined,
    style: Object.keys(style).length ? style : undefined,
  };
}

const classes = (part: string, indeterminate?: boolean, shape: ProgressIndicatorShape = 'flat', thick = false) =>
  [part, indeterminate && `${part}-indeterminate`, shape === 'wavy' && `${part}-wavy`, thick && `${part}-thick`].filter(Boolean).join(' ');

/** A linear progress indicator's classes: determinate or not, its shape and a thick track. */
export const linearProgressIndicatorClass = (indeterminate?: boolean, shape?: ProgressIndicatorShape, thick?: boolean) =>
  classes('linear-progress-indicator', indeterminate, shape, thick);
/** A circular progress indicator's classes: determinate or not, its shape and a thick track. */
export const circularProgressIndicatorClass = (indeterminate?: boolean, shape?: ProgressIndicatorShape, thick?: boolean) =>
  classes('circular-progress-indicator', indeterminate, shape, thick);

// The line's wave, in px: its height (amplitude) and length (wavelength), and a path of it long enough for any line,
// from one wavelength before its start (where it flows in from), in quadratic curves, a peak and a trough each.
const AMPLITUDE = 3;
const WAVELENGTH = { determinate: 40, indeterminate: 24 };
const LENGTH = 4096;
function linePath(wavelength: number) {
  const half = wavelength / 2;
  const turns = Math.ceil((LENGTH + wavelength) / half);
  return `M${-wavelength} 0q${half / 2} ${-2 * AMPLITUDE} ${half} 0${` t${half} 0`.repeat(turns - 1)}`;
}
// How much longer the wave is than the line it runs along (for its dashes, which CSS measures along the path).
function stretch(wavelength: number) {
  const half = wavelength / 2;
  let length = 0;
  let last = [0, 0];
  for (let i = 1; i <= 64; i++) {
    const t = i / 64;
    const point = [2 * (1 - t) * t * (half / 2) + t * t * half, 2 * (1 - t) * t * -2 * AMPLITUDE];
    length += Math.hypot(point[0] - last[0], point[1] - last[1]);
    last = point;
  }
  return length / half;
}
const lines = {
  determinate: { d: linePath(WAVELENGTH.determinate), stretch: stretch(WAVELENGTH.determinate) },
  indeterminate: { d: linePath(WAVELENGTH.indeterminate), stretch: stretch(WAVELENGTH.indeterminate) },
};

// The ring's wave in its 48 wide box: nine waves round it (a thick one six, longer for its thicker line), its radius
// in from the box's edge for its height and thickness, as a path of points (pathLength 100, as the ring's).
function ringPath(r: number, amplitude: number, waves: number) {
  const points = Array.from({ length: 180 }, (_, i) => {
    const angle = (i / 180) * 2 * Math.PI;
    const at = r + amplitude * Math.sin(waves * angle);
    return `${(24 + at * Math.cos(angle)).toFixed(2)} ${(24 + at * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join('L')}Z`;
}
const rings = { wavy: ringPath(19, 1.25, 9), wavyThick: ringPath(17.5, 1.5, 6) };

export function LinearProgressIndicator({
  value,
  label,
  shape = 'flat',
  thick,
  className,
  ...rest
}: { value?: number; label: string; shape?: ProgressIndicatorShape; thick?: boolean; className?: string } & Record<string, unknown>) {
  const indeterminate = value === undefined;
  const wavy = shape === 'wavy';
  const line = lines[indeterminate ? 'indeterminate' : 'determinate'];
  const wave = wavy
    ? {
        '--linear-progress-indicator-amplitude': `${AMPLITUDE}px`,
        '--linear-progress-indicator-wavelength': `${WAVELENGTH[indeterminate ? 'indeterminate' : 'determinate']}px`,
        '--linear-progress-indicator-stretch': line.stretch.toFixed(4),
      }
    : undefined;
  return (
    <div
      className={[linearProgressIndicatorClass(indeterminate, shape, thick), className].filter(Boolean).join(' ')}
      {...progressbar(value, label, wave)}
      {...rest}
    >
      {wavy ? (
        <>
          {!indeterminate && <span className="linear-progress-indicator-track"></span>}
          <svg className="linear-progress-indicator-wave" aria-hidden="true">
            <path className="linear-progress-indicator-active" d={line.d} />
            {indeterminate && <path className="linear-progress-indicator-active" d={line.d} />}
          </svg>
          {!indeterminate && <span className="linear-progress-indicator-stop"></span>}
        </>
      ) : indeterminate ? (
        <>
          <span className="linear-progress-indicator-active"></span>
          <span className="linear-progress-indicator-active"></span>
        </>
      ) : (
        <>
          <span className="linear-progress-indicator-active"></span>
          <span className="linear-progress-indicator-track"></span>
          <span className="linear-progress-indicator-stop"></span>
        </>
      )}
    </div>
  );
}

export function CircularProgressIndicator({
  value,
  label,
  shape = 'flat',
  thick,
  className,
  ...rest
}: { value?: number; label: string; shape?: ProgressIndicatorShape; thick?: boolean; className?: string } & Record<string, unknown>) {
  const indeterminate = value === undefined;
  const wavy = shape === 'wavy';
  // A ring 48 wide, its stroke inside it (a thick or wavy one further in); the lengths along it in percent
  // (pathLength).
  const ring = { cx: 24, cy: 24, r: wavy ? (thick ? 17.5 : 19) : thick ? 19 : 20, pathLength: 100, fill: 'none' };
  return (
    <span
      className={[circularProgressIndicatorClass(indeterminate, shape, thick), className].filter(Boolean).join(' ')}
      {...progressbar(value, label)}
      {...rest}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        {!indeterminate && <circle className="circular-progress-indicator-track" {...ring} />}
        {wavy ? (
          <path className="circular-progress-indicator-active" d={thick ? rings.wavyThick : rings.wavy} pathLength={100} fill="none" />
        ) : (
          <circle className="circular-progress-indicator-active" {...ring} />
        )}
      </svg>
    </span>
  );
}
