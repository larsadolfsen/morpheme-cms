// The widgets of the start screen (widgets.ts) in a grid: the person's dashboard is loaded from the Worker
// (dashboardStore.ts, through useDashboard in DashboardEdit.tsx, which Start in Library.tsx owns) and each placement whose
// widget exists is drawn with its own card. One column on a compact screen, two from medium, three from expanded; a card is
// as tall as its content. Shows a loading state and, when the dashboard can't be loaded, a message with a button to try
// again. In edit mode every card is drawn with `editing` in a frame with its controls (EditableCards), and a failed save is
// a Notice over the grid.
import { t } from './i18n';
import type { Placement } from './dashboard.mjs';
import type { Env } from './App';
import { EditableCards, saveErrorText, type DashboardEditing } from './DashboardEdit';
import type { WidgetDefinition } from './widgets';
import { Button, LoadingIndicator, Notice } from './ui';

/** The CMS's widgets have no app API, so theirs rejects; an app's widget gets the app's own, as its pages do. */
const noApi = () => Promise.reject(new Error('The CMS widgets have no app API'));

export function Dashboard({ dash, env }: { dash: DashboardEditing; env: Pick<Env, 'appApi'> }) {
  const draw = ({ id, widget, settings }: Placement, definition: WidgetDefinition) => {
    const source = widget.slice(0, widget.indexOf(':'));
    const Widget = definition.component;
    return (
      <Widget
        key={id}
        api={source === 'cms' ? noApi : (path, init) => env.appApi(source, path, init)}
        settings={{ ...definition.settings?.values, ...settings }}
        editing={dash.editing}
      />
    );
  };

  if (dash.load.status === 'loading') {
    return (
      <div role="status" aria-busy="true" className="text-on-surface-variant">
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
    <div className="space-y-4">
      {dash.error && (
        <Notice role="alert" title={t.dashboard.notSaved}>
          {saveErrorText[dash.error]}
        </Notice>
      )}
      {dash.editing ? (
        <EditableCards dash={dash} draw={draw} />
      ) : (
        <div className="grid items-start gap-4 medium:grid-cols-2 expanded:grid-cols-3">
          {dash.shown.map(({ placement, definition }) => draw(placement, definition))}
        </div>
      )}
    </div>
  );
}
