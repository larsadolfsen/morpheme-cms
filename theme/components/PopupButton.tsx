// The button of a pop-up (PopupView.tsx): the booking sheet, the phone or a page, as the buttons of the blocks
// (Buttons.tsx), or a PDF to download in the same look. A pop-up of an app's kind (a Mailchimp signup) gets it and shows
// it where it wants (after the signup).
import Buttons from '@theme/blocks/buttons/Buttons';
import type { ButtonView } from '@morpheme/cms/src/standard/buttons/view';
import Button from '@theme/ui/Button';

/** Its button: a PDF to download (its address and text), or the buttons' view (one). */
export type PopupButtonView = { file: { href: string; label: string } } | { buttons: ButtonView[] };

export default function PopupButton({ button }: { button?: PopupButtonView }) {
  if (!button) return null;
  return (
    <div className="block-buttons mt-6">
      {'file' in button ? (
        <Button href={button.file.href} icon="download-simple" download="" className="w-full sm:w-auto">
          {button.file.label}
        </Button>
      ) : (
        <Buttons buttons={button.buttons} className="w-full sm:w-auto" />
      )}
    </div>
  );
}
