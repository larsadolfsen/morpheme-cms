// A tap outside a modal <dialog> (on its scrim) closes it: the platform's own light dismiss, `closedby="any"` (Modern Web
// Guidance, guide `dialog`). The browser fires the dialog's cancelable `cancel` event first, as it does for Escape, so the
// control's own animated close() (the `cancel` hook in dialogControl.ts and bottomSheetControl.ts) runs and Material 3's
// motion plays. Where `closedby` is missing (Safari) the guide's fallback does the same: it tests the pointer's position,
// not event.target (the <dialog> is also the target for its own padding), needs the press and the release outside, so a
// text-selection drag that ends on the scrim closes nothing, and calls the control's close().
export function lightDismiss(dialog: HTMLDialogElement, close: () => unknown) {
  if ('closedBy' in HTMLDialogElement.prototype) {
    dialog.closedBy = 'any';
    return;
  }
  const outside = (e: PointerEvent) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  let pressed = false;
  dialog.addEventListener('pointerdown', (e) => {
    pressed = outside(e);
  });
  dialog.addEventListener('pointerup', (e) => {
    if (pressed && outside(e)) close();
    pressed = false;
  });
}
