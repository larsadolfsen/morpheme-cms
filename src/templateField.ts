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
 * chosen for the column (Appearance › Side column). With only one left it is shown as the page's template, not changed
 * here (`locked`); with none left (a theme of sidebar templates alone), the theme's default so. Null when the field has no
 * `offered`. */
export function templateFieldOf(field: Field, files: RepoFile[]): Field | null {
  if (field.offered !== 'templates') return null;
  const offered = offeredTemplatesOf(files);
  const left: string[] = templateChoices(offered, sideSettingOf(files) !== null);
  const choices = left.length ? left : offered.slice(0, 1);
  const options = field.options?.filter((o) => choices.includes(o.value));
  return { ...field, options, ...(choices.length === 1 ? { locked: true } : {}) };
}

/** What the form shows as chosen: the value if the field offers it, else its first option (the theme's default). */
export const shownTemplate = (field: Field, value: unknown): string =>
  templateOf(
    { template: value },
    (field.options ?? []).map((o) => o.value),
  );
