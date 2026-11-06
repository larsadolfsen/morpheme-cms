// The header's call to action (header.json's "Call to action", site/header.mjs): the site's phone number (Business ›
// Contact) as a text button and the header's button (filled) after it, both from the medium window size up; below it the
// phone as an icon button only (the button is in the navigation drawer, MobileMenu.tsx). On a phone the number calls it
// (tel:); from the medium window size up, where a computer cannot call, it leads to the contact page (Default pages), when
// the site has one. Drawn by Header.astro and by the editor's preview of the header (src/headerTheme.tsx), so both draw it
// the same; data-editor="header-cta" marks it for the preview. Nothing when both are off.
import Button from '@theme/ui/Button';
import IconButton from '@theme/ui/IconButton';
import Buttons from '@theme/blocks/buttons/Buttons';
import type { ButtonView } from '@morphemecms/cms/src/standard/buttons/view';
import { headerCtaClass } from '@theme/components/headerParts';

/** The phone number as the header shows it: the number, its tel: address, what a screen reader says of that link ("Ring 12
 * 34 56 78") and the contact page (`page`, where it leads from the medium window size up; without one, it calls there too). */
export type HeaderPhone = { number: string; href: string; label: string; page?: string };

export default function HeaderCta({ button, phone }: { button?: ButtonView; phone?: HeaderPhone }) {
  if (!button && !phone) return <span data-editor="header-cta" hidden />;
  return (
    <div data-editor="header-cta" className={headerCtaClass}>
      {phone && (
        <>
          <IconButton href={phone.href} icon="phone" label={phone.label} title={phone.number} className="medium:hidden" />
          <span className="hidden medium:contents">
            <Button href={phone.page ?? phone.href} kind="text" icon="phone" aria-label={phone.page ? undefined : phone.label}>
              {phone.number}
            </Button>
          </span>
        </>
      )}
      {button && (
        <span className="hidden medium:contents">
          <Buttons buttons={[button]} />
        </span>
      )}
    </div>
  );
}
