// How the site moves: Material 3's motion schemes (m3.material.io/styles/motion/overview/how-it-works), springs that
// say how something moves (spatial: a sheet that slides in, a button that changes shape) and how something changes
// (effects: a colour, something that fades), each fast, default or slow. A scheme is the owner's choice under
// "Appearance" › "Motion" (config.motion, e.g. src/data/motion.json: `{ "scheme": "expressive" }`), else the theme's
// ("motion" in its theme.json), else the standard theme's (schemeInUse):
//   expressive  Material 3 Expressive's: what moves overshoots a little and settles, as on a phone
//   standard    Material 3's standard: what moves glides into place
//   calm        ours: what moves does so quickly without overshooting, and the sections are shown at once (no reveal)
// The site writes the scheme's springs into the <head> of its pages as CSS variables (motionCss, with data-motion on
// <html>), which every transition and animation of the theme takes (ui.css, blocks.css: `transition: transform
// var(--motion-spatial-fast)`), and its scripts animate with the same springs (motionSpring, for Motion). A visitor who
// has asked for reduced motion gets less, whatever the scheme. No React or browser here: the build uses it too.

import { MOTION_SCHEMES } from './motion-schemes.mjs';

export { MOTION_SCHEMES };
export type MotionScheme = (typeof MOTION_SCHEMES)[number];
/** The standard theme's, when neither the owner nor the theme has chosen one. */
export const DEFAULT_SCHEME: MotionScheme = 'standard';

export const MOTION_KINDS = ['spatial', 'effects'] as const;
export type MotionKind = (typeof MOTION_KINDS)[number];
export const MOTION_SPEEDS = ['fast', 'default', 'slow'] as const;
export type MotionSpeed = (typeof MOTION_SPEEDS)[number];

/** A spring with a mass of 1: how damped it is (1: it does not overshoot; less: it does, and settles) and how stiff. */
export type Spring = { damping: number; stiffness: number };
type Springs = Record<MotionKind, Record<MotionSpeed, Spring>>;

// Material's effects springs, the same in both of its schemes: they never overshoot (a colour cannot).
const EFFECTS: Record<MotionSpeed, Spring> = {
  fast: { damping: 1, stiffness: 3800 },
  default: { damping: 1, stiffness: 1600 },
  slow: { damping: 1, stiffness: 800 },
};

/** Each scheme's springs: Material 3's tokens (md.sys.motion.spring.*) for expressive and standard. */
export const SPRINGS: Record<MotionScheme, Springs> = {
  expressive: {
    spatial: { fast: { damping: 0.6, stiffness: 800 }, default: { damping: 0.8, stiffness: 380 }, slow: { damping: 0.8, stiffness: 200 } },
    effects: EFFECTS,
  },
  standard: {
    spatial: { fast: { damping: 0.9, stiffness: 1400 }, default: { damping: 0.9, stiffness: 700 }, slow: { damping: 0.9, stiffness: 300 } },
    effects: EFFECTS,
  },
  calm: { spatial: EFFECTS, effects: EFFECTS },
};

/** Whether a value is one of the schemes. */
export const isMotionScheme = (value: unknown): value is MotionScheme => MOTION_SCHEMES.includes(value as MotionScheme);

/** The scheme the site moves by: the one chosen (config.motion's `scheme`), else the theme's ("motion" in its theme.json),
 * else the standard theme's, else DEFAULT_SCHEME. One that is not a scheme counts as none (check:content says so). */
export function schemeInUse(chosen: unknown, theme: unknown, standard?: unknown): MotionScheme {
  return [chosen, theme, standard].find(isMotionScheme) ?? DEFAULT_SCHEME;
}

// How far from where it is going a spring counts as there, and how often the curve is drawn.
const SETTLED = 0.001;
const STEP = 1 / 60;

/** Where a spring that starts still at 0 is at `t` seconds, on its way to 1. */
function position({ damping, stiffness }: Spring, t: number): number {
  const w = Math.sqrt(stiffness);
  if (damping >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - damping * damping);
  return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t));
}

/** A spring as CSS: how long it takes to settle, and its curve as a linear() easing (the spring's own way there, overshoot
 * and all), for `transition` and `animation`. */
export function springCss(spring: Spring): { duration: number; easing: string } {
  // The last moment it is not yet there, to the millisecond.
  let settled = 0;
  for (let t = 0; t < 3; t += 0.001) if (Math.abs(1 - position(spring, t)) >= SETTLED) settled = t;
  const duration = Math.ceil(settled * 100) / 100;
  const steps = Math.max(Math.round(duration / STEP), 8);
  const points = Array.from({ length: steps + 1 }, (_, i) => (i === steps ? 1 : +position(spring, (i / steps) * duration).toFixed(3)));
  return { duration: Math.round(duration * 1000), easing: `linear(${points.join(',')})` };
}

/** A spring's CSS variable: `--motion-spatial-fast`, `--motion-effects` (default), `--motion-effects-slow`. */
export const motionVariable = (kind: MotionKind, speed: MotionSpeed) => `--motion-${kind}${speed === 'default' ? '' : `-${speed}`}`;

/** A scheme as CSS for a <style> in the <head>: each spring as its duration and curve
 * (`--motion-spatial-fast: 290ms linear(…)`), to use as `transition: transform var(--motion-spatial-fast)`, and its
 * duration alone (`--motion-spatial-fast-duration`), for what must last as long as it (a `visibility` that waits for it,
 * a `display … allow-discrete`); and the default spatial and effects curves alone (--motion-ease, --motion-ease-quick),
 * for what has its own duration (--block-ease and --block-ease-quick in blocks.css, --ease in base.css). */
export function motionCss(scheme: MotionScheme): string {
  const springs = SPRINGS[scheme];
  const declarations = MOTION_KINDS.flatMap((kind) =>
    MOTION_SPEEDS.map((speed) => {
      const { duration, easing } = springCss(springs[kind][speed]);
      const name = motionVariable(kind, speed);
      return `${name}:${duration}ms ${easing};${name}-duration:${duration}ms;`;
    }),
  );
  const ease = springCss(springs.spatial.default).easing;
  const quick = springCss(springs.effects.default).easing;
  return `:root{${declarations.join('')}--motion-ease:${ease};--motion-ease-quick:${quick};}`;
}

/** A spring as Motion takes it (motion.dev: `animate(el, …, motionSpring('spatial'))`), in the scheme on the page
 * (data-motion-scheme on <html>, set where motionCss is), else DEFAULT_SCHEME: its stiffness and its damping as a force, for a
 * mass of 1. */
export function motionSpring(kind: MotionKind, speed: MotionSpeed = 'default', scheme: MotionScheme = pageScheme()) {
  const { damping, stiffness } = SPRINGS[scheme][kind][speed];
  return { type: 'spring' as const, stiffness, damping: 2 * damping * Math.sqrt(stiffness), mass: 1 };
}

/** A spring as the browser's own animations take it (`el.animate(keyframes, motionTiming('spatial'))`), in the scheme on
 * the page: how long it takes, and its curve. */
export function motionTiming(kind: MotionKind, speed: MotionSpeed = 'default', scheme: MotionScheme = pageScheme()) {
  return springCss(SPRINGS[scheme][kind][speed]);
}

/** The scheme the page moves by (data-motion-scheme on <html>), else DEFAULT_SCHEME; without a browser, DEFAULT_SCHEME. */
export function pageScheme(): MotionScheme {
  if (typeof document === 'undefined') return DEFAULT_SCHEME;
  const scheme = document.documentElement.dataset.motionScheme;
  return isMotionScheme(scheme) ? scheme : DEFAULT_SCHEME;
}

/** Whether the page's things should only appear, not move in: the calm scheme, or a visitor who has asked for reduced
 * motion. */
export function motionReduced(): boolean {
  if (typeof document === 'undefined') return true;
  return pageScheme() === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
