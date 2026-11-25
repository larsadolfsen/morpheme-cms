// A dialog (m3.material.io/components/dialogs, .mo-dialog in ../styles/ui/dialog.css): Material's basic dialog and, with `kind="full-screen"`, its
// full-screen dialog (DG1 in docs/material-deviations.md; new in contract 8).
// The full-screen kind (`kind`: basic, the default, or full-screen) fills the screen at the compact width and is the basic dialog from 600 dp up (M3,
//   Guidelines: "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic
//   dialog."). Its parts, with one markup for both: the header (56 dp) with the close icon (`closeLabel`, its name for screen readers; a button with
//   data-dialog-close), the headline (`headline`, start-aligned) and the text button (`action`: Save, the confirming action, never disabled);
//   evt. a divider (`divider`) under the header; the content (`children`, scrolling under the header). From 600 dp the same parts are the basic
//   dialog: the headline, the content and the actions at its end, `dismiss` (a text button, Cancel; shown only there, as the close icon is not) and `action`.
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
import IconButton from '@theme/ui/IconButton';

/** A dialog's container's class (`parts` when it has its headline, supporting text and actions), and the class of the
 * <dialog> a modal one is shown in. */
export const dialogClass = 'mo-dialog';
export const dialogClassOf = (parts = false, kind: DialogKind = 'basic') =>
  kind === 'full-screen' ? 'mo-dialog mo-is-full-screen' : parts ? 'mo-dialog mo-is-basic' : dialogClass;
export type DialogKind = 'basic' | 'full-screen';
export const dialogModalClass = 'mo-is-modal';

export default function Dialog({
  kind = 'basic',
  closeLabel,
  action,
  dismiss,
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
  kind?: DialogKind;
  /** The full-screen kind: the close icon's name. */
  closeLabel?: string;
  /** The full-screen kind: the confirming text button (Save), in the header, and at the end of the actions from 600 dp. */
  action?: ReactNode;
  /** The full-screen kind: the dismissing text button (Cancel), shown from 600 dp only. */
  dismiss?: ReactNode;
  icon?: string;
  headline?: ReactNode;
  headlineId?: string;
  supportingText?: ReactNode;
  divider?: boolean;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const full = kind === 'full-screen';
  const parts = Boolean(icon || headline || supportingText || actions);
  const classes = [dialogClassOf(parts, kind), icon && !full && 'mo-has-icon', className].filter(Boolean).join(' ');
  const title = headline && (
    <h2 id={headlineId} className="mo-dialog__headline">
      {headline}
    </h2>
  );
  const supporting = supportingText && <div className="mo-dialog__supporting-text">{supportingText}</div>;

  // The full-screen dialog: header, optional divider, content; the basic dialog's parts from 600 dp.
  if (full)
    return (
      <div className={classes} {...rest}>
        <div className="mo-dialog__header">
          <IconButton icon="close" label={closeLabel ?? 'Close'} className="mo-dialog__close" data-dialog-close />
          {title}
          {dismiss && <div className="mo-dialog__dismiss">{dismiss}</div>}
          {action && <div className="mo-dialog__action">{action}</div>}
        </div>
        {divider && <Divider className="mo-dialog__divider" />}
        <div className="mo-dialog__content">
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
      {icon && <Svg name={icon} size={24} className="mo-dialog__icon" />}
      {title}
      {supporting}
      {children && <div className="mo-dialog__content">{children}</div>}
      {divider && <Divider className="mo-dialog__divider" />}
      {actions && <div className="mo-dialog__actions">{actions}</div>}
    </div>
  );
}
