// How the sections of this site's fixed pages look on the site, so the editor shows them so too
// (looksOf in packages/editor/src/sections.mjs, editor.css). By file and section type, the looks of a section's
// heading and the text under it; without one, a heading looks like the page's other headings.
export const LOOKS = {
  'src/data/home.json:topics': { heading: 'section', body: 'section-intro' },
  'src/data/home.json:testimonials': { heading: 'section' },
  'src/data/home.json:about': { heading: 'section', body: 'about' },
  'src/data/home.json:ways': { heading: 'section' },
  'src/data/home.json:steps': { heading: 'section' },
  'src/data/home.json:prices': { heading: 'section', body: 'note' },
  'src/data/home.json:posts': { heading: 'section' },
  'src/data/home.json:where': { heading: 'card-title', body: 'note' },
  'src/data/prices.json:cancellation': { heading: 'page-section', body: 'page-section-intro' },
  'src/data/prices.json:payment': { heading: 'page-section', body: 'small-note' },
  'src/data/prices.json:urgent': { heading: 'urgent', body: 'note' },
  'src/data/contact.json:where': { heading: 'page-section', body: 'large' },
  'src/data/contact.json:routes': { heading: 'page-section' },
};

// The look of the other headings of a fixed page, when not 'page-section' (the front page's are bigger).
export const HEADINGS = { 'src/data/home.json': 'section' };
