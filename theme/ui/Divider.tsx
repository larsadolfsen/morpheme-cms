// A divider (m3.material.io/components/divider, .divider in ../styles/ui.css): a thin line between groups of
// content, an <hr> (a separator to screen readers). Its kind (`kind`): 'full-width' (from edge to edge, the
// default), 'inset' (in from the start, as far as the text of a list's items with something before them) or
// 'middle-inset' (in from both sides); `vertical`: a line from top to bottom between things side by side
// (aria-orientation). Other attributes go on it, and `className` after its own classes. An Astro component gives an
// <hr> the same classes with dividerClass.

export type DividerKind = 'full-width' | 'inset' | 'middle-inset';

/** A divider's classes. */
export const dividerClass = (kind: DividerKind = 'full-width', vertical?: boolean) =>
  ['divider', kind !== 'full-width' && `divider-${kind}`, vertical && 'divider-vertical'].filter(Boolean).join(' ');

export default function Divider({
  kind,
  vertical,
  className,
  ...rest
}: { kind?: DividerKind; vertical?: boolean; className?: string } & Record<string, unknown>) {
  return (
    <hr
      className={[dividerClass(kind, vertical), className].filter(Boolean).join(' ')}
      aria-orientation={vertical ? 'vertical' : undefined}
      {...rest}
    />
  );
}
