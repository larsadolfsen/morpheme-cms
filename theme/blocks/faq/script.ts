// Rows that fold out (Accordion.tsx), on the site: the text of a row that opens fades in, and where the browser cannot
// animate ::details-content the height glides (and this keeps one row open). Reduced motion: no animation. Run on
// every page by the theme's Base.astro (blockScripts, src/site/scripts.ts).
export default function accordion() {
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The theme's easing (blocks.css, --block-ease).
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--block-ease').trim() || 'ease';
  const bodyOf = (d: HTMLDetailsElement) => d.querySelector<HTMLElement>('.block-accordion-body')!;

  // The text of a row that opens fades in and rises a little (also when find-in-page opens it).
  document.querySelectorAll<HTMLDetailsElement>('details.block-accordion-row').forEach((d) =>
    d.addEventListener('toggle', () => {
      if (d.open && !still())
        bodyOf(d).animate(
          [
            { opacity: 0, transform: 'translateY(0.5rem)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 450,
            easing,
          },
        );
    }),
  );

  // Browsers that cannot animate ::details-content: the height glides here. Then this keeps one row
  // open (the same name would close the other at once, before it could glide shut).
  if (!CSS.supports('selector(::details-content)')) {
    const glide = (d: HTMLDetailsElement, open: boolean) => {
      const body = bodyOf(d);
      if (open) d.open = true;
      const full = { height: `${body.offsetHeight}px`, paddingBottom: getComputedStyle(body).paddingBottom };
      const shut = { height: '0px', paddingBottom: '0px' };
      body.style.overflow = 'hidden';
      const run = body.animate(open ? [shut, full] : [full, shut], { duration: 400, easing });
      run.onfinish = run.oncancel = () => {
        body.style.overflow = '';
        if (!open) d.open = false;
      };
    };
    document.querySelectorAll<HTMLDetailsElement>('details.block-accordion-row').forEach((d) => {
      const group = d.getAttribute('name');
      d.removeAttribute('name');
      d.querySelector('summary')!.addEventListener('click', (e) => {
        const others = [
          ...document.querySelectorAll<HTMLDetailsElement>(`details.block-accordion-row[data-group="${group}"][open]`),
        ].filter((o) => o !== d);
        if (still()) return others.forEach((o) => (o.open = false));
        e.preventDefault();
        if (d.open) return glide(d, false);
        others.forEach((o) => glide(o, false));
        glide(d, true);
      });
      d.dataset.group = group ?? '';
    });
  }
}
