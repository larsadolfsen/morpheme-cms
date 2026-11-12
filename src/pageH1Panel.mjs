// The preview's copy of the coloured H1 panel of a page (theme/layouts/PageLayout.astro): the heading and the text up to the first
// H2 in one section (data-editor="h1-section"). Exposes setH1Panel, which makes, changes or takes away that panel in the page's
// document, whatever the page on the site has. Depends on lib/text-sections.mjs (sectionClass); used by pagePreview.tsx.
import { sectionClass } from '../lib/text-sections.mjs';

/** Puts the page's header (the layout's `article > header`) in a panel with these settings (h1Section in lib/without-h1.mjs: a colour,
 * a picture behind it, the whole width), with the intro (HTML, in the text's own class) after it; no settings (null) leaves the
 * header without a panel. A panel the site's page has is first taken away. `src`: the picture's address as the preview shows it.
 * @param {Document} doc @param {{ color: string, picture?: string, alt?: string, width?: string } | null} settings @param {string} introHtml
 * @param {string} [src] */
export function setH1Panel(doc, settings, introHtml, src = settings?.picture) {
  const header = doc.querySelector('article > header');
  const text = doc.querySelector('[data-editor="text"]');
  if (!header || !text) return;
  const old = header.querySelector('[data-editor="h1-section"]');
  if (old) {
    old.querySelector('[data-editor="intro"]')?.remove();
    old.querySelector(':scope > img.text-section-image')?.remove();
    old.replaceWith(...Array.from(old.childNodes));
  }
  if (!settings) return;
  const panel = doc.createElement('section');
  panel.setAttribute('data-editor', 'h1-section');
  panel.className = sectionClass(settings.color, settings);
  if (settings.picture) {
    const img = doc.createElement('img');
    img.className = 'text-section-image';
    img.src = src ?? settings.picture;
    img.alt = settings.alt ?? '';
    panel.append(img);
  }
  panel.append(...Array.from(header.childNodes));
  if (introHtml.trim()) {
    const intro = doc.createElement(text.tagName);
    intro.setAttribute('data-editor', 'intro');
    intro.className = text.className;
    intro.innerHTML = introHtml;
    panel.append(intro);
  }
  header.append(panel);
}
