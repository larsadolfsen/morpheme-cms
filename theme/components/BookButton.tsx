// "Book en tid" button (`label`: booking.json, "Blokke" › "Book en tid" in the editor), filled (Button.tsx), in its
// size (`size`, small in the header). It opens what books on the page (`data-open="booking"`: the booking sheet of an
// app's promotion, src/apps/), or goes to the booking page (`href`). In the editor only drawn.
import Button, { type ButtonSize } from '@theme/ui/Button';

export default function BookButton({
  href,
  label,
  size,
  className,
}: {
  href: string;
  label: string;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Button href={href} size={size} data-open="booking" className={className}>
      {label}
    </Button>
  );
}
