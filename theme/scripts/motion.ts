// Page motion, using Motion's vanilla API (same engine as motion/react, without React).
// Every animation has a job:
//   [data-reveal]  sections fade up once as they reach the viewport (storytelling)
// With prefers-reduced-motion everything is shown instantly.
import { animate, inView } from 'motion';
import { themeEase } from '@theme/scripts/ease';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = themeEase();

// Tells the safety net in Base.astro that the sections are taken care of. One it already showed
// (this script came late) stays as it is rather than fading in again.
document.documentElement.dataset.motion = 'ready';
const reveals = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => el.style.opacity !== '1');

if (reduce) {
  reveals.forEach((el) => (el.style.opacity = '1'));
} else {
  reveals.forEach((el) => {
    inView(
      el,
      () => {
        animate(el, { opacity: [0, 1], y: [32, 0] }, { duration: 0.9, ease });
      },
      { margin: '0px 0px -10% 0px' },
    );
  });
}
