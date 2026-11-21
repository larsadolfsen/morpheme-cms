// A person's editor settings, kept on the person (worker/settings.js): for now how much fits on the screen, Density
// (docs/superpowers/specs/2026-11-13-density-design.md). Medium is the default (0), Small one denser (-1); Large (+1) went in 0.19.5, and a stored `large` is read as Medium.
// Plain JavaScript so the Worker, the editor and the checks share it.

/** The steps of Density, in the order the editor offers them. */
export const DENSITIES = ['medium', 'small'];
export const DEFAULT_DENSITY = 'medium';

/** The value of `data-density` on <html> for a step (the theme's base.css reads -1; 0 is Medium). */
export const DENSITY_ATTRIBUTE = { medium: '0', small: '-1' };

/** A stored or sent step as one the editor offers: `large` (gone in 0.19.5) is Medium, anything unknown is null. */
export const readDensity = (value) => (value === 'large' ? 'medium' : DENSITIES.includes(value) ? value : null);

/** `{ density }` cleaned from a stored or sent value, or null when it is not a settings record. Fields that are not
 * known are dropped; a missing density is left out. */
export function validSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clean = {};
  if ('density' in value) {
    const density = readDensity(value.density);
    if (!density) return null;
    clean.density = density;
  }
  return clean;
}
