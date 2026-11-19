// The widgets of the start screen (widgets.ts) in a grid: the person's dashboard is loaded from the Worker
// (dashboardStore.ts, through useDashboard in DashboardEdit.tsx, which Start in Library.tsx owns) and each placement whose
// widget exists is drawn with its own card. One column on a compact screen, two from medium, three from expanded; a card is
// as tall as its content. Shows a loading state and, when the dashboard can't be loaded, a message with a button to try
// again. In edit mode every card is drawn with `editing` in a frame with its controls (EditableCards), a failed save is
// a Notice over the grid, and "Add widget" above the cards opens the list of widgets to place (AddWidget). The button is off
// when the dashboard has MAX_WIDGETS placements, the most the Worker keeps. Outside edit mode a text button below the cards, "Edit dashboard", starts it. A card's Settings opens WidgetSettings
// for it (the values go into the draft).
import { useState } from 'react';
import { Plus, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { siteText, t } from './i18n';
import { apps } from './site';
import { MAX_WIDGETS } from './dashboard.mjs';
import { valuesOf } from './widgetValues.mjs';
import type { Placement } from './dashboard.mjs';
import type { Env } from './App';
import type { RepoFile } from './github';
import { EditableCards, saveErrorText, type DashboardEditing } from './DashboardEdit';
import { AddWidget } from './AddWidget';
import { WidgetSettings } from './WidgetSettings';
import { spanClass, widgetGroups, type WidgetDefinition } from './widgets';
import { Icon } from './icon';
import { Button, LoadingIndicator, Notice } from './ui';

/** A group's name in the list: the CMS's, or the app's label (the site's text). */
const groupLabel = (source: string) =>
  source === 'cms' ? t.dashboard.cmsWidgets : siteText(apps.find((app) => app.id === source)?.label ?? source);

/** Material Symbols' `dashboard_customize`, shaped as a Phosphor icon so the shared Button takes it as its leading icon. */
const CustomizeIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => (
  <Icon name="dashboard_customize" size={Number(size)} className={className} />
)) as unknown as PhosphorIcon;

/** The CMS's widgets have no app API, so theirs rejects; an app's widget gets the app's own, as its pages do. */
const noApi = () => Promise.reject(new Error('The CMS widgets have no app API'));

export function Dashboard({ dash, env, files }: { dash: DashboardEditing; env: Env; files: RepoFile[] }) {
  const [adding, setAdding] = useState(false);
  // The placement whose settings are open (WidgetSettings).
  const [settingsFor, setSettingsFor] = useState<Placement | null>(null);
  const draw = ({ id, widget, settings }: Placement, definition: WidgetDefinition) => {
    const source = widget.slice(0, widget.indexOf(':'));
    const Widget = definition.component;
    return (
      <Widget
        key={id}
        api={source === 'cms' ? noApi : (path, init) => env.appApi(source, path, init)}
        settings={valuesOf(definition.settings?.values, settings)}
        editing={dash.editing}
      />
    );
  };

  const settingsDefinition = settingsFor ? dash.widgets.get(settingsFor.widget) : undefined;

  if (dash.load.status === 'loading') {
    return (
      <div role="status" aria-busy="true" className="mo-editor-muted">
        <LoadingIndicator>{t.dashboard.loading}</LoadingIndicator>
      </div>
    );
  }
  if (dash.load.status === 'error') {
    return (
      <Notice
        title={t.dashboard.notLoaded}
        action={
          <Button kind="tonal" size="small" onClick={dash.reload}>
            {t.dashboard.tryAgain}
          </Button>
        }
      >
        {null}
      </Notice>
    );
  }
  return (
    <div className="mo-editor-stack-200">
      {dash.error && (
        <Notice role="alert" title={t.dashboard.notSaved}>
          {saveErrorText[dash.error]}
        </Notice>
      )}
      {dash.editing ? (
        <>
          <div>
            <Button kind="tonal" icon={Plus} disabled={(dash.draft?.widgets.length ?? 0) >= MAX_WIDGETS} onClick={() => setAdding(true)}>
              {t.dashboard.addWidget}
            </Button>
          </div>
          <AddWidget open={adding} groups={widgetGroups(dash.widgets, groupLabel)} onPick={dash.add} onClose={() => setAdding(false)} />
          <EditableCards dash={dash} draw={draw} onSettings={setSettingsFor} />
          {settingsFor && settingsDefinition && (
            <WidgetSettings
              placement={settingsFor}
              definition={settingsDefinition}
              env={env}
              files={files}
              onSave={(settings) => dash.setSettings(settingsFor.id, settings)}
              onClose={() => setSettingsFor(null)}
            />
          )}
        </>
      ) : (
        <div className="mo-staggered-grid mo-editor-dashboard-grid">
          {dash.shown.map(({ placement, definition }) => (
            // A widget with nothing to say renders nothing: its wrapper is then empty and hidden, so it leaves no gutter.
            <div key={placement.id} className={`${spanClass(definition.span)} mo-editor-widget-slot`}>
              {draw(placement, definition)}
            </div>
          ))}
        </div>
      )}
      {!dash.editing && (
        <div>
          <Button kind="text" size="medium" icon={CustomizeIcon} onClick={dash.startEdit}>
            {t.dashboard.edit}
          </Button>
        </div>
      )}
    </div>
  );
}
