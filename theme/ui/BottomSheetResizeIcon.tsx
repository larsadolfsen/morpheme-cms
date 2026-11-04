// The icon of a bottom sheet's resize button (BottomSheet.tsx): the up caret while the sheet is at its lowest stop, the
// down caret otherwise; both are drawn and ui.css shows the one the button's aria-expanded says, so the control
// (bottomSheetControl.ts) only changes that attribute. Exposes BottomSheetResizeIcon, an IconRef element for IconButton.
import { Svg } from '@morphemecms/cms/src/icon';

export default function BottomSheetResizeIcon({ size = 22 }: { size?: number; className?: string }) {
  return (
    <>
      <Svg name="caret-up" size={size} className="bottom-sheet-resize-up" />
      <Svg name="caret-down" size={size} className="bottom-sheet-resize-down" />
    </>
  );
}
