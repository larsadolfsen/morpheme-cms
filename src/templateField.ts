// The page form's field of the templates the chosen theme offers (Field.offered: 'templates'): which templates the theme
// offers, which of them the form shows, and what the form shows as chosen. Exposes offeredTemplatesOf, templateFieldOf, shownTemplate.
// Uses chosenTheme (ThemeStore.tsx), themes.ts, sideSettingOf (SideColumn.tsx) and lib/page-template.mjs.
import type { RepoFile } from './github';
import type { Field } from './schema';
import { chosenTheme } from './ThemeStore';
import { sideSettingOf } from './SideColumn';
import { themes } from './themes';
import { templateChoices, templateOf, templatesOf } from '../lib/page-template.mjs';

/** The templates the theme chosen (src/data/theme.json) offers, the first the default. */
export const offeredTemplatesOf = (files: RepoFile[]): string[] =>
  templatesOf(themes.find((x) => x.id === chosenTheme(files)) ?? null) as string[];

/** The field with only the options the form can offer: those of the theme, without the sidebar ones while no block is
 * chosen for the column (Appearance › Side column). Null when the field has no `offered` or at most one is left. */
export function templateFieldOf(field: Field, files: RepoFile[]): Field | null {
  if (field.offered !== 'templates') return null;
  const choices: string[] = templateChoices(offeredTemplatesOf(files), sideSettingOf(files) !== null);
  return choices.length > 1 ? { ...field, options: field.options?.filter((o) => choices.includes(o.value)) } : null;
}

/** What the form shows as chosen: the value if the field offers it, else its first option (the theme's default). */
export const shownTemplate = (field: Field, value: unknown): string =>
  templateOf(
    { template: value },
    (field.options ?? []).map((o) => o.value),
  );
