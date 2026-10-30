// What a standard bottom sheet (BottomSheet.tsx with kind 'standard') does on the site: it can be dragged between its
// states and tapped open and closed (standardBottomSheet in bottomSheet.ts). Run on every page by the theme's Base.astro
// (blockScripts, src/site/scripts.ts); without a standard bottom sheet on the page it does nothing.
import { standardBottomSheet } from '@theme/ui/bottomSheet';

export default function bottomSheets() {
  document.querySelectorAll<HTMLElement>('[data-bottom-sheet-standard]').forEach((sheet) => standardBottomSheet(sheet));
}
