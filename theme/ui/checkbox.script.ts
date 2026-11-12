// What a checkbox (Checkbox.tsx) does on the site: one that is indeterminate (data-indeterminate) is shown so, as the
// browser only has that as a property, until it is clicked. Run on every page by the theme's Base.astro (blockScripts,
// packages/editor/site/blockScripts.ts); without such a checkbox on the page it does nothing.
export default function checkbox() {
  document.querySelectorAll<HTMLInputElement>('input[data-indeterminate]').forEach((input) => {
    input.indeterminate = true;
  });
}
