// "Appstore" (#settings/appstore): the switch of its three sections, Themes, Connectors and Plugins, over the list of the
// one open. The section last used is kept in this browser; the first time it is Plugins (sectionChoice.mjs).
// Exposes StoreSections (default); uses ThemeStoreScreen (Themes) and AppList.tsx's RoleStore (Connectors, Plugins).
import { useState } from 'react';
import { SegmentedButton } from './ui';
import type { Env } from './App';
import type { RepoFile } from './github';
import { ThemeStoreScreen } from './ThemeStoreScreen';
import { RoleStore } from './AppList';
import { SECTIONS, readSection, saveSection, type Section } from './sectionChoice.mjs';
import { t } from './i18n';

export default function StoreSections({ env, files }: { env: Env; files: RepoFile[] }) {
  const [section, setSection] = useState<Section>(() => readSection());
  const header = (
    <div className="mb-6">
      <SegmentedButton
        label={t.apps.sectionsLabel}
        value={section}
        options={SECTIONS.map((value) => ({ value, label: t.apps.sections[value] }))}
        onChange={(next) => {
          saveSection(undefined, next);
          setSection(next);
        }}
      />
    </div>
  );
  if (section === 'themes') return <ThemeStoreScreen env={env} header={header} />;
  return <RoleStore key={section} env={env} files={files} role={section === 'connectors' ? 'connector' : 'plugin'} header={header} />;
}
