// The page form's field of the templates the chosen theme offers (Field.offered: 'templates'): which templates the theme
// offers, which of them the form shows, and what the form shows as chosen. Exposes offeredTemplatesOf, templateFieldOf, shownTemplate.
// Uses chosenTheme (ThemeStore.tsx), themes.ts, sideSettingOf (SideColumn.tsx), i18n and lib/page-template.mjs.
import type { RepoFile } from './github';
import type { Field } from './schema';
import { chosenTheme } from './ThemeStore';
import { sideSettingOf } from './SideColumn';
import { themes } from './themes';
import { t } from './i18n';
import { templateChoices, templateOf, templatesOf } from '../lib/page-template.mjs';

/** The templates the theme chosen (src/data/theme.json) offers, the first the default. */
export const offeredTemplatesOf = (files: RepoFile[]): string[] =>
  templatesOf(themes.find((x) => x.id === chosenTheme(files)) ?? null) as string[];

/** The field with the options of the theme: the sidebar ones greyed (`disabled`) while no block is chosen for the column,
 * with a link there under the field (Appearance › Side column, `edit`). A theme of one template alone shows it as the
 * page's, not changed here (`locked`); with none to choose (a theme of sidebar templates alone), the theme's default is
 * chosen. Null when the field has no `offered`. */
export function templateFieldOf(field: Field, files: RepoFile[]): Field | null {
  if (field.offered !== 'templates') return null;
  const offered = offeredTemplatesOf(files);
  const left: string[] = templateChoices(offered, sideSettingOf(files) !== null);
  const choices = left.length ? left : offered.slice(0, 1);
  const options = field.options
    ?.filter((o) => offered.includes(o.value))
    .map((o) => (choices.includes(o.value) ? o : { ...o, disabled: true }));
  const greyed = options?.some((o) => o.disabled);
  return {
    ...field,
    options,
    ...(offered.length === 1 ? { locked: true } : {}),
    ...(greyed ? { edit: { to: 'appearance/side-column', text: t.forms.chooseSideColumn } } : {}),
  };
}

/** What the form shows as chosen: the value if the field offers it to choose, else its first such option (the theme's
 * default). */
export const shownTemplate = (field: Field, value: unknown): string =>
  templateOf(
    { template: value },
    (field.options ?? []).filter((o) => !o.disabled).map((o) => o.value),
  );
