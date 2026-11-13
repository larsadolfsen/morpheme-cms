// A person's editor settings, kept on the person (worker/settings.js): for now how much fits on the screen, Density
// (docs/superpowers/specs/2026-11-13-density-design.md). Large is a step looser than Medium (+1), Small one denser (-1).
// Plain JavaScript so the Worker, the editor and the checks share it.

/** The steps of Density, in the order the editor offers them. */
export const DENSITIES = ['large', 'medium', 'small'];
export const DEFAULT_DENSITY = 'medium';

/** The value of `data-density` on <html> for a step (the theme's base.css reads 1 and -1; 0 is Medium). */
export const DENSITY_ATTRIBUTE = { large: '1', medium: '0', small: '-1' };

/** `{ density }` cleaned from a stored or sent value, or null when it is not a settings record. Fields that are not
 * known are dropped; a missing density is left out. */
export function validSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clean = {};
  if ('density' in value) {
    if (!DENSITIES.includes(value.density)) return null;
    clean.density = value.density;
  }
  return clean;
}
