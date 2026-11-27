// "Site status" on the start screen, the widget cms:status: a card with when the site was last published (builtAt, from
// startData.ts) and the CMS version, as the start screen's status line says them (StartStatus.tsx). Exposes StatusWidget.
// It always renders: a time that is not known says so.
import { useId } from 'react';
import { shortVersion } from '../cmsVersionView.mjs';
import { version } from '../../package.json';
import { t } from '../i18n';
import { when } from '../when';
import { useStartData } from '../startData';
import type { WidgetProps } from '../widgets';
import { SiteCard } from '../themeUi';

export function StatusWidget(_props: WidgetProps) {
  const { builtAt } = useStartData();
  const titleId = useId();
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby={titleId} className="mo-editor-widget-text">
      <h2 id={titleId} className="mo-type-title-medium mo-editor-widget-title">
        {t.library.statusTitle}
      </h2>
      <p className="mo-editor-caption">{builtAt ? t.library.lastPublished(when(builtAt)) : t.library.publishUnknown}</p>
      <p className="mo-editor-caption">{t.library.cmsVersion(shortVersion(version) as string)}</p>
    </SiteCard>
  );
}
