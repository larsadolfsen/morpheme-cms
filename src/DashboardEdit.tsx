// Editing the start screen's dashboard (DashboardGrid.tsx): the state (useDashboard, used by Start in Library.tsx, which
// owns the Screen and so its top bar actions), the top bar action (DashboardAction: an "Edit dashboard" icon button, in edit
// mode the one tonal "Done" button) and the cards in edit mode (EditableCards): each in a frame with a drag handle at its
// start and an overflow menu at its end (Move up, Move down, Settings, Remove). Edits stay in a draft until Done saves
// them (dashboardStore.ts saveDashboard); a failed save keeps edit mode and the draft. The layout edits are dashboard.mjs's,
// the moves dashboardMoves.mjs's. The drag is a pointer extra: the card is raised with the theme's elevation and follows the
// pointer, the others stay until it is dropped; keyboard and screen reader users move a card with the menu.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { t } from './i18n';
import { useAnnounce } from './useAnnounce';
import { apps } from './site';
import { activeApps } from './apps';
import { allWidgets, spanClass, type WidgetDefinition } from './widgets';
import { cmsWidgets } from './cmsWidgets';
import { DashboardSaveError, loadDashboard, placementsOf, saveDashboard } from './dashboardStore';
import { addWidget, removeWidget, setSettings as setPlacementSettings, withoutMissing } from './dashboard.mjs';
import type { Placement, StoredDashboard } from './dashboard.mjs';
import { cardAt, moveBy, moveOnto } from './dashboardMoves.mjs';
import type { RepoFile } from './github';
import { SiteMenuDivider } from './themeUi';
import { Button, IconButton, Menu, MenuItem } from './ui';
import { materialIcon } from './icon';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; dashboard: StoredDashboard };

/** The dashboard's state: what is loaded (and saved), the widgets there are, and edit mode with its draft. `dashboard` is
 * the draft while editing, else the saved one. */
export function useDashboard(files: RepoFile[]) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<StoredDashboard | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DashboardSaveError['kind'] | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // The card whose menu button gets the focus after a move: a new object for each move, so the same card again counts.
  const [focus, setFocus] = useState<{ id: string } | null>(null);

  useEffect(() => {
    let live = true;
    setLoad({ status: 'loading' });
    loadDashboard().then(
      (dashboard) => live && setLoad({ status: 'ready', dashboard }),
      () => live && setLoad({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  const installed = activeApps(files).join();
  const widgets = useMemo(() => allWidgets(apps, installed ? installed.split(',') : [], cmsWidgets), [installed]);
  const dashboard = draft ?? (load.status === 'ready' ? load.dashboard : null);
  const shown = dashboard ? placementsOf(dashboard, widgets) : [];
  const shownIds = shown.map((s) => s.placement.id);

  const change = (next: StoredDashboard, id: string, said?: { position: number; total: number }) => {
    setDraft(next);
    setFocus({ id });
    if (said) setAnnouncement(t.dashboard.moved(said.position, said.total));
  };
  // Edit dashboard and Done replace each other, so the one that was pressed takes the focus to the one that replaces it.
  const handoff = useRef<'done' | 'edit' | null>(null);
  const editing = draft !== null;
  useEffect(() => {
    const to = handoff.current;
    if (!to) return;
    handoff.current = null;
    document.querySelector<HTMLElement>(`[data-dashboard-handoff="${to}"]`)?.focus();
  }, [editing]);
  return {
    load,
    reload: () => setAttempt((n) => n + 1),
    widgets,
    dashboard,
    shown,
    editing: draft !== null,
    draft,
    saving,
    error,
    announcement,
    focus,
    startEdit() {
      if (load.status !== 'ready') return;
      handoff.current = 'done';
      setDraft(load.dashboard);
      setError(null);
      setAnnouncement('');
    },
    /** Saves the draft without the placements that have no widget; leaves edit mode when that worked. */
    async done() {
      if (!draft || saving) return;
      const layout = withoutMissing(draft, widgets.keys());
      setSaving(true);
      setError(null);
      try {
        await saveDashboard(layout);
        setLoad({ status: 'ready', dashboard: layout });
        handoff.current = 'edit';
        setDraft(null);
      } catch (e) {
        setError(e instanceof DashboardSaveError ? e.kind : 'failed');
      } finally {
        setSaving(false);
      }
    },
    /** Adds a placement of `widget` at the end of the draft (a widget may be placed again) and focuses its menu button. */
    add(widget: string) {
      if (!draft) return;
      const next = addWidget(draft, widget, () => crypto.randomUUID());
      change(next, next.widgets.at(-1)!.id);
    },
    moveBy(id: string, delta: number) {
      const moved = draft && moveBy(draft, shownIds, id, delta);
      if (moved) change(moved.dashboard, id, moved);
    },
    moveOnto(id: string, ontoId: string) {
      const moved = draft && moveOnto(draft, shownIds, id, ontoId);
      if (moved) change(moved.dashboard, id, moved);
    },
    /** Sets the placement's settings in the draft (they are saved with Done) and focuses its menu button. */
    setSettings(id: string, settings: Record<string, unknown>) {
      if (!draft) return;
      change(setPlacementSettings(draft, id, settings), id);
    },
    remove(id: string) {
      if (!draft) return;
      const at = shownIds.indexOf(id);
      const next = shownIds[at + 1] ?? shownIds[at - 1];
      setDraft(removeWidget(draft, id));
      if (next) setFocus({ id: next });
    },
  };
}

export type DashboardEditing = ReturnType<typeof useDashboard>;

/** The top bar's action while editing: the one tonal "Done" (busy while it saves). Nothing otherwise: "Edit dashboard" is a text
 * button below the dashboard (DashboardGrid.tsx). */
export function DashboardAction({ dash }: { dash: DashboardEditing }) {
  if (dash.load.status !== 'ready' || !dash.editing) return null;
  return (
    <Button kind="tonal" busy={dash.saving} data-dashboard-handoff="done" onClick={() => void dash.done()}>
      {t.dashboard.done}
    </Button>
  );
}

/** What a failed save says, for each kind. */
export const saveErrorText = {
  'no-storage': t.dashboard.notSavedNoStorage,
  invalid: t.dashboard.notSavedInvalid,
  'too-big': t.dashboard.notSavedTooBig,
  failed: t.dashboard.notSavedFailed,
} satisfies Record<DashboardSaveError['kind'], string>;

type Drag = { id: string; dx: number; dy: number; over: string | null };

/** The cards in edit mode, each in its frame. `draw` draws a widget (editing). `onSettings`: the Settings choice of a card
 * whose widget has settings; without it the choice is not shown. */
export function EditableCards({
  dash,
  draw,
  onSettings,
}: {
  dash: DashboardEditing;
  draw: (placement: Placement, definition: WidgetDefinition) => ReactNode;
  onSettings?: (placement: Placement) => void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [menu, setMenu] = useState<{ id: string; anchor: HTMLElement } | null>(null);
  const { shown, focus } = dash;
  // What a move or a removal did, said by the editor's one announcer.
  useAnnounce(dash.announcement);

  // After a move (or a removal) the menu button of the card keeps the focus.
  useEffect(() => {
    if (focus) grid.current?.querySelector<HTMLElement>(`[data-card-menu="${CSS.escape(focus.id)}"]`)?.focus();
  }, [focus]);

  const overAt = (id: string, x: number, y: number) => {
    const frames = [...(grid.current?.querySelectorAll<HTMLElement>('[data-card]') ?? [])].filter((f) => f.dataset.card !== id);
    return (
      frames[
        cardAt(
          frames.map((f) => f.getBoundingClientRect()),
          x,
          y,
        )
      ]?.dataset.card ?? null
    );
  };
  const handle = (id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, y: e.clientY };
      setDrag({ id, dx: 0, dy: 0, over: null });
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (drag?.id === id)
        setDrag({ id, dx: e.clientX - start.current.x, dy: e.clientY - start.current.y, over: overAt(id, e.clientX, e.clientY) });
    },
    onPointerUp: () => {
      const over = drag?.id === id ? drag.over : null;
      setDrag(null);
      if (over) dash.moveOnto(id, over);
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (e: KeyboardEvent) => e.key === 'Escape' && setDrag(null),
  });

  const at = menu ? shown.findIndex((s) => s.placement.id === menu.id) : -1;
  const open = at === -1 ? null : shown[at];
  return (
    <>
      <div ref={grid} className="mo-staggered-grid mo-editor-settings-dashboard-grid">
        {shown.map(({ placement, definition }) => {
          const dragging = drag?.id === placement.id;
          return (
            <div
              key={placement.id}
              role="group"
              aria-label={definition.label}
              data-card={placement.id}
              style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
              className={`${spanClass(definition.span)} mo-editor-widget-card ${
                dragging ? 'mo-is-dragged mo-editor-widget-lifted' : ''
              } ${drag?.over === placement.id ? 'mo-editor-widget-target' : ''}`}
            >
              <div className="mo-editor-widget-bar">
                <IconButton
                  icon={materialIcon('drag_indicator')}
                  label={t.dashboard.dragCard(definition.label)}
                  tabIndex={-1}
                  className="mo-editor-grab"
                  {...handle(placement.id)}
                />
                <IconButton
                  icon={materialIcon('more_vert')}
                  label={t.dashboard.cardMenu(definition.label)}
                  aria-haspopup="menu"
                  aria-expanded={menu?.id === placement.id}
                  data-card-menu={placement.id}
                  onClick={(e) => setMenu(menu?.id === placement.id ? null : { id: placement.id, anchor: e.currentTarget })}
                />
              </div>
              <div className="mo-editor-widget-body">{draw(placement, definition)}</div>
            </div>
          );
        })}
      </div>
      <Menu
        anchor={menu?.anchor ?? null}
        label={open ? t.dashboard.cardMenu(open.definition.label) : t.dashboard.edit}
        onClose={() => setMenu(null)}
      >
        {open && (
          <>
            <MenuItem icon={materialIcon('arrow_upward')} disabled={at === 0} onClick={() => dash.moveBy(open.placement.id, -1)}>
              {t.dashboard.moveUp}
            </MenuItem>
            <MenuItem
              icon={materialIcon('arrow_downward')}
              disabled={at === shown.length - 1}
              onClick={() => dash.moveBy(open.placement.id, 1)}
            >
              {t.dashboard.moveDown}
            </MenuItem>
            {open.definition.settings && onSettings && (
              <MenuItem icon={materialIcon('settings')} onClick={() => onSettings(open.placement)}>
                {t.dashboard.settings}
              </MenuItem>
            )}
            <SiteMenuDivider />
            <MenuItem icon={materialIcon('delete')} onClick={() => dash.remove(open.placement.id)}>
              {t.dashboard.remove}
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
