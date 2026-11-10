// "Parts" › "UI-komponenter": the modal bottom sheet example (ContainmentParts.tsx). A button opens the theme's modal
// sheet in a real <dialog>, as the site does (bottomSheet() in bottomSheetControl.ts), so on a phone it opens at half
// height (startAt), is pulled up to full height and pulled down to close. `wide` is what it becomes from the medium
// breakpoint (BottomSheet's `wide`: a dialog, a side sheet or a sheet), `label` what the button says.
// Exposes ModalSheetSample; uses SiteBottomSheet.
import { useEffect, useRef } from 'react';
import { SiteBottomSheet, SiteButton, siteBottomSheet, siteBottomSheetClass } from './themeUi';
import { t } from './i18n';

const say = t.parts.screens.containment;

export default function ModalSheetSample({
  startAt,
  wide,
  label,
}: {
  startAt?: 'half' | 'full';
  wide?: 'dialog' | 'side-sheet' | 'sheet';
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const controls = useRef<ReturnType<typeof siteBottomSheet>>(undefined);
  useEffect(() => {
    if (dialog.current) controls.current = siteBottomSheet(dialog.current);
  }, []);
  return (
    <>
      <SiteButton onClick={() => controls.current?.open()}>{label ?? say.openSheet}</SiteButton>
      <dialog ref={dialog} className={siteBottomSheetClass} aria-label={say.heading}>
        <SiteBottomSheet
          startAt={startAt}
          wide={wide}
          headline={say.heading}
          supportingText={say.sheetText}
          closeLabel={say.close}
          footer={say.footer}
        >
          {say.paragraphs.map((text) => (
            <p key={text} className="mb-3 px-5 pt-3 text-on-surface-variant">
              {text}
            </p>
          ))}
        </SiteBottomSheet>
      </dialog>
    </>
  );
}
