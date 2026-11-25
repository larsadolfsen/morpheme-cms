// A side sheet (m3.material.io/components/side-sheets, .mo-sheet.mo-is-side in ../styles/ui/side-sheet.css): more about what is on the
// screen, at its side. Its container, with the header (the headline, `headline` with its id `headlineId`, and the
// close button, `closeLabel`, and what it does in the editor, `onClose`; none without it), what it shows (`children`, scrolling when it is long) and evt. its
// actions at the bottom (`actions`: buttons). Its kind (`kind`): 'standard', beside what it is about on the page, an
// <aside> named by its headline, its place the page's; or 'modal', over the page in a <dialog> with sideSheetClass over
// the scrim, which sideSheet() in sideSheetControl.ts opens, closes and lets slide in from the side (the <dialog> gets
// aria-labelledby with `headlineId`). A standard one takes an `id` and `hidden`: a button with data-side-sheet-open="<id>"
// shows it (sideSheet.script.ts, standardSideSheet()). An optional back icon button before the headline (`onBack`, named `backLabel`): M3's
// "Side sheets can contain a back icon for navigation" (side-sheets overview), for a sheet that shows another region of itself. How it looks is the theme's (--side-sheet-*). In the editor only drawn, as high as
// its place.
import type { ReactNode } from 'react';
import IconButton from '@theme/ui/IconButton';

export type SideSheetKind = 'standard' | 'modal';

/** The class of the <dialog> a modal side sheet is in, and a side sheet's container's classes. */
export const sideSheetClass = 'mo-sheet mo-is-side';
export const sideSheetContainerClass = (kind: SideSheetKind = 'standard') => `mo-sheet__container mo-is-side mo-sheet__${kind}`;

export default function SideSheet({
  kind = 'standard',
  headline,
  headlineId,
  id,
  hidden,
  closeLabel,
  onClose,
  backLabel,
  onBack,
  actions,
  className,
  children,
}: {
  kind?: SideSheetKind;
  headline: ReactNode;
  headlineId?: string;
  /** A standard side sheet's id, and whether it starts hidden (a button with data-side-sheet-open shows it). */
  id?: string;
  hidden?: boolean;
  closeLabel?: string;
  onClose?: () => void;
  /** A back icon button before the headline, for a sheet that shows another region of itself; `backLabel` names it. */
  backLabel?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const Container = kind === 'standard' ? 'aside' : 'div';
  return (
    <Container
      id={kind === 'standard' ? id : undefined}
      hidden={kind === 'standard' ? hidden : undefined}
      className={[sideSheetContainerClass(kind), className].filter(Boolean).join(' ')}
      aria-labelledby={kind === 'standard' ? headlineId : undefined}
      data-side-sheet-container=""
    >
      <div className="mo-sheet__header" data-has-back={onBack ? '' : undefined}>
        {onBack && <IconButton icon="arrow_back" label={backLabel ?? ''} data-side-sheet-back="" onClick={onBack} />}
        <h2 id={headlineId} className="mo-sheet__headline">
          {headline}
        </h2>
        {closeLabel && <IconButton icon="close" label={closeLabel} data-side-sheet-close="" onClick={onClose} />}
      </div>
      <div className="mo-sheet__content">{children}</div>
      {actions && <div className="mo-sheet__actions">{actions}</div>}
    </Container>
  );
}
