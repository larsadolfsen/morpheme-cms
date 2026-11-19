// A tooltip (m3.material.io/components/tooltips, .mo-tooltip in ../styles/ui/tooltip.css) on what it is about (`children`: one
// element, a button or a link, which gets aria-describedby, so screen readers read the tooltip after its name). Plain
// (`text`: a short label, e.g. on an icon button) or rich (`subhead`, `supportingText` and evt. an action, `action`, a
// text button with its `label` and `href` or other attributes on it). Over its anchor, under it when there is no room
// above (placed by CSS anchor positioning where the browser has it, else by the script). On the site ui/tooltip.script.ts shows it while the mouse is over its anchor (or over it) and while the anchor
// has focus, and Escape hides it; without the script it shows on hover and focus by CSS. `open`: shown from the start
// (in the editor, where it is only drawn). How it looks is the theme's (--tooltip-*).
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import Button from '@theme/ui/Button';

export type TooltipAction = { label: string; href?: string } & Record<string, unknown>;

/** A tooltip's classes, plain or rich. */
export const tooltipClass = (rich?: boolean) => `mo-tooltip ${rich ? 'mo-tooltip__rich' : 'mo-tooltip__plain'}`;

export default function Tooltip({
  text,
  subhead,
  supportingText,
  action,
  open,
  className,
  children,
}: {
  text?: ReactNode;
  subhead?: ReactNode;
  supportingText?: ReactNode;
  action?: TooltipAction;
  open?: boolean;
  className?: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}) {
  const id = useId();
  const rich = text === undefined;
  const { label, ...actionRest } = action ?? { label: '' };
  return (
    <span className={['mo-tooltip__anchor', className].filter(Boolean).join(' ')} data-tooltip="" data-tooltip-open={open || undefined}>
      {isValidElement(children) ? cloneElement(children, { 'aria-describedby': id }) : children}
      <span id={id} role={action ? undefined : 'tooltip'} className={tooltipClass(rich)}>
        {rich ? (
          <>
            {subhead && <span className="mo-tooltip__subhead">{subhead}</span>}
            {supportingText && <span className="mo-tooltip__supporting-text">{supportingText}</span>}
            {action && (
              <span className="mo-tooltip__actions">
                <Button kind="text" size="small" className="mo-tooltip__action" {...actionRest}>
                  {label}
                </Button>
              </span>
            )}
          </>
        ) : (
          text
        )}
      </span>
    </span>
  );
}
