// The widgets of the start screen: each answers one question about the site, in a card the person places, orders and
// sets up for themselves. The CMS brings some (`cmsWidgets`, src/widgets/<key>.tsx), and each app installed may bring
// its own (AppDefinition.widgets). A widget's full id is "<source>:<key>": `cms`, or the app's id, then its key.
// Only types are imported, so this file runs under node --test.
import type { Icon } from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import type { AppPageProps, AppSettings, SiteApp } from './apps';

/** What a widget is given. `api` asks the app's own addresses in the site's Worker, as an app page does
 * (AppPageProps); `settings` are the values of this placed widget, set by the person (WidgetDefinition.settings, over its
 * `values`); `editing` is true while the person arranges the start screen: the widget then renders, never null, even
 * when it has nothing to say. */
export type WidgetProps = {
  api: AppPageProps['api'];
  settings: Record<string, unknown>;
  editing: boolean;
};

/** A widget of the start screen: its name (in the site's language, shown with siteText) in the list "Add widget" and on
 * its card in edit mode, one line of what it shows in that list, its icon, the settings each placed widget has
 * (as an app's: defineSettings), and what it shows, drawn with the editor's parts. A widget with nothing to say may
 * render nothing; a status widget always renders. */
export type WidgetDefinition = {
  label: string;
  hint: string;
  icon: Icon;
  settings?: AppSettings;
  component: ComponentType<WidgetProps>;
};

/** The widgets the CMS brings, by their key: "cms:<key>". */
export const cmsWidgets: Record<string, WidgetDefinition> = {};

/** All widgets there are to place, by their full id: the CMS's first, then those of each app installed (`installed`: the
 * ids of the apps, as tabsOf takes them), in the order of the apps. */
export function allWidgets(apps: Pick<SiteApp, 'id' | 'widgets'>[], installed: string[]): Map<string, WidgetDefinition> {
  return new Map([
    ...Object.entries(cmsWidgets).map(([key, widget]) => [`cms:${key}`, widget] as const),
    ...apps.flatMap((app) =>
      installed.includes(app.id) ? Object.entries(app.widgets ?? {}).map(([key, widget]) => [`${app.id}:${key}`, widget] as const) : [],
    ),
  ]);
}

/** The widgets of apps that have no `component`, each with its app and key (a widget from an app written without types). */
export const widgetsWithoutComponent = (apps: Pick<SiteApp, 'id' | 'widgets'>[]): { app: string; key: string }[] =>
  apps.flatMap((app) => Object.entries(app.widgets ?? {}).flatMap(([key, widget]) => (widget.component ? [] : [{ app: app.id, key }])));
