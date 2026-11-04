// A bottom sheet (m3.material.io/components/bottom-sheets, .bottom-sheet in ../styles/ui.css): its container, with the
// drag handle, the header (the headline, `headline` with its id `headlineId`, the supporting text under it and evt. the
// close button, `closeLabel`), what it shows (`children`, filling the rest; what stands in place of a frame while it
// loads has bottomSheetCoverClass) and evt. a footer (`footer`). Its kind (`kind`) is Material's:
// - 'modal' (the default): over the page and its scrim, in a <dialog> with bottomSheetClass (an app's: Calendly's
//   Sheet.astro), which bottomSheet() in bottomSheetControl.ts opens, closes and lets be dragged down; in the editor only
//   drawn, as high as `height` says.
// - 'standard': at the bottom of the screen with the page usable behind it, without a scrim, a <section> named by its
//   headline. It rests in one of its states (`state`, where it starts: 'collapsed', only the handle and the header;
//   'half-expanded', at most half the screen's height; 'expanded', as high as what it shows, nearly to the top; or
//   'hidden'), and its handle is a button (`dragHandleLabel`, what it says to a screen reader) that is dragged between
//   them or tapped to step through them (up one at a time, from the highest back to the lowest); with a close button
//   it can be hidden. `states` (data-states, space-separated) lists the states it may rest in; without it Material 3's
//   (defaultStates in lib/sheet-stops.mjs, 'hidden' first when it has a close button). On the site bottomSheet.script.ts
//   lets it be dragged (standardBottomSheet() in bottomSheetControl.ts, which a block's or an app's script can also use); in
//   the editor it is drawn in its state and dragged here, at the bottom of its frame (which holds it with
//   contain: layout, and is a size container).
// `wide` is what it becomes from the medium breakpoint (data-wide): a standard sheet's 'side-sheet' (the default: drawn as a
// standard side sheet at the end of the screen, full height, without handle and buttons, every part shown, and
// standardBottomSheet() does nothing while the window is that wide) or 'sheet' (stays a bottom sheet, with margins,
// --bottom-sheet-margin-wide); a modal one's 'dialog' (the default), 'side-sheet' or 'sheet' (TypeScript rejects
// 'dialog' on a standard sheet). For a modal one 'side-sheet' is a modal side sheet at the end of the screen (full height,
// its scrim and tokens, without the handle) that bottomSheet() slides in from the end, and 'sheet' stays a bottom sheet
// with the margins and slides up; a container without the attribute (hand-written) is a 'dialog'.
// `startAt` (a modal sheet only, data-start; 'half' without it, also for a hand-written container without the attribute,
// Calendly's) is how high it opens on a phone: 'half', half the screen's height or as high as what is in it if that is
// less, or 'full', as high as the screen allows below --bottom-sheet-top-gap. It is pulled up to full height and down to
// close (modalSheetSize.ts); the content scrolls only at full height. The editor's sheets are not touched.
// `peek` (a standard sheet only) is what it shows even while collapsed (Material 3's preview), between the header and
// what it shows (.bottom-sheet-peek). A standard sheet is named by its headline or, without one, by `label` (the props are a
// union: TypeScript rejects a sheet with neither `headline` nor `label`; a modal one's <dialog> is named by the
// developer who writes it). The drag handle can be left out (`dragHandle={false}`: no handle, so no tap to step
// through the states; the header, if there is one, still drags it). The header is drawn only when there is a
// headline or a close button, or a resize or collapse button. `resizeLabel` adds the resize button (Material 3's
// alternative to dragging the handle for those who use a single pointer: it does what a tap on the handle does, its
// icon an up caret at the lowest stop and a down caret otherwise, `aria-expanded` saying which); a sheet without a
// handle that can be resized must have it (the props are a union again). `collapseLabel` adds the collapse button, which
// shows only while the sheet is as high as the screen allows (data-full, set by the control) and returns it to its
// lowest stop. `state` defaults to the lowest of `states` that is not 'hidden' ('collapsed' without
// `states`), so a fixed sheet (`states={['expanded']}`) starts in its only state.
// The editor's own sheets (choices, fields) are modal ones in a <dialog> with bottomSheetFitClass, as high as what is in
// them (bottomSheetFullClass: as high as the screen, a whole page in it), with the container and its header
// (BottomSheetHeader, whose handle is a button there, `onHandle`, named `handleLabel`, and whose close button does
// `onClose`).
// How it looks is the theme's (--bottom-sheet-*).
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import IconButton from '@theme/ui/IconButton';
import BottomSheetResizeIcon from '@theme/ui/BottomSheetResizeIcon';
import { standardBottomSheet } from '@theme/ui/bottomSheetControl';

/** The kinds of a bottom sheet, and the states a standard one rests in, as Material 3 names them. */
export type BottomSheetKind = 'modal' | 'standard';
export type BottomSheetState = 'collapsed' | 'half-expanded' | 'expanded' | 'hidden';
/** What a sheet becomes from the medium breakpoint; a standard one cannot be a dialog (the props are typed per kind). */
export type BottomSheetWide = 'side-sheet' | 'dialog' | 'sheet';
/** Where a modal sheet opens on a phone: at half the screen's height (or as high as what is in it, if that is less), or as
 * high as the screen allows; a standard sheet has its `state` instead (the props are typed per kind). */
export type BottomSheetStart = 'half' | 'full';
export type BottomSheetKindWide =
  | { kind?: 'modal'; wide?: BottomSheetWide; startAt?: BottomSheetStart }
  | { kind: 'standard'; wide?: Exclude<BottomSheetWide, 'dialog'>; startAt?: never };

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

/** Whether a sheet's header is drawn: it has a headline or a button. */
const hasHeader = (headline: ReactNode, ...labels: (string | undefined)[]) => headline !== undefined || labels.some(Boolean);

/** What names a bottom sheet: a headline, or (without one) a `label`. */
export type BottomSheetName =
  | { headline: Exclude<ReactNode, undefined | null>; headlineId?: string; label?: never }
  | { label: string; headline?: never; headlineId?: never };

/** What a sheet without a drag handle needs to be resizable: a resize button, or states that leave nothing to resize
 * (one other than 'hidden', evt. with 'hidden'). Material 3's states, which omitted `states` means, are resizable. */
type FixedStates = [Exclude<BottomSheetState, 'hidden'>] | ['hidden', Exclude<BottomSheetState, 'hidden'>];
export type BottomSheetResize =
  | { dragHandle?: true; resizeLabel?: string }
  | { dragHandle: false; resizeLabel: string }
  | { dragHandle: false; resizeLabel?: undefined; states: FixedStates };

/** The state a standard sheet starts in when `state` is not given: the lowest of `states` that is not 'hidden'. */
const startState = (states?: BottomSheetState[]): BottomSheetState =>
  (['collapsed', 'half-expanded', 'expanded'] as const).find((s) => !states || states.includes(s)) ?? 'collapsed';

/** A bottom sheet's drag handle and header: its headline, the supporting text under it and evt. the close button. The
 * handle is a button with `handleLabel` (a standard sheet's, `expanded` saying whether it is up; the editor's, which
 * does `onHandle`); the close button does `onClose` in the editor. */
export function BottomSheetHeader({
  headline,
  headlineId,
  supportingText,
  closeLabel,
  resizeLabel,
  collapseLabel,
  handleLabel,
  expanded,
  raised,
  standard,
  dragHandle = true,
  onHandle,
  onClose,
}: {
  headline?: ReactNode;
  headlineId?: string;
  supportingText?: ReactNode;
  closeLabel?: string;
  resizeLabel?: string;
  collapseLabel?: string;
  handleLabel?: string;
  expanded?: boolean;
  raised?: boolean;
  standard?: boolean;
  dragHandle?: boolean;
  onHandle?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {!dragHandle ? null : handleLabel !== undefined ? (
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
      {hasHeader(headline, closeLabel, resizeLabel, collapseLabel) && (
        <div className="bottom-sheet-header" data-bottom-sheet-header={standard ? '' : undefined}>
          <div className="bottom-sheet-heading">
            {headline !== undefined && (
              <h2 id={headlineId} className="bottom-sheet-headline">
                {headline}
              </h2>
            )}
            {supportingText && <p className="bottom-sheet-supporting-text">{supportingText}</p>}
          </div>
          {(resizeLabel || collapseLabel || closeLabel) && (
            <div className="bottom-sheet-actions">
              {resizeLabel && (
                <IconButton icon={<BottomSheetResizeIcon />} label={resizeLabel} aria-expanded={!!raised} data-bottom-sheet-resize="" />
              )}
              {collapseLabel && <IconButton icon="caret-down" label={collapseLabel} data-bottom-sheet-collapse="" />}
              {closeLabel && <IconButton icon="x" label={closeLabel} data-bottom-sheet-close="" onClick={onClose} />}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function BottomSheet({
  kind = 'modal',
  wide,
  startAt,
  state,
  states,
  headline,
  headlineId,
  label,
  supportingText,
  closeLabel,
  resizeLabel,
  collapseLabel,
  dragHandle = true,
  dragHandleLabel,
  peek,
  footer,
  height,
  className,
  children,
}: {
  state?: BottomSheetState;
  states?: [BottomSheetState, ...BottomSheetState[]];
  supportingText?: ReactNode;
  closeLabel?: string;
  collapseLabel?: string;
  dragHandleLabel?: string;
  peek?: ReactNode;
  footer?: ReactNode;
  height?: string;
  className?: string;
  children: ReactNode;
} & BottomSheetKindWide &
  BottomSheetName &
  BottomSheetResize) {
  const shownState = state ?? startState(states);
  const standard = kind === 'standard';
  const onSite = useOnSite();
  const sheet = useRef<HTMLDivElement>(null);
  // In the editor a standard one is dragged here, as bottomSheet.script.ts lets it be on the site.
  useEffect(() => {
    if (standard && !onSite && sheet.current) standardBottomSheet(sheet.current);
  }, [standard, onSite]);
  // A standard sheet is named by its headline even when the caller gives it no id.
  const generatedId = useId();
  const titleId = headlineId ?? generatedId;
  const Container = standard ? 'section' : 'div';
  return (
    <Container
      ref={sheet}
      className={[bottomSheetContainerClass(kind), className].filter(Boolean).join(' ')}
      aria-labelledby={standard && headline !== undefined ? titleId : undefined}
      aria-label={standard && headline === undefined ? label : undefined}
      data-bottom-sheet-container=""
      data-bottom-sheet-standard={standard ? '' : undefined}
      data-wide={wide ?? (standard ? 'side-sheet' : 'dialog')}
      data-start={standard ? undefined : (startAt ?? 'half')}
      data-state={standard ? shownState : undefined}
      data-states={standard && states ? states.join(' ') : undefined}
      style={height ? { height } : undefined}
    >
      <BottomSheetHeader
        headline={headline}
        headlineId={standard && headline !== undefined ? titleId : headlineId}
        supportingText={supportingText}
        closeLabel={closeLabel}
        resizeLabel={standard ? resizeLabel : undefined}
        collapseLabel={standard ? collapseLabel : undefined}
        dragHandle={dragHandle}
        handleLabel={standard ? (dragHandleLabel ?? '') : undefined}
        expanded={shownState === 'half-expanded' || shownState === 'expanded'}
        raised={shownState !== 'hidden' && shownState !== startState(states)}
        standard={standard}
      />
      {standard && peek && <div className="bottom-sheet-peek">{peek}</div>}
      <div className="bottom-sheet-content">{children}</div>
      {footer && <p className="bottom-sheet-footer">{footer}</p>}
    </Container>
  );
}
