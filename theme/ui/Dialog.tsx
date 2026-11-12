// A dialog (m3.material.io/components/dialogs, .dialog in ../styles/ui.css), in Material's two kinds (`kind`):
// - 'basic' (the default): its container. With only `children` it is the container alone, with what is in it (a
//   pop-up's box, PopupView.tsx; the date and time pickers); the cookie question is such a dialog that is not modal
//   (CookieConsent.astro). With its parts it is Material's basic dialog: evt. an icon (`icon`, the theme's, centred over
//   the headline), the headline (`headline`, with its id `headlineId` for the <dialog>'s aria-labelledby), the
//   supporting text (`supportingText`), what else it shows (`children`: a list of choices, scrolling when it is long),
//   evt. a divider over the actions (`divider`) and the actions at its end (`actions`: buttons, the main one last).
// - 'full-screen': over the whole screen on a phone, for a task with several steps; in its header the close button
//   (`closeLabel`, data-dialog-close), the headline and the action (`actions`: a text button), evt. a divider under it
//   (`divider`), and under them what it shows (`supportingText` and `children`, scrolling). From the medium breakpoint, where Material
//   shows it as a dialog, it is in the middle of the screen over the scrim, with the same header.
// Shown modally it is in a <dialog> with dialogModalClass (a full-screen one with dialogFullScreenModalClass), which
// dialog() in dialogControl.ts (or the script that shows it: Popup.astro) opens and closes. How it looks is the theme's
// (--dialog-*). Other attributes go on it, and `className` after its own classes (its place). An Astro component
// without React gives an element the same classes with dialogClass.
import type { ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import Divider from '@theme/ui/Divider';
import IconButton from '@theme/ui/IconButton';

/** The kinds of a dialog, as Material 3 names them. */
export type DialogKind = 'basic' | 'full-screen';

/** A dialog's container's class (`kind` 'full-screen' for that kind's; `parts` when a basic one has its headline,
 * supporting text and actions), and the classes of the <dialog> a modal one is shown in (a full-screen one's, over the
 * whole screen on a phone). */
export const dialogClass = 'dialog';
export const dialogClassOf = (kind: DialogKind = 'basic', parts = false) =>
  kind === 'full-screen' ? 'dialog dialog-full-screen' : parts ? 'dialog dialog-basic' : dialogClass;
export const dialogModalClass = 'dialog-modal';
export const dialogFullScreenModalClass = 'dialog-modal dialog-modal-full-screen';

export default function Dialog({
  kind = 'basic',
  icon,
  headline,
  headlineId,
  supportingText,
  divider,
  actions,
  closeLabel,
  className,
  children,
  ...rest
}: {
  kind?: DialogKind;
  icon?: string;
  headline?: ReactNode;
  headlineId?: string;
  supportingText?: ReactNode;
  divider?: boolean;
  actions?: ReactNode;
  closeLabel?: string;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const parts = Boolean(icon || headline || supportingText || actions);
  const classes = [dialogClassOf(kind, parts), icon && kind === 'basic' && 'dialog-with-icon', className].filter(Boolean).join(' ');
  const title = headline && (
    <h2 id={headlineId} className="dialog-headline">
      {headline}
    </h2>
  );
  const supporting = supportingText && <div className="dialog-supporting-text">{supportingText}</div>;

  if (kind === 'full-screen')
    return (
      <div className={classes} {...rest}>
        <div className="dialog-header">
          {closeLabel && <IconButton icon="x" label={closeLabel} data-dialog-close="" />}
          {title}
          {actions && <div className="dialog-header-actions">{actions}</div>}
        </div>
        {divider && <Divider className="dialog-divider" />}
        <div className="dialog-content">
          {supporting}
          {children}
        </div>
      </div>
    );

  // The container alone, as before the parts were there (a pop-up's box, the pickers).
  if (!parts)
    return (
      <div className={classes} {...rest}>
        {children}
      </div>
    );

  return (
    <div className={classes} {...rest}>
      {icon && <Svg name={icon} size={24} className="dialog-icon" />}
      {title}
      {supporting}
      {children && <div className="dialog-content">{children}</div>}
      {divider && <Divider className="dialog-divider" />}
      {actions && <div className="dialog-actions">{actions}</div>}
    </div>
  );
}
