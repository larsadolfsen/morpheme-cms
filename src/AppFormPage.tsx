// An installed app's page when it has settings: the settings form (the Save bar, the question about unsaved changes) around
// the page's tabs, and the page of one of its fields (Field.page) in its place while that is open, the form kept under it.
// Exposes AppFormPage (default). Depends on usePartForm (CompanyForm.tsx), PartFields.tsx, PartFieldPage.tsx and AppList.tsx.
import type { ReactNode } from 'react';
import FormFrame from './FormFrame';
import PartFields, { hasPreview } from './PartFields';
import PartFieldPage from './PartFieldPage';
import PartFormProviders from './PartFormProviders';
import { usePartForm } from './CompanyForm';
import { useFieldPages } from './useFieldPages';
import type { Part } from './schema';
import type { RepoFile } from './github';
import type { Env } from './App';
import type { SiteApp } from './apps';
import type { Back } from './Screen';
import type { TabChoice } from './ui';
import { appHref, settingsHome, settingsRoute } from './AppList';
import { SETTINGS_KEY } from '../lib/appRoute.mjs';

/** `part`: its settings (appSettingsPart); `page`: the field whose page is open; `children` draws the page with the form's
 * fields, which go where it puts them. The field pages of an app with a screen of its kind (settingsHome) are on that
 * screen, as its form has them. */
export default function AppFormPage<T extends string>({
  app,
  part,
  env,
  files,
  page,
  tabs,
  back,
  children,
}: {
  app: SiteApp;
  part: Part;
  env: Env;
  files: RepoFile[];
  page?: string;
  tabs: TabChoice<T>;
  back: Back;
  children: (fields: ReactNode) => ReactNode;
}) {
  const form = usePartForm({ part, env, files });
  const address = appHref(app).slice(1);
  // Its field pages are drawn here, over the form, unless the form has them on the screen with its kind.
  const base = settingsHome(app) ? undefined : `${address}/${SETTINGS_KEY}`;
  const open = useFieldPages(part, address, base, page);
  const pageOf = (name: string) => `#${base ?? settingsRoute(app)}/${name}`;
  return (
    <PartFormProviders form={form} pageOf={pageOf}>
      {open ? (
        <PartFieldPage part={part} field={open} route={address} form={form} back={{ href: appHref(app), label: app.label }} />
      ) : (
        <FormFrame
          title={app.label}
          back={back}
          tabs={tabs}
          dirty={form.dirty}
          saving={form.saving}
          onSave={form.save}
          panel={hasPreview(part)}
        >
          {children(<PartFields part={part} files={files} env={env} form={form} />)}
        </FormFrame>
      )}
    </PartFormProviders>
  );
}
