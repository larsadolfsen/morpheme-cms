import { useEffect, useState, type ReactElement } from 'react';
import {
  Camera,
  CheckCircle,
} from '@phosphor-icons/react';
import type { AppPageProps } from '@interstellarcms/cms/src/apps';
import { Button } from '@interstellarcms/cms/src/ui';
import {
  testUnsplashConnection,
  type UnsplashRateLimit,
} from '@interstellarcms/cms/src/unsplash';
import UnsplashPicker from '@interstellarcms/cms/src/UnsplashPicker';
import { siteText, t } from '@interstellarcms/cms/src/i18n';

export default function UnsplashAppPage({ api }: AppPageProps): ReactElement {
  const [testing, setTesting] = useState(false);
  const [rateLimit, setRateLimit] = useState<UnsplashRateLimit | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    testUnsplashConnection().then((res) => {
      if (res.ok && res.rateLimit) {
        setRateLimit(res.rateLimit);
      }
    });
  }, []);

  async function runTest() {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await testUnsplashConnection();
      if (res.ok) {
        if (res.rateLimit) setRateLimit(res.rateLimit);
        setStatusMessage(t.media.unsplash.connected);
      } else {
        setStatusMessage(res.error || t.media.unsplash.keyInvalid);
      }
    } catch (e) {
      setStatusMessage((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top status bar & actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-container-low p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Camera size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{siteText('Unsplash integration')}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={12} weight="fill" />
                {siteText('Active')}
              </span>
            </div>
            <p className="text-xs text-muted">
              {rateLimit
                ? `${rateLimit.limit <= 50 ? t.media.unsplash.demoMode : t.media.unsplash.productionMode} • ${t.media.unsplash.remainingRequests(rateLimit.remaining, rateLimit.limit)}`
                : siteText('Search and insert free photos with automatic download tracking and photographer attribution.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button kind="outlined" size="small" disabled={testing} onClick={runTest}>
            {testing ? siteText('Testing...') : siteText('Test connection')}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-surface-container p-3 text-sm">
          <p>{statusMessage}</p>
        </div>
      )}

      {/* Live Unsplash Photo Explorer */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-medium">{siteText('Explore photos')}</h3>
          <p className="text-xs text-muted">
            {siteText('Search for photos, test keywords, and preview how images are credited.')}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <UnsplashPicker
            onPick={(src, attribution) => {
              alert(`${siteText('Selected photo:')} ${src}\n${attribution?.text || ''}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
