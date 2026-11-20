// The editor's side of the media providers (lib/mediaProviders.mjs, worker/media-providers.js): its calls to the Worker, which makes
// every request to the provider, so no key and no outside address reaches the browser.
import type { MediaItem } from '../lib/mediaProviders.mjs';

export type { MediaItem };
export type ProviderRef = { app: string; id: string; label: string };

/** A failure with the status the Worker answered. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const base = (p: ProviderRef) => `/api/media-providers/${encodeURIComponent(p.app)}/${encodeURIComponent(p.id)}`;

async function answer<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ProviderError(data.error ?? 'failed', res.status);
  return data;
}

/** Whether the provider needs a key it has not got yet. */
export async function providerNeedsKey(p: ProviderRef): Promise<boolean> {
  const all = await answer<{ app: string; id: string; needsKey: boolean; connected: boolean }[]>(await fetch('/api/media-providers'));
  const found = all.find((x) => x.app === p.app && x.id === p.id);
  return !!found && found.needsKey && !found.connected;
}

export async function saveProviderKey(p: ProviderRef, key: string): Promise<void> {
  await answer(
    await fetch(`${base(p)}/key`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) }),
  );
}

export const removeProviderKey = async (p: ProviderRef): Promise<void> =>
  void (await answer(await fetch(`${base(p)}/key`, { method: 'DELETE' })));

export async function searchProvider(
  p: ProviderRef,
  query: string,
  page: number,
): Promise<{ items: MediaItem[]; totalPages: number | null }> {
  const params = new URLSearchParams({ query, page: String(page) });
  return answer(await fetch(`${base(p)}/search?${params}`));
}

/** The address the editor shows a provider's image from: through the Worker, from a host the app listed. */
export const providerImage = (p: ProviderRef, url: string) => `${base(p)}/image?${new URLSearchParams({ url })}`;

/** The image's bytes as a file, through the Worker. */
export async function providerFile(p: ProviderRef, item: MediaItem): Promise<File> {
  const res = await fetch(providerImage(p, item.url));
  if (!res.ok) throw new ProviderError('image', res.status);
  const blob = await res.blob();
  const ending = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${p.id}-${item.id}.${ending}`, { type: blob.type });
}

/** The provider's download tracking call for an image that was inserted (Unsplash asks for it); never blocks or fails the insert. */
export function trackProviderDownload(p: ProviderRef, item: MediaItem): void {
  if (!item.downloadTrackingUrl) return;
  void fetch(`${base(p)}/track`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: item.downloadTrackingUrl }),
  }).catch(() => {});
}
