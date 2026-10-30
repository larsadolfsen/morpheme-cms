// A snackbar (m3.material.io/components/snackbar, .snackbar in ../styles/ui.css): a short message at the bottom of the
// screen, what the site says with one (a new version of a page: layouts/PageLayout.astro). Its supporting text (`text`,
// on one line or two), evt. links in it, each with an arrow (`links`), evt. an action, a text button (`action`, with
// its `label` and `href` or other attributes on it), under the text when it is long (`longerAction`), and evt. a
// button that closes it (`closeLabel`, its name). Read by screen readers as a status (`error`: an alert). On the site
// it is drawn in a <template data-snackbar> (with `data-ms` for how long it stays), and ui/snackbar.script.ts shows it
// at the bottom with the editor's snackbar() (@interstellarcms/cms/lib/snackbar.ts: where messages stand, how long, and how
// they are swiped away, the same as the editor's messages); in the editor only drawn. How it looks is the theme's
// (--snackbar-*). An Astro component gives an element the same classes with snackbarClass.
import { Fragment } from 'react';
import { Svg } from '@interstellarcms/cms/src/icon';
import { Link } from '@interstellarcms/cms/src/standard/view';
import Button from '@theme/ui/Button';
import IconButton from '@theme/ui/IconButton';

export type SnackbarLink = { text: string; href: string };
export type SnackbarAction = { label: string; href?: string } & Record<string, unknown>;

/** A snackbar's classes: with its action under the text, or beside it. */
export const snackbarClass = (longerAction?: boolean) => ['snackbar', longerAction && 'snackbar-longer-action'].filter(Boolean).join(' ');

export default function Snackbar({
  text,
  links = [],
  action,
  longerAction,
  closeLabel,
  error,
  className,
  ...rest
}: {
  text: string;
  links?: SnackbarLink[];
  action?: SnackbarAction;
  longerAction?: boolean;
  closeLabel?: string;
  error?: boolean;
  className?: string;
} & Record<string, unknown>) {
  const { label, ...actionRest } = action ?? { label: '' };
  return (
    <div role={error ? 'alert' : 'status'} className={[snackbarClass(longerAction), className].filter(Boolean).join(' ')} {...rest}>
      <p className="snackbar-supporting-text">
        {text}
        {links.map((link) => (
          <Fragment key={link.href + link.text}>
            {' '}
            <Link href={link.href} className="snackbar-link">
              {link.text}
              <Svg name="arrow-right" size={14} />
            </Link>
          </Fragment>
        ))}
      </p>
      {(action || closeLabel) && (
        <div className="snackbar-actions">
          {action && (
            <Button kind="text" size="small" className="snackbar-action" {...actionRest}>
              {label}
            </Button>
          )}
          {closeLabel && <IconButton icon="x" label={closeLabel} className="snackbar-close" data-snackbar-close="" />}
        </div>
      )}
    </div>
  );
}
