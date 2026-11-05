// The preview's copy of the coloured H1 panel of a page (theme/layouts/PageLayout.astro): the heading and the text up to the first
// H2 in one section (data-editor="h1-section"). Exposes setH1Panel, which makes, changes or takes away that panel in the page's
// document, whatever the page on the site has. Depends on lib/text-sections.mjs (sectionClass); used by pagePreview.tsx.
import { sectionClass } from '../lib/text-sections.mjs';

/** Puts the page's header (the layout's `article > header`) in a panel of this colour, with the intro (HTML, in the text's own
 * class) after it; no colour (null) leaves the header without a panel. A panel the site's page has is first taken away.
 * @param {Document} doc @param {string | null} color @param {string} introHtml */
export function setH1Panel(doc, color, introHtml) {
  const header = doc.querySelector('article > header');
  const text = doc.querySelector('[data-editor="text"]');
  if (!header || !text) return;
  const old = header.querySelector('[data-editor="h1-section"]');
  if (old) {
    old.querySelector('[data-editor="intro"]')?.remove();
    old.replaceWith(...Array.from(old.childNodes));
  }
  if (!color) return;
  const panel = doc.createElement('section');
  panel.setAttribute('data-editor', 'h1-section');
  panel.className = sectionClass(color);
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
