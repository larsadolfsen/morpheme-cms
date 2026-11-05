// What a standard bottom sheet (BottomSheet.tsx with kind 'standard') does on the site: it can be dragged between its
// states and tapped to step through them (standardBottomSheet in bottomSheetControl.ts).
// Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without a standard
// bottom sheet on the page it does nothing.
import { standardBottomSheet } from '@theme/ui/bottomSheetControl';

export default function bottomSheets() {
  document.querySelectorAll<HTMLElement>('[data-bottom-sheet-standard]').forEach((sheet) => standardBottomSheet(sheet));
}
