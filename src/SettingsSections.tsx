// The layout of a settings screen with several parts (Appearance › Header, Appearance › Footer), as the page form's
// (EntryForm.tsx): `top` (the preview) over the sections, each folding in and out under its heading (FoldSection), with
// their "on this page" list at the window's end edge on large and wider screens (FormColumns, SectionPane, SectionList).
// The first is open from the start. On a phone (compact) only one is open at a time, an accordion: opening one folds the
// others; wider they open and fold each on its own, as a page's. Exposes useSettingsSections and SettingsSections. Uses
// formSections.ts and ui.tsx.
import type { ReactNode } from 'react';
import { FoldSection, FormColumns, type NavigationItem, SectionList, SectionPane, useAtLeast } from './ui';
import { useFormSections } from './formSections';
import { t } from './i18n';

/** A section of the screen: its id, its heading (its name in the list) and its fields. */
export type SettingsSection = NavigationItem & { content: ReactNode };

/** The sections' state, made by the screen, so a field that keeps it from being saved can open its section (`unfold`) and
 * mark it in the list (`steer`) before it is scrolled to. */
export function useSettingsSections(sections: NavigationItem[]) {
  const single = !useAtLeast('medium');
  return useFormSections<string>(
    sections,
    sections.slice(0, 1).map((s) => s.id),
    single,
  );
}

export function SettingsSections({
  title,
  top,
  sections,
  state,
}: {
  /** The screen's name, over the sections list. */
  title: string;
  top?: ReactNode;
  sections: SettingsSection[];
  state: ReturnType<typeof useSettingsSections>;
}) {
  return (
    <FormColumns
      main={
        <>
          {top}
          {sections.map((s) => (
            <FoldSection key={s.id} {...state.sectionProps(s.id)}>
              {s.content}
            </FoldSection>
          ))}
        </>
      }
      pane={
        <SectionPane caption={t.forms.sections.title} title={title}>
          <SectionList title={t.forms.sections.title} items={sections} value={state.section} onChange={state.pick} />
        </SectionPane>
      }
    />
  );
}
