// The demo's Type page (demo/src/content/pages/type.md): under each type style, its class name and the size, line height, tracking and
// weight the browser gives the sample, read from the computed style, so they follow the width of the screen and the theme. Only the
// demo's build puts this file in a page (scripts/demo-build.mjs, scripts/demo-type.mjs): never the starter, never a site. No inline
// script, no eval, no request.
(() => {
  // 16px, not 16.000001px: a number as a person writes it.
  const px = (value) => `${Math.round(parseFloat(value) * 100) / 100} px`;
  const write = () => {
    for (const spec of document.querySelectorAll('[data-type-spec]')) {
      const sample = document.querySelector(`[data-type-sample="${spec.dataset.typeSpec}"]`);
      const out = spec.querySelector('[data-type-values]');
      if (!sample || !out) continue;
      const style = getComputedStyle(sample);
      const tracking = style.letterSpacing === 'normal' ? '0 px' : px(style.letterSpacing);
      out.textContent = `Size ${px(style.fontSize)} · line height ${px(style.lineHeight)} · tracking ${tracking} · weight ${style.fontWeight}`;
    }
  };
  write();
  // A change of width can change a style (a theme may set a size for a wide screen), and the fonts change a sample's box, not its numbers.
  addEventListener('resize', write);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', write);
})();
