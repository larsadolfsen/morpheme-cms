import { useState, type ReactElement } from 'react';
import { ArrowSquareOut, CheckCircle, Eye, EyeSlash, Key, WarningCircle } from '@phosphor-icons/react';
import { Button, IconButton, Notice, SupportingText, TextField } from './ui';
import {
  clearUnsplashConfig,
  getUnsplashConfig,
  setUnsplashConfig,
  testUnsplashConnection,
  UNSPLASH_DOCS_URL,
  UNSPLASH_REGISTER_URL,
  type UnsplashRateLimit,
} from './unsplash';
import { siteName } from '@site/editor';
import { t } from './i18n';

interface UnsplashSettingsProps {
  onSaved?: () => void;
  onClose?: () => void;
}

export default function UnsplashSettings({ onSaved, onClose }: UnsplashSettingsProps): ReactElement {
  const existing = getUnsplashConfig();
  const [accessKey, setAccessKey] = useState(existing?.accessKey ?? '');
  const [appName, setAppName] = useState(existing?.appName ?? siteName ?? '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; rateLimit?: UnsplashRateLimit; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleTest() {
    if (!accessKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testUnsplashConnection(accessKey.trim());
      setTestResult(res);
    } catch (e) {
      setTestResult({ ok: false, error: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!accessKey.trim()) return;
    setSaving(true);
    setUnsplashConfig({
      accessKey: accessKey.trim(),
      appName: appName.trim() || siteName || 'interstellar-cms',
    });
    setSaving(false);
    onSaved?.();
  }

  function handleDisconnect() {
    clearUnsplashConfig();
    setAccessKey('');
    setTestResult(null);
    onSaved?.();
  }

  return (
    <div className="space-y-6">
      <Notice title={t.media.unsplash.setupTitle}>
        <div className="space-y-2 text-sm">
          <p>{t.media.unsplash.setupDescription}</p>
          <ol className="list-decimal space-y-1 pl-4">
            {t.media.unsplash.setupSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={UNSPLASH_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              <span>{t.media.unsplash.docsLink}</span>
              <ArrowSquareOut size={16} />
            </a>
            <span className="text-muted">•</span>
            <a
              href={UNSPLASH_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              <span>{t.media.unsplash.createAccount}</span>
              <ArrowSquareOut size={16} />
            </a>
          </div>
        </div>
      </Notice>

      <div className="space-y-4">
        <div className="relative">
          <TextField
            label={t.media.unsplash.accessKeyLabel}
            type={showKey ? 'text' : 'password'}
            value={accessKey}
            placeholder="f.eks. efa8bc91..."
            onChange={(e) => {
              setAccessKey(e.target.value);
              setTestResult(null);
            }}
          />
          <div className="absolute right-2 top-8">
            <IconButton
              icon={showKey ? EyeSlash : Eye}
              label={showKey ? 'Skjul nøgle' : 'Vis nøgle'}
              onClick={() => setShowKey(!showKey)}
            />
          </div>
        </div>
        <SupportingText>{t.media.unsplash.accessKeyHint}</SupportingText>

        <TextField
          label={t.media.unsplash.appNameLabel}
          value={appName}
          placeholder={siteName || 'interstellar-cms'}
          onChange={(e) => setAppName(e.target.value)}
        />
        <SupportingText>{t.media.unsplash.attributionRequired}</SupportingText>
      </div>

      {testResult && (
        <div
          className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
            testResult.ok ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'
          }`}
        >
          {testResult.ok ? (
            <>
              <CheckCircle size={20} className="shrink-0 text-primary" />
              <div>
                <p className="font-medium">{t.media.unsplash.connected}</p>
                {testResult.rateLimit && (
                  <p className="mt-0.5 opacity-90">
                    {testResult.rateLimit.limit <= 50 ? t.media.unsplash.demoMode : t.media.unsplash.productionMode}
                    {' — '}
                    {t.media.unsplash.remainingRequests(testResult.rateLimit.remaining, testResult.rateLimit.limit)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <WarningCircle size={20} className="shrink-0 text-error" />
              <div>
                <p className="font-medium">{t.media.unsplash.keyInvalid}</p>
                {testResult.error && <p className="mt-0.5 text-xs opacity-80">{testResult.error}</p>}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button kind="outlined" size="small" disabled={testing || !accessKey.trim()} onClick={handleTest}>
            {testing ? '...' : t.media.unsplash.testConnection}
          </Button>
          {existing && (
            <Button kind="text" size="small" onClick={handleDisconnect}>
              {t.media.unsplash.disconnect}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button kind="text" onClick={onClose}>
              {t.common.cancel}
            </Button>
          )}
          <Button kind="filled" disabled={saving || !accessKey.trim()} onClick={handleSave}>
            {t.media.unsplash.saveKey}
          </Button>
        </div>
      </div>
    </div>
  );
}
