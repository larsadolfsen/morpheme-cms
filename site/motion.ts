// The motion scheme the site and the editor are built with (packages/editor/lib/motion.ts: schemeInUse): the one chosen
// under "Udseende" › "Bevægelse" (src/data/motion.json, `{ "scheme": "<scheme>" }`), else the theme in use's ("motion" in
// its theme.json), else the standard theme's. Base.astro and the editor's page write it into the <head> (motionCss, and
// data-motion-scheme on <html>); the editor shows a new choice at once (applyMotion in packages/editor/src/theme.ts).
import { schemeInUse } from '../lib/motion';
import theme from '@theme/theme.json';
import standard from '@saturn/theme.json';

type Manifest = { motion?: unknown };
const chosen = import.meta.glob<{ scheme?: unknown }>('/src/data/motion.json', { eager: true, import: 'default' })['/src/data/motion.json'];

/** The scheme the site moves by. */
export const motionScheme = schemeInUse(chosen?.scheme, (theme as Manifest).motion, (standard as Manifest).motion);
