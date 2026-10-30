// What a slider (Slider.tsx) does as its handles are moved, on the site (slider.script.ts) and in the editor (the
// part's own input event): its tracks, its stops and the labels with its values follow the handles (the variables
// --slider-start and --slider-end, 0–1, on .slider, and on a centered one data-below-center while its handle is on
// the start's side of the middle), and a range's two handles cannot pass each other. The handles themselves are native
// range inputs, so the arrow keys, Home, End, Page Up and Page Down move them.

/** Where a value is between `min` and `max`, from 0 to 1. */
const fractionOf = (value: number, min: number, max: number) => (max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0);

/** Where a slider's active track starts and ends (0–1): a range's between its two handles, a centered one's between
 * the middle and its handle, else from the start. */
export function sliderPlace(values: number[], min: number, max: number, centered = false) {
  const end = fractionOf(values[values.length - 1], min, max);
  if (centered) return { start: Math.min(0.5, end), end: Math.max(0.5, end) };
  return { start: values.length > 1 ? fractionOf(values[0], min, max) : 0, end };
}

/** Whether a stop at `value` is on the active track, and whether a handle stands on it (it is hidden under it). */
export function stopState(value: number, values: number[], min: number, max: number, centered = false) {
  const last = values[values.length - 1];
  const middle = (min + max) / 2;
  const [from, to] = centered ? [Math.min(middle, last), Math.max(middle, last)] : [values.length > 1 ? values[0] : min, last];
  return { active: value >= from && value <= to, under: values.includes(value) };
}

/** Puts a slider (its .slider element) where its handles are, after `moved` was moved. */
export function updateSlider(root: HTMLElement, moved?: EventTarget | null) {
  const inputs = [...root.querySelectorAll<HTMLInputElement>('[data-slider-input]')];
  if (!inputs.length) return;
  const first = inputs[0];
  const last = inputs[inputs.length - 1];
  if (first !== last && Number(first.value) > Number(last.value)) {
    if (moved === first) first.value = last.value;
    else last.value = first.value;
  }
  const values = inputs.map((i) => Number(i.value));
  const min = Number(first.min);
  const max = Number(first.max);
  const centered = root.classList.contains('slider-centered');
  const { start, end } = sliderPlace(values, min, max, centered);
  root.style.setProperty('--slider-start', String(start));
  root.style.setProperty('--slider-end', String(end));
  // Two handles in the same place: the one that can still move is on top (the start's at the end of the track).
  root.toggleAttribute('data-start-on-top', first !== last && start > 0.5);
  root.toggleAttribute('data-below-center', centered && values[0] < (min + max) / 2);
  root.querySelectorAll<HTMLElement>('[data-slider-value]').forEach((label, i) => (label.textContent = String(values[i])));
  root.querySelectorAll<HTMLElement>('[data-slider-stop]').forEach((stop) => {
    const { active, under } = stopState(Number(stop.dataset.sliderStop), values, min, max, centered);
    stop.toggleAttribute('data-active', active);
    stop.toggleAttribute('data-under', under);
  });
}
