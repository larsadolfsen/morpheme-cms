// The keys the editor shows and listens to, for this computer: ⌘ on a Mac, Ctrl elsewhere (lib/actionRules.mjs has the rules; this reads the platform).
// Exposes isMac, shortcutText, ariaShortcut, pressed.
import { ariaKeyShortcuts, formatShortcut, matchesShortcut } from '../lib/actionRules.mjs';

/** Whether this is a Mac (or an iPad or iPhone with a keyboard): ⌘ is its Mod key. */
export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** A key as people read it here: "Ctrl+K", or "⌘K" on a Mac. */
export const shortcutText = (key: string) => formatShortcut(key, isMac());

/** A key for `aria-keyshortcuts`. */
export const ariaShortcut = (key: string) => ariaKeyShortcuts(key, isMac());

/** Whether a key event is this key here. */
export const pressed = (e: KeyboardEvent, key: string) => matchesShortcut(e, key, isMac());
