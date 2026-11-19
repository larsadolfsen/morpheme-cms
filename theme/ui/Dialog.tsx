// A dialog (m3.material.io/components/dialogs, .mo-dialog in ../styles/ui/dialog.css): Material's basic dialog. Full-screen dialogs are not
// in the theme (owner, 14 Nov 2026: a full screen is a page with a back arrow, not a dialog).
// Its container. With only `children` it is the container alone, with what is in it (a
//   pop-up's box, PopupView.tsx; the date and time pickers); the cookie question is such a dialog that is not modal
//   (CookieConsent.astro). With its parts it is Material's basic dialog: evt. an icon (`icon`, the theme's, centred over
//   the headline), the headline (`headline`, with its id `headlineId` for the <dialog>'s aria-labelledby), the
//   supporting text (`supportingText`), what else it shows (`children`: a list of choices, scrolling when it is long),
//   evt. a divider over the actions (`divider`) and the actions at its end (`actions`: buttons, the main one last).
// Shown modally it is in a <dialog> with dialogModalClass, which
// dialog() in dialogControl.ts (or the script that shows it: Popup.astro) opens and closes. How it looks is the theme's
// (--dialog-*). Other attributes go on it, and `className` after its own classes (its place). An Astro component
// without React gives an element the same classes with dialogClass.
import type { ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import Divider from '@theme/ui/Divider';

/** A dialog's container's class (`parts` when it has its headline, supporting text and actions), and the class of the
 * <dialog> a modal one is shown in. */
export const dialogClass = 'mo-dialog';
export const dialogClassOf = (parts = false) => (parts ? 'mo-dialog mo-dialog__basic' : dialogClass);
export const dialogModalClass = 'mo-dialog__modal';

export default function Dialog({
  icon,
  headline,
  headlineId,
  supportingText,
  divider,
  actions,
  className,
  children,
  ...rest
}: {
  icon?: string;
  headline?: ReactNode;
  headlineId?: string;
  supportingText?: ReactNode;
  divider?: boolean;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const parts = Boolean(icon || headline || supportingText || actions);
  const classes = [dialogClassOf(parts), icon && 'mo-has-icon', className].filter(Boolean).join(' ');
  const title = headline && (
    <h2 id={headlineId} className="mo-dialog__headline">
      {headline}
    </h2>
  );
  const supporting = supportingText && <div className="mo-dialog__supporting-text">{supportingText}</div>;

  // The container alone, as before the parts were there (a pop-up's box, the pickers).
  if (!parts)
    return (
      <div className={classes} {...rest}>
        {children}
      </div>
    );

  return (
    <div className={classes} {...rest}>
      {icon && <Svg name={icon} size={24} className="mo-dialog__icon" />}
      {title}
      {supporting}
      {children && <div className="mo-dialog__content">{children}</div>}
      {divider && <Divider className="mo-dialog__divider" />}
      {actions && <div className="mo-dialog__actions">{actions}</div>}
    </div>
  );
}
