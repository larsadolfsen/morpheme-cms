// The demo's Typography page (demo/src/content/pages/typography.md): under each type style, its class name and the size, line height, tracking and
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
  // The text lists: the first item of the list just above each line (a bullet list, a numbered list, a check list), with the indent of
  // the list, the space the item has above it and the colour of its marker (a check list: of its check).
  const writeLists = () => {
    for (const spec of document.querySelectorAll('[data-type-list-spec]')) {
      const list = spec.previousElementSibling;
      const item = list?.querySelector('li');
      const out = spec.querySelector('[data-type-values]');
      if (!item || !out) continue;
      const style = getComputedStyle(item);
      const tracking = style.letterSpacing === 'normal' ? '0 px' : px(style.letterSpacing);
      const check = item.querySelector('input[type="checkbox"]');
      const marker = check ? getComputedStyle(check).backgroundColor : getComputedStyle(item, '::marker').color;
      out.textContent = `Size ${px(style.fontSize)} · line height ${px(style.lineHeight)} · tracking ${tracking} · weight ${style.fontWeight} · indent ${px(getComputedStyle(list).paddingInlineStart)} · item space ${px(style.marginTop)} · ${check ? 'check' : 'marker'} color ${marker}`;
    }
  };
  write();
  writeLists();
  // A change of width can change a style (a theme may set a size for a wide screen), and the fonts change a sample's box, not its numbers.
  addEventListener('resize', () => {
    write();
    writeLists();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    write();
    writeLists();
  });
})();
