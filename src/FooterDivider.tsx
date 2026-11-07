// The thin vertical divider between two items in the editor's footer row (1px wide, 16px high, the outline-variant
// colour), with space on both sides. Exposes FooterDivider. Used by FooterLinks.
export default function FooterDivider() {
  return <span aria-hidden="true" className="mx-3 h-4 w-px shrink-0 bg-line" />;
}
