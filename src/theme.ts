// Light or dark: as the phone or computer is set (auto), or always light or dark, picked on the account
// and kept in this browser. It is set on <html> as data-theme, which the site's colours follow
// (the theme's styles/global.css); the script in the head of packages/editor/pages/editor/index.astro does the same
// before the page is drawn, so it does not flash in the other colours. Its own key, so the site's
// choice (`theme`) is not changed by the editor's.
import { colorsCss, isColor, pageColor, type Colors } from '../lib/colors';
import { motionCss, type MotionScheme } from '../lib/motion';

export type Theme = 'light' | 'auto' | 'dark';

const KEY = 'editor-theme';

export function savedTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'auto';
  } catch {
    return 'auto';
  }
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {}
  applyTheme(theme);
}

// The colour of the phone's top bar (the theme-color tags) follows a chosen theme too: each tag has the
// colour of its own mode in data-color (packages/editor/pages/editor/index.astro), and a picked mode puts its
// colour in both.
const bars = () => Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
const isDark = (m: HTMLMetaElement) => m.media.includes('dark');

// A screen that shows one mode at a time (Farver) holds the editor in it while it is open, whatever is
// picked on the account; null lets go again. A change of the site's colours meanwhile (applyColors)
// keeps it.
let held: 'light' | 'dark' | null = null;

export function holdTheme(mode: 'light' | 'dark' | null) {
  held = mode;
  applyTheme(savedTheme());
}

/** The mode the editor is shown in now: the one picked, or, on Auto, the phone's or computer's. */
export function shownMode(): 'light' | 'dark' {
  const theme = held ?? savedTheme();
  if (theme !== 'auto') return theme;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(chosen: Theme) {
  const theme = held ?? chosen;
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const all = bars();
  const picked = all.find((m) => isDark(m) === (theme === 'dark'));
  for (const m of all) m.content = (theme === 'auto' ? m.dataset.color : picked?.dataset.color) ?? m.content;
}

// The site's colours (colors.json, "Farver") as the editor has loaded them, in place of the ones its page
// was built with, so a change shows at once, before the site is built again: the CSS (colorsCss) in the
// <style> of the page, and the top bar in the background's colour.
export function applyColors(colors: Colors) {
  let css: string;
  try {
    css = colorsCss(colors);
  } catch {
    return;
  }
  const style = document.getElementById('site-colors');
  if (style && style.textContent !== css) style.textContent = css;
  for (const m of bars()) {
    const bg = pageColor(colors[isDark(m) ? 'dark' : 'light']);
    if (isColor(bg)) m.dataset.color = bg;
  }
  applyTheme(savedTheme());
}

// How the site moves ("Bevægelse") as the editor has loaded it, in place of the scheme its page was built with, so a new
// choice shows at once, before the site is built again: its springs (motionCss) in the <style> of the page, and its name
// on <html> for what animates in a script.
export function applyMotion(scheme: MotionScheme) {
  const css = motionCss(scheme);
  const style = document.getElementById('site-motion');
  if (style && style.textContent !== css) style.textContent = css;
  document.documentElement.dataset.motionScheme = scheme;
}
