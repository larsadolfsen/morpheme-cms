// "Call 12 34 56 78" button (`label`, its text before the number: booking.json, "Blocks" › "Book an appointment"), outlined
// (Button.tsx). In the editor only drawn.
import Button from '@theme/ui/Button';

export default function PhoneButton({ href, label, phone, className }: { href: string; label: string; phone: string; className?: string }) {
  return (
    <Button href={href} kind="outlined" icon="phone" className={className}>
      {label} {phone}
    </Button>
  );
}
