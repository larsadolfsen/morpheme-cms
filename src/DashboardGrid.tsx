// The widgets of the start screen (widgets.ts) in a grid: the person's dashboard is loaded from the Worker
// (dashboardStore.ts) and each placement whose widget exists is drawn with its own card. One column on a compact screen,
// two from medium, three from expanded; a card is as tall as its content. Shows a loading state and, when the dashboard
// can't be loaded, a message with a button to try again. Editing the dashboard is not here yet.
import { useEffect, useMemo, useState } from 'react';
import { t } from './i18n';
import { apps } from './site';
import { activeApps } from './apps';
import { allWidgets } from './widgets';
import { cmsWidgets } from './cmsWidgets';
import { loadDashboard, placementsOf } from './dashboardStore';
import type { StoredDashboard } from './dashboard.mjs';
import type { Env } from './App';
import type { RepoFile } from './github';
import { Button, LoadingIndicator, Notice } from './ui';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; dashboard: StoredDashboard };

/** The CMS's widgets have no app API, so theirs rejects; an app's widget gets the app's own, as its pages do. */
const noApi = () => Promise.reject(new Error('The CMS widgets have no app API'));

export function Dashboard({ files, env }: { files: RepoFile[]; env: Pick<Env, 'appApi'> }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    loadDashboard().then(
      (dashboard) => live && setState({ status: 'ready', dashboard }),
      () => live && setState({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [attempt]);
  const installed = activeApps(files).join();
  const widgets = useMemo(() => allWidgets(apps, installed ? installed.split(',') : [], cmsWidgets), [installed]);

  if (state.status === 'loading') {
    return (
      <div role="status" aria-busy="true" className="text-on-surface-variant">
        <LoadingIndicator>{t.dashboard.loading}</LoadingIndicator>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <Notice
        title={t.dashboard.notLoaded}
        action={
          <Button kind="tonal" size="small" onClick={() => setAttempt((n) => n + 1)}>
            {t.dashboard.tryAgain}
          </Button>
        }
      >
        {null}
      </Notice>
    );
  }
  return (
    <div className="grid items-start gap-4 medium:grid-cols-2 expanded:grid-cols-3">
      {placementsOf(state.dashboard, widgets).map(({ placement, definition }) => {
        const source = placement.widget.slice(0, placement.widget.indexOf(':'));
        const Widget = definition.component;
        return (
          <Widget
            key={placement.id}
            api={source === 'cms' ? noApi : (path, init) => env.appApi(source, path, init)}
            settings={{ ...definition.settings?.values, ...placement.settings }}
            editing={false}
          />
        );
      })}
    </div>
  );
}
