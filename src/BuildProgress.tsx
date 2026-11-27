// The strip under the top bar from Save until the website is built with the save (owner, 25 Nov 2026): "Saved. Publishing to the website."
// with the theme's linear progress indicator (indeterminate: the wait is not known), then "Live" for a moment, or "Not live" with the save
// safe and the build's page on GitHub. The steps are set by App.tsx save() through buildState.ts; waitForSite (deploy.ts) knows them.
// M3 Progress indicators (Guidelines, Usage and Placement): a wait over 5 seconds gets a progress indicator, a linear one on the edge of
// the container that changes, named for screen readers by what it shows (Accessibility, Labeling elements).
import { useEffect } from 'react';
import { SiteLinearProgressIndicator } from './themeUi';
import { Button } from './ui';
import { materialIcon } from './icon';
import { setBuildState, useBuildProgress } from './buildState';
import { t } from './i18n';

/** How long "Live" stays on screen. */
const LIVE_SHOWN = 4000;

export default function BuildProgress() {
  const progress = useBuildProgress();
  const live = progress.step === 'live';
  useEffect(() => {
    if (!live) return;
    const timer = setTimeout(() => setBuildState('idle'), LIVE_SHOWN);
    return () => clearTimeout(timer);
  }, [live]);
  if (progress.step === 'idle') return null;
  const text = t.app.buildProgress;
  const failed = progress.step === 'not-live';
  const Glyph = materialIcon(failed ? 'error' : live ? 'check_circle' : 'cloud_upload');
  return (
    <div className="mo-editor-build-progress" data-step={progress.step} role="status">
      <div className="mo-editor-build-progress__row">
        <Glyph aria-hidden="true" />
        <p>{failed ? text.notLive : live ? text.live : text.publishing}</p>
        {failed && progress.buildUrl && (
          <a className="mo-link" href={progress.buildUrl} target="_blank" rel="noreferrer">
            {text.seeBuild}
          </a>
        )}
        {failed && (
          <Button kind="outlined" onClick={() => setBuildState('idle')}>
            {text.dismiss}
          </Button>
        )}
      </div>
      {!failed && <SiteLinearProgressIndicator label={text.label} value={live ? 1 : undefined} />}
    </div>
  );
}
