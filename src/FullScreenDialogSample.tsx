// "Parts" › "UI components": the theme's full-screen dialog (ContainmentParts.tsx). A button opens it in a real <dialog>, as the site does
// (siteDialogControl): below 600 dp it fills the screen, with the close icon, the headline and Save in its header; from 600 dp it is the basic
// dialog, with Cancel and Save at its end (DG1 in docs/material-deviations.md). Exposes FullScreenDialogSample; uses SiteDialog.
import { useEffect, useRef } from 'react';
import { SiteButton, SiteDialog, SiteTextField, siteDialogControl, siteDialogModalClass } from './themeUi';
import { t } from './i18n';

const say = t.parts.screens.containment;

export default function FullScreenDialogSample() {
  const dialog = useRef<HTMLDialogElement>(null);
  const controls = useRef<ReturnType<typeof siteDialogControl>>(undefined);
  useEffect(() => {
    if (dialog.current) controls.current = siteDialogControl(dialog.current);
  }, []);
  return (
    <>
      <SiteButton onClick={() => controls.current?.open()}>{say.openFullScreen}</SiteButton>
      <dialog ref={dialog} className={siteDialogModalClass} aria-labelledby="mo-parts-full-screen-dialog">
        <SiteDialog
          kind="full-screen"
          closeLabel={say.close}
          headline={say.fullScreenHeading}
          headlineId="mo-parts-full-screen-dialog"
          dismiss={
            <SiteButton kind="text" data-dialog-close>
              {say.cancel}
            </SiteButton>
          }
          action={
            <SiteButton kind="text" data-dialog-close>
              {say.save}
            </SiteButton>
          }
        >
          <SiteTextField label={say.choices[0]} />
        </SiteDialog>
      </dialog>
    </>
  );
}
