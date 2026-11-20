// The site's phone number as a button with a phone icon (Button.tsx), in the header (HeaderCta.tsx) and at the bottom of the
// navigation drawer (MobileMenu.tsx). Exposes HeaderPhone and HeaderPhoneButton; `page` makes it lead to the contact page
// (phone.page) instead of calling (tel:), and only a call has the screen reader label ("Ring 12 34 56 78").
import Button from '@theme/ui/Button';

/** The phone number as the header shows it: the number, its tel: address, what a screen reader says of that link ("Ring 12
 * 34 56 78") and the contact page (`page`, where it leads from the medium window size up; without one, it calls there too). */
export type HeaderPhone = { number: string; href: string; label: string; page?: string };

export default function HeaderPhoneButton({
  phone,
  kind,
  page,
  onClick,
}: {
  phone: HeaderPhone;
  kind: 'text' | 'outlined';
  /** Lead to the contact page, not call (needs phone.page). */
  page?: boolean;
  onClick?: () => void;
}) {
  const to = page && phone.page ? phone.page : undefined;
  return (
    <Button href={to ?? phone.href} kind={kind} icon="phone" aria-label={to ? undefined : phone.label} onClick={onClick}>
      {phone.number}
    </Button>
  );
}
