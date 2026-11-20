// What a slider (Slider.tsx) does on the site: its tracks, stops and value labels follow its handles (updateSlider in
// sliderUpdate.ts). Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without a slider on the
// page it does nothing.
import { updateSlider } from './sliderUpdate';

export default function slider() {
  document.querySelectorAll<HTMLElement>('[data-slider]').forEach((root) => {
    root.addEventListener('input', (e) => updateSlider(root, e.target));
    // The values the browser may have put back (going back to the page).
    updateSlider(root);
  });
}
