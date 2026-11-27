// Material 3's reference palette tones that are not colour roles. `md.ref.palette.neutral-variant20` is the colour of the
// navigation drawer's scrim (`md.comp.navigation-drawer.scrim.color`, docs/m3-tokens/md.comp.navigation-drawer.json): tone 20
// of the neutral variant palette of the site's source colour, the same in light and dark mode. Made at build from the
// site's stored `dynamic` source, so colors.json has no new field. No React or browser here.
import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

/** Tone 20 of the neutral variant palette (SchemeTonalSpot, Material's default) of `source` ("#rrggbb"), as "#rrggbb";
 * undefined when `source` is not a hex colour. */
export function neutralVariant20(source: unknown): string | undefined {
  if (typeof source !== 'string' || !/^#[0-9a-f]{6}$/i.test(source)) return undefined;
  return hexFromArgb(new SchemeTonalSpot(Hct.fromInt(argbFromHex(source)), false, 0).neutralVariantPalette.tone(20)).toLowerCase();
}

/** The primary palette tones the page list's placeholder thumbnails use (M3's `md.ref.palette.primary10/20/30/40/70/80/90`), of the
 * site's source colour (SchemeTonalSpot), as "#rrggbb" by tone; undefined when `source` is not a hex colour. */
export const PRIMARY_TONES = [10, 20, 30, 40, 70, 80, 90] as const;
export function primaryTones(source: unknown): Record<number, string> | undefined {
  if (typeof source !== 'string' || !/^#[0-9a-f]{6}$/i.test(source)) return undefined;
  const palette = new SchemeTonalSpot(Hct.fromInt(argbFromHex(source)), false, 0).primaryPalette;
  return Object.fromEntries(PRIMARY_TONES.map((tone) => [tone, hexFromArgb(palette.tone(tone)).toLowerCase()]));
}
