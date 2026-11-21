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
