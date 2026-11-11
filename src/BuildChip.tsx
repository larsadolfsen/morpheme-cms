// A small chip in the top bar: `Updating the website…` from Save until the build is on the site, then `Live`.
import { useBuildState } from './buildState';
import { t } from './i18n';

export function BuildChip() {
  const state = useBuildState();
  if (state === 'idle') return null;
  const label = state === 'updating' ? t.app.building : state === 'live' ? t.app.live : t.app.buildFailed;
  return (
    <span
      role="status"
      title={label}
      className={`flex h-8 shrink-0 items-center gap-2 rounded-lg border px-2 text-xs medium:px-3 ${
        state === 'failed' ? 'border-error text-error' : 'border-outline-variant text-on-surface-variant'
      }`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${state === 'updating' ? 'animate-pulse bg-primary' : state === 'live' ? 'bg-primary' : 'bg-error'}`}
      />
      <span className="max-w-[9rem] truncate medium:max-w-none">{label}</span>
    </span>
  );
}
