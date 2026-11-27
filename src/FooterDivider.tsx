// The thin vertical divider between two items in the editor's footer row: the theme's Divider part, vertical (1px wide, the outline-variant
// colour), with no margin: the links' own 12px side padding is the space. Exposes FooterDivider. Used by FooterLinks, which hides the ones at the ends of a line (useStrayDividers.ts: data-divider).
import { SiteDivider } from './themeUi';

export default function FooterDivider() {
  return <SiteDivider vertical aria-hidden="true" data-divider />;
}
