// Pop-ups: one JSON file per pop-up in src/data/popups/, edited in the editor (/editor/,
// "Indhold" › "Pop op-vinduer"). Each is shown on the pages picked for it (`pages`, their addresses),
// `delay` seconds after the page opens, `scroll` % down it or as the visitor is about to leave it
// (`trigger`), until the visitor closes it (src/components/Popup.astro).
type PopupData = {
  enabled?: boolean;
  /** The picture at the top (its address on the site). */
  image?: string;
  heading: string;
  /** Paragraphs separated by a blank line. */
  text?: string;
  pages: string[];
  /** When it opens: after `delay`, at `scroll`, or as the visitor is about to leave (without one, the time). */
  trigger?: 'time' | 'scroll' | 'exit';
  /** Seconds, as the editor's select writes them ("0", "5" …). */
  delay?: string;
  /** How far down the page, in % ("25" … "100"). */
  scroll?: string;
  /** Where its button goes: the booking sheet, the phone, a page (`href`), a PDF to download (`file`,
   * /filer/<name>.pdf), or no button. */
  button?: 'booking' | 'phone' | 'page' | 'file' | 'none';
  /** The button's own text; empty, the target's or the page's name ("Download PDF" for a PDF). */
  label?: string;
  href?: string;
  file?: string;
};

export type Popup = {
  /** The file name, e.g. "rabat-i-december": what the visitor's browser remembers it was closed by. */
  slug: string;
  image?: string;
  heading: string;
  /** One string per paragraph. */
  text: string[];
  pages: string[];
  trigger: 'time' | 'scroll' | 'exit';
  delay: number;
  scroll: number;
  button?: { to: 'booking' | 'phone' | 'page' | 'file'; label?: string; href?: string };
};

const files = import.meta.glob<PopupData>('./popups/*.json', { eager: true, import: 'default' });

export const popups: Popup[] = Object.entries(files)
  .filter(([, p]) => p.enabled !== false)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, p]) => ({
    slug: file.replace(/^.*\/|\.json$/g, ''),
    image: p.image || undefined,
    heading: p.heading,
    text: (p.text ?? '')
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .filter(Boolean),
    pages: p.pages ?? [],
    trigger: p.trigger === 'scroll' || p.trigger === 'exit' ? p.trigger : 'time',
    delay: Number(p.delay) || 0,
    scroll: Number(p.scroll) || 25,
    button: !p.button || p.button === 'none' ? undefined : { to: p.button, label: p.label, href: p.button === 'file' ? p.file : p.href },
  }));

/** The pop-ups of a page, by its address (with or without the / at the end). */
export const popupsAt = (path: string) => {
  const at = path.endsWith('/') ? path : `${path}/`;
  return popups.filter((p) => p.pages.includes(at));
};
