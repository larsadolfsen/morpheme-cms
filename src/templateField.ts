// The page form's field of the templates the chosen theme offers (Field.offered: 'templates'): which templates the theme
// offers, which of them the form shows, and what the form shows as chosen. Exposes offeredTemplatesOf, templateFieldOf, shownTemplate.
// Uses chosenTheme (ThemeStore.tsx), themes.ts, sideSettingOf (SideColumn.tsx), i18n and lib/page-template.mjs.
import type { RepoFile } from './github';
import type { Field } from './schema';
import { chosenTheme } from './ThemeStore';
import { sideSettingOf } from './SideColumn';
import { themes } from './themes';
import { t } from './i18n';
import { templateOf, templatesOf, templatesShown } from '../lib/page-template.mjs';

/** The templates the theme chosen (src/data/theme.json) offers, the first the default. */
export const offeredTemplatesOf = (files: RepoFile[]): string[] =>
  templatesOf(themes.find((x) => x.id === chosenTheme(files)) ?? null) as string[];

/** The field with the options of the theme. A template that is not available (the sidebar ones while no block is chosen
 * for the column) is not shown, unless the page already uses it (`value`), so nothing is lost. When sidebar templates are
 * left out, a link under the field goes to where the column is chosen (Appearance › Side column, `edit`). With one template left, the section still shows it as a selected card; a theme of one
 * template alone shows it as the page's, not changed here (`locked`); with none to choose (a
 * theme of sidebar templates alone), the theme's default is chosen. Null when the field has no `offered`. */
export function templateFieldOf(field: Field, files: RepoFile[], value?: unknown): Field | null {
  if (field.offered !== 'templates') return null;
  const offered = offeredTemplatesOf(files);
  const { shown, hidden } = templatesShown(offered, sideSettingOf(files) !== null, value);
  const options = field.options?.filter((o) => shown.includes(o.value));
  return {
    ...field,
    options,
    ...(offered.length === 1 ? { locked: true } : {}),
    ...(hidden ? { edit: { to: 'appearance/side-column', text: t.forms.chooseSideColumn } } : {}),
  };
}

/** What the form shows as chosen: the value if the field offers it to choose, else its first such option (the theme's
 * default). */
export const shownTemplate = (field: Field, value: unknown): string =>
  templateOf(
    { template: value },
    (field.options ?? []).map((o) => o.value),
  );
