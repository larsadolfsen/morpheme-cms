// A loading indicator (M3 Expressive, m3.material.io/components/loading-indicator, .loading-indicator in
// ../styles/ui.css): a shape that turns and changes from one of Material's shapes into the next, while something that
// takes only a moment is on its way (where how far it has come is known, a progress indicator says it instead). By
// itself, or in its round container (`contained`, where it stands on something else). Screen readers read it as a
// progress bar without a value, named by `label` (e.g. "Henter…"). With reduced motion it only turns, slowly. How it
// looks is the theme's (--loading-indicator-*). An Astro component gives an element the same classes with
// loadingIndicatorClass, with a .loading-indicator-shape in it.

/** A loading indicator's classes, with its container or without. */
export const loadingIndicatorClass = (contained?: boolean) =>
  ['loading-indicator', contained && 'loading-indicator-contained'].filter(Boolean).join(' ');

export default function LoadingIndicator({
  label,
  contained,
  className,
  ...rest
}: { label: string; contained?: boolean; className?: string } & Record<string, unknown>) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      className={[loadingIndicatorClass(contained), className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className="loading-indicator-shape"></span>
    </span>
  );
}
