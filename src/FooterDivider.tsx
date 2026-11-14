// The thin vertical divider between two items in the editor's footer row (1px wide, 16px high, the outline-variant
// colour), with no margin: the links' own 12px side padding is the space. Exposes FooterDivider. Used by FooterLinks, which hides the ones at the ends of a line (useStrayDividers.ts: data-divider).
export default function FooterDivider() {
  return <span aria-hidden="true" data-divider className="h-4 w-px shrink-0 bg-outline-variant" />;
}
