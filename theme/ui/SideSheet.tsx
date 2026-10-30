// A side sheet (m3.material.io/components/side-sheets, .side-sheet in ../styles/ui.css): more about what is on the
// screen, at its side. Its container, with the header (the headline, `headline` with its id `headlineId`, and the
// close button, `closeLabel`, and what it does in the editor, `onClose`; none without it), what it shows (`children`, scrolling when it is long) and evt. its
// actions at the bottom (`actions`: buttons). Its kind (`kind`): 'standard', beside what it is about on the page, an
// <aside> named by its headline, its place the page's; or 'modal', over the page in a <dialog> with sideSheetClass over
// the scrim, which sideSheet() in sideSheet.ts opens, closes and lets slide in from the side (the <dialog> gets
// aria-labelledby with `headlineId`). How it looks is the theme's (--side-sheet-*). In the editor only drawn, as high as
// its place.
import type { ReactNode } from 'react';
import IconButton from '@theme/ui/IconButton';

export type SideSheetKind = 'standard' | 'modal';

/** The class of the <dialog> a modal side sheet is in, and a side sheet's container's classes. */
export const sideSheetClass = 'side-sheet';
export const sideSheetContainerClass = (kind: SideSheetKind = 'standard') => `side-sheet-container side-sheet-${kind}`;

export default function SideSheet({
  kind = 'standard',
  headline,
  headlineId,
  closeLabel,
  onClose,
  actions,
  className,
  children,
}: {
  kind?: SideSheetKind;
  headline: ReactNode;
  headlineId?: string;
  closeLabel?: string;
  onClose?: () => void;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const Container = kind === 'standard' ? 'aside' : 'div';
  return (
    <Container
      className={[sideSheetContainerClass(kind), className].filter(Boolean).join(' ')}
      aria-labelledby={kind === 'standard' ? headlineId : undefined}
      data-side-sheet-container=""
    >
      <div className="side-sheet-header">
        <h2 id={headlineId} className="side-sheet-headline">
          {headline}
        </h2>
        {closeLabel && <IconButton icon="x" label={closeLabel} data-side-sheet-close="" onClick={onClose} />}
      </div>
      <div className="side-sheet-content">{children}</div>
      {actions && <div className="side-sheet-actions">{actions}</div>}
    </Container>
  );
}
