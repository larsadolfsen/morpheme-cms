// A bottom sheet (m3.material.io/components/bottom-sheets, .bottom-sheet in ../styles/ui.css): its container, with the
// drag handle, the header (the headline, `headline` with its id `headlineId`, the supporting text under it and evt. the
// close button, `closeLabel`), what it shows (`children`, filling the rest; what stands in place of a frame while it
// loads has bottomSheetCoverClass) and evt. a footer (`footer`). Its kind (`kind`) is Material's:
// - 'modal' (the default): over the page and its scrim, in a <dialog> with bottomSheetClass (an app's: Calendly's
//   Sheet.astro), which bottomSheet() in bottomSheet.ts opens, closes and lets be dragged down; in the editor only
//   drawn, as high as `height` says.
// - 'standard': at the bottom of the screen with the page usable behind it, without a scrim, a <section> named by its
//   headline. It rests in one of its states (`state`, where it starts: 'collapsed', only the handle and the header;
//   'half-expanded', at most half the screen's height; 'expanded', as high as what it shows, nearly to the top; or
//   'hidden'), and its handle is a button (`dragHandleLabel`, what it says to a screen reader) that is dragged between
//   them or tapped to expand and collapse it; with a close button it can be hidden. On the site bottomSheet.script.ts
//   lets it be dragged (standardBottomSheet() in bottomSheet.ts, which a block's or an app's script can also use); in
//   the editor it is drawn in its state and dragged here, at the bottom of its frame (which holds it with
//   contain: layout, and is a size container).
// The editor's own sheets (choices, fields) are modal ones in a <dialog> with bottomSheetFitClass, as high as what is in
// them (bottomSheetFullClass: as high as the screen, a whole page in it), with the container and its header
// (BottomSheetHeader, whose handle is a button there, `onHandle`, named `handleLabel`, and whose close button does
// `onClose`).
// How it looks is the theme's (--bottom-sheet-*).
import { useEffect, useRef, type ReactNode } from 'react';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import IconButton from '@theme/ui/IconButton';
import { standardBottomSheet } from '@theme/ui/bottomSheet';

/** The kinds of a bottom sheet, and the states a standard one rests in, as Material 3 names them. */
export type BottomSheetKind = 'modal' | 'standard';
export type BottomSheetState = 'collapsed' | 'half-expanded' | 'expanded' | 'hidden';

/** The class of the <dialog> a modal bottom sheet is in, of what stands in place of what it shows (over a frame while
 * it loads, or instead of it), and a bottom sheet's container's classes. */
export const bottomSheetClass = 'bottom-sheet';
export const bottomSheetCoverClass = 'bottom-sheet-cover';
export const bottomSheetContainerClass = (kind: BottomSheetKind = 'modal') =>
  kind === 'standard' ? 'bottom-sheet-container bottom-sheet-standard' : 'bottom-sheet-container';
/** The classes of the <dialog> of a modal sheet as high as what is in it (at most most of the screen), and of one as high
 * as the screen and on a computer wider than a sheet (a whole page in it: the editor's preview). */
export const bottomSheetFitClass = 'bottom-sheet bottom-sheet-fit';
export const bottomSheetFullClass = 'bottom-sheet bottom-sheet-full';

/** A bottom sheet's drag handle and header: its headline, the supporting text under it and evt. the close button. The
 * handle is a button with `handleLabel` (a standard sheet's, `expanded` saying whether it is up; the editor's, which
 * does `onHandle`); the close button does `onClose` in the editor. */
export function BottomSheetHeader({
  headline,
  headlineId,
  supportingText,
  closeLabel,
  handleLabel,
  expanded,
  standard,
  onHandle,
  onClose,
}: {
  headline: ReactNode;
  headlineId?: string;
  supportingText?: ReactNode;
  closeLabel?: string;
  handleLabel?: string;
  expanded?: boolean;
  standard?: boolean;
  onHandle?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {handleLabel !== undefined ? (
        <button
          type="button"
          className="bottom-sheet-drag-handle"
          aria-label={handleLabel}
          aria-expanded={standard ? expanded : undefined}
          data-bottom-sheet-handle=""
          onClick={onHandle}
        ></button>
      ) : (
        <div className="bottom-sheet-drag-handle" data-bottom-sheet-handle=""></div>
      )}
      <div className="bottom-sheet-header" data-bottom-sheet-header={standard ? '' : undefined}>
        <div className="bottom-sheet-heading">
          <h2 id={headlineId} className="bottom-sheet-headline">
            {headline}
          </h2>
          {supportingText && <p className="bottom-sheet-supporting-text">{supportingText}</p>}
        </div>
        {closeLabel && <IconButton icon="x" label={closeLabel} data-bottom-sheet-close="" onClick={onClose} />}
      </div>
    </>
  );
}

export default function BottomSheet({
  kind = 'modal',
  state = 'collapsed',
  headline,
  headlineId,
  supportingText,
  closeLabel,
  dragHandleLabel,
  footer,
  height,
  className,
  children,
}: {
  kind?: BottomSheetKind;
  state?: BottomSheetState;
  headline: ReactNode;
  headlineId?: string;
  supportingText?: ReactNode;
  closeLabel?: string;
  dragHandleLabel?: string;
  footer?: ReactNode;
  height?: string;
  className?: string;
  children: ReactNode;
}) {
  const standard = kind === 'standard';
  const onSite = useOnSite();
  const sheet = useRef<HTMLDivElement>(null);
  // In the editor a standard one is dragged here, as bottomSheet.script.ts lets it be on the site.
  useEffect(() => {
    if (standard && !onSite && sheet.current) standardBottomSheet(sheet.current);
  }, [standard, onSite]);
  const Container = standard ? 'section' : 'div';
  return (
    <Container
      ref={sheet}
      className={[bottomSheetContainerClass(kind), className].filter(Boolean).join(' ')}
      aria-labelledby={standard ? headlineId : undefined}
      data-bottom-sheet-container=""
      data-bottom-sheet-standard={standard ? '' : undefined}
      data-state={standard ? state : undefined}
      style={height ? { height } : undefined}
    >
      <BottomSheetHeader
        headline={headline}
        headlineId={headlineId}
        supportingText={supportingText}
        closeLabel={closeLabel}
        handleLabel={standard ? (dragHandleLabel ?? '') : undefined}
        expanded={state === 'half-expanded' || state === 'expanded'}
        standard={standard}
      />
      <div className="bottom-sheet-content">{children}</div>
      {footer && <p className="bottom-sheet-footer">{footer}</p>}
    </Container>
  );
}
