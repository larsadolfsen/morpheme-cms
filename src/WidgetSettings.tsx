// The settings of a placed widget, in the start screen's edit mode (DashboardGrid.tsx): the widget's `settings` fields in the
// editor's sheet (BottomSheet), drawn with the same PartFields and PartFormProviders as an app's settings. The values are
// kept in this component's state until Save, which calls onSave with only the values the person changed (changedOf); the
// parent writes them into the draft dashboard (setSettings in DashboardEdit.tsx), so they are saved with Done, never to the
// repo. The sheet opens when it is mounted; onClose tells the parent that it closed, however (Cancel, Save, Esc, the cross,
// a tap outside). A field with its own page (Field.page) is not supported here: it has no address (`pageOf`).
import { useEffect, useId, useRef, useState } from 'react';
import { siteText, t } from './i18n';
import type { Env } from './App';
import type { RepoFile } from './github';
import type { Placement } from './dashboard.mjs';
import { changedOf, valuesOf } from './widgetValues.mjs';
import PartFields from './PartFields';
import PartFormProviders from './PartFormProviders';
import { useWrongField, type FieldContext } from './fields';
import { clean, problemAt } from './check';
import type { Part } from './schema';
import type { WidgetDefinition } from './widgets';
import { BottomSheet, Button, SheetActions, SheetBody, SheetTitle, atLeastNow } from './ui';
import { usePane } from './PaneHost';

export function WidgetSettings({
  placement,
  definition,
  env,
  files = [],
  onSave,
  onClose,
}: {
  placement: Placement;
  definition: WidgetDefinition;
  env: Env;
  files?: RepoFile[];
  onSave: (settings: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // From medium (600 dp) the settings are in the pane beside the page (owner, 15 Nov 2026: settings are a pane, not a dialog), below it the sheet
  // from the bottom; taken when it opens.
  const [inPane] = useState(() => atLeastNow('medium'));
  const opener = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const headingId = useId();
  useEffect(() => {
    const el = dialog.current;
    if (!inPane && el && !el.open) el.showModal();
  }, []);
  // The sheet or the pane goes (the parent is told when it has, however it went).
  const closeIt = async () => {
    if (inPane) {
      await pane.close();
      onClose();
    } else dialog.current?.close();
  };

  const settings = definition.settings!;
  const { fields, values: defaults } = settings;
  // A CMS widget's label is the editor's text; an app widget's is the site's (as in AddWidget.tsx).
  const label = placement.widget.startsWith('cms:') ? definition.label : siteText(definition.label);
  const title = t.dashboard.settingsOf(label);
  // A part like an app's settings (appSettingsPart in AppList.tsx), but without `file` and `commit`: that function takes a
  // SiteApp and makes a part that is saved to a file in the repo (usePartForm), and a widget's settings are saved in the
  // dashboard instead.
  const part: Part = { id: placement.widget, label, icon: definition.icon, fields, defaults };
  const [values, setValues] = useState(() => valuesOf(defaults, placement.settings));
  const wrongField = useWrongField((text) => env.notify({ text, error: true }));
  const context: FieldContext = { relations: env.relations, lists: env.lists, testimonials: env.testimonials, site: env.site };
  // `base` is only read for a block preview, which a widget has none of.
  const form = { base: { path: '', oid: '', text: '{}' }, values, setValues, context, wrongField };

  const save = () => {
    if (wrongField.stop(problemAt(fields, values))) return;
    onSave(changedOf(defaults, clean(fields, values)));
    void closeIt();
  };

  const fieldsOf = (
    <PartFormProviders form={form}>
      <PartFields part={part} files={files} env={env} form={form} />
    </PartFormProviders>
  );
  const pane = usePane(
    inPane
      ? {
          headline: title,
          headlineId: headingId,
          beforeClose: async () => {
            await closeIt();
            return false;
          },
          opener: opener.current,
          onBack: () => void closeIt(),
          backLabel: t.common.back,
          actions: (
            <>
              <Button onClick={save}>{t.common.save}</Button>
              <Button kind="outlined" onClick={() => void closeIt()}>
                {t.common.cancel}
              </Button>
            </>
          ),
          children: <div className="mo-editor-stack-250">{fieldsOf}</div>,
        }
      : null,
  );

  return (
    <>
      <BottomSheet ref={dialog} aria-label={title} onClose={onClose} onClick={(e) => e.target === dialog.current && void closeIt()}>
        {!inPane && (
          <>
            <SheetTitle title={title} onClose={() => void closeIt()} />
            <SheetBody>{fieldsOf}</SheetBody>
            <SheetActions onCancel={() => void closeIt()} onDone={save} done={t.common.save} />
          </>
        )}
      </BottomSheet>
      {pane.portal}
    </>
  );
}
