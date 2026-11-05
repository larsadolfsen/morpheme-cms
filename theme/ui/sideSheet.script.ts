// What a button with data-side-sheet-open="<id>" does on the site: it opens the side sheet with that id, a modal one
// (a <dialog>, sideSheet() in sideSheetControl.ts) or a standard one (an element with data-side-sheet-container,
// standardSideSheet()). One click listener on the page, so markup that comes later works too.
// Run on every page by the theme's Base.astro (blockScripts, site/blockScripts.ts); without a side sheet on the page it does nothing.
import { sideSheet, standardSideSheet, type SideSheetControls } from '@theme/ui/sideSheetControl';

const controls = new WeakMap<HTMLElement, SideSheetControls>();

export default function sideSheets() {
  document.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLElement>('[data-side-sheet-open]');
    const sheet = button && document.getElementById(button.dataset.sideSheetOpen!);
    if (!button || !sheet) return;
    const modal = sheet instanceof HTMLDialogElement && !!sheet.querySelector('[data-side-sheet-container]');
    if (!modal && !sheet.hasAttribute('data-side-sheet-container')) return;
    let control = controls.get(sheet);
    if (!control) {
      control = modal ? sideSheet(sheet as HTMLDialogElement) : standardSideSheet(sheet);
      controls.set(sheet, control);
    }
    control.open(button);
  });
}
