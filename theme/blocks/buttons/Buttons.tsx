// Buttons (Button.tsx in ../../ui/): the standard block "Knapper", and a site's or an app's own buttons (this site's
// front page, the price cards, the booking bar). Only the buttons: the caller lays them out (.block-buttons in a row).
// What each shows is made by the contract (@interstellarcms/cms/src/standard/buttons/view.ts: buttonsOf in the editor,
// loadButtons on the site), its kind too. `className`: the site's own classes on each button, e.g. its width. The arrow
// goes after the text (Button's trailingIcon), the other icons before it.
import Button from '@theme/ui/Button';
import type { ButtonView } from '@interstellarcms/cms/src/standard/buttons/view';

export default function Buttons({ buttons, className }: { buttons: ButtonView[]; className?: string }) {
  return (
    <>
      {buttons.map((b, i) => (
        <Button
          key={i}
          href={b.href}
          kind={b.kind}
          icon={b.icon !== 'arrow-right' ? b.icon : undefined}
          trailingIcon={b.icon === 'arrow-right' ? 'arrow-right' : undefined}
          data-open={b.open}
          className={className}
          aria-label={b.label}
        >
          {b.text}
        </Button>
      ))}
    </>
  );
}
