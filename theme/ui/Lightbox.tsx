// A lightbox (.lightbox in ../styles/ui.css): an image shown bigger over the page, which Material 3 has no part for (it prints no lightbox or image
// viewer: see docs/material-deviations.md). It is the theme's modal dialog (Dialog.tsx, kind 'full-screen', in a <dialog> with the classes of
// dialogFullScreenModalClass, so the dialog's scrim, focus trap, Escape and focus return are the dialog's): on a compact window the whole screen, from
// medium a container as large as the window less 56 dp on each side. In its header only the close button (M3: "the close X icon button should be
// the only navigation option in the app bar"); under it the images one after the other in a horizontal track that snaps (CSS scroll-snap: a swipe, a
// trackpad and the arrow keys scroll one image at a time), each in its own proportions, never cropped, with its caption under it; the Previous and Next
// buttons at the sides (on a phone, where swiping is the way, they are drawn only for a keyboard or a switch user), and the count that is announced
// (aria-live). The track is empty here: lightboxControl.ts fills it with the images the page shows when it opens (so the page has no second copy of
// them), moves between them and closes. The texts are the site's, in its language (`label`, `closeLabel`, `previousLabel`, `nextLabel`). `className`
// after its own classes; the rest (id, data-…) on the <dialog>. An Astro component without React gives the <dialog> the same classes with
// lightboxModalClass.
import Dialog, { dialogFullScreenModalClass } from '@theme/ui/Dialog';
import IconButton from '@theme/ui/IconButton';

/** The <dialog>'s classes: the dialog's full-screen modal, as the lightbox. */
export const lightboxModalClass = `${dialogFullScreenModalClass} lightbox-modal`;

export default function Lightbox({
  label,
  closeLabel,
  previousLabel,
  nextLabel,
  className,
  ...rest
}: {
  /** What the dialog and its track are called for screen readers ("Images"). */
  label: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  className?: string;
} & Record<string, unknown>) {
  return (
    <dialog className={[lightboxModalClass, className].filter(Boolean).join(' ')} aria-label={label} data-lightbox="" {...rest}>
      <Dialog kind="full-screen" className="lightbox" closeLabel={closeLabel}>
        <div className="lightbox-stage">
          <IconButton icon="caret-left" label={previousLabel} className="lightbox-previous" data-lightbox-previous="" />
          <ul className="lightbox-track" data-lightbox-track="" tabIndex={0} aria-label={label} />
          <IconButton icon="caret-right" label={nextLabel} className="lightbox-next" data-lightbox-next="" />
        </div>
        <p className="lightbox-count" data-lightbox-count="" aria-live="polite" />
      </Dialog>
    </dialog>
  );
}
