// The brand pack's names (owner, 24 Nov 2026: "we keep brand logos as their own icon pack because they are the same no matter what"): the brands whose logos are drawn
// from site/brand/<name>.svg whichever icon pack a site picks. A stored icon name (`facebook-logo`, `github-logo-fill`) is a brand when lib/materialIconMap.mjs maps it to `{ brand }`;
// a bare name is not (`x` is Phosphor's close icon), so code that knows the network (site/social.mjs NETWORKS) names it `<brand>-logo`. Never a Material icon.
// Exposes BRANDS, brandOf. Pure, so it is tested (brandLogos.test.mjs); the files are read by the caller (src/icon.tsx).
import { materialNameOf } from './materialIconMap.mjs';

/** The brands in the pack, one file each in site/brand/. */
export const BRANDS = /** @type {const} */ (['facebook', 'x', 'linkedin', 'pinterest', 'github', 'google']);

/** The brand an icon name draws: its name in the brand pack, or undefined for any other icon.
 * @param {string} name @returns {(typeof BRANDS)[number] | undefined} */
export function brandOf(name) {
  const mapped = materialNameOf(name);
  const brand = mapped && 'brand' in mapped ? mapped.brand : undefined;
  return brand && /** @type {readonly string[]} */ (BRANDS).includes(brand) ? /** @type {(typeof BRANDS)[number]} */ (brand) : undefined;
}
