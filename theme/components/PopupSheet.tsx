// A promotion of an app's kind that opens as the theme's bottom sheet instead of the pop-up's dialog (the app's popups/View.tsx exports
// `surface = 'bottom-sheet'`; Popup.astro shows it in a <dialog> with bottomSheetClass, which bottomSheet() in ui/bottomSheetControl.ts opens and
// closes). The CMS draws the sheet, its handle and its close button; the app's part is all that is inside, drawn in the app's scope (data-mo-app on its
// outer element, standard/appScope.tsx) so its scoped CSS applies. Material 3's modal bottom sheet: m3.material.io/components/bottom-sheets.
import type { PopupPart } from '@theme/components/PopupView';
import BottomSheet from '@theme/ui/BottomSheet';
import { scopedPart } from '@morphemecms/cms/src/standard/appScope';
import { siteT } from '@morphemecms/cms/src/i18n';

export default function PopupSheet({ appId, Part, part, label }: { appId: string; Part: PopupPart; part?: unknown; label: string }) {
  const Scoped = scopedPart(appId, Part);
  return (
    <BottomSheet label={label} closeLabel={siteT.theme.close} startAt="half" wide="sheet">
      <Scoped view={part} button={null} />
    </BottomSheet>
  );
}
