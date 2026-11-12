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
import { STORE_ROUTE } from './store';
import { t } from './i18n';

export default function StoreSections({ env, files, section: opened }: { env: Env; files: RepoFile[]; section?: Section }) {
  const [chosen, setSection] = useState<Section>(() => readSection());
  // A section in the address (#settings/appstore/plugins) is the one shown; the switch then goes to the address of the next.
  const section = opened ?? chosen;
  const header = (
    <div className="mb-6">
      <SegmentedButton
        label={t.apps.sectionsLabel}
        value={section}
        options={SECTIONS.map((value) => ({ value, label: t.apps.sections[value] }))}
        onChange={(next) => {
          saveSection(undefined, next);
          setSection(next);
          if (opened) location.hash = `#${STORE_ROUTE}/${next}`;
        }}
      />
    </div>
  );
  if (section === 'themes') return <ThemeStoreScreen env={env} header={header} />;
  return <RoleStore key={section} env={env} files={files} role={section === 'connectors' ? 'connector' : 'plugin'} header={header} />;
}
