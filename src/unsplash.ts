// Unsplash API integration for Interstellar CMS.
// Official documentation & guidelines:
// - Creating a developer account: https://unsplash.com/documentation#creating-a-developer-account
// - Developer dashboard / applications: https://unsplash.com/oauth/applications
// - API Guidelines: https://unsplash.com/documentation#guidelines--crediting
//
// Unsplash API requires:
// 1. Authorization: Client-ID (handled centrally via Interstellar services proxy, or optional custom key)
// 2. Download tracking: Pinging `photo.links.download_location` whenever a photo is selected/downloaded
// 3. Photographer & Unsplash attribution with UTM parameters (?utm_source=<app>&utm_medium=referral)
// 4. Hotlinking photo.urls or storing imported media with credit

import { prepareImage, type Upload } from './images';
import { siteName } from '@site/editor';

export const UNSPLASH_DOCS_URL = 'https://unsplash.com/documentation#creating-a-developer-account';
export const UNSPLASH_REGISTER_URL = 'https://unsplash.com/oauth/applications';
export const UNSPLASH_API_ROOT = 'https://api.unsplash.com';
export const INTERSTELLAR_SERVICES_ROOT = 'https://interstellar-cms.larsadolfsen.workers.dev/services/unsplash';
export const UNSPLASH_CONFIG_KEY = 'editor-unsplash-config';

export type UnsplashOrientation = 'landscape' | 'portrait' | 'squarish';
export type UnsplashOrderBy = 'relevant' | 'latest';

export interface UnsplashUser {
  id: string;
  username: string;
  name: string;
  portfolio_url: string | null;
  bio: string | null;
  links: {
    self: string;
    html: string;
    photos: string;
  };
  profile_image: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface UnsplashPhotoUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface UnsplashPhotoLinks {
  self: string;
  html: string;
  download: string;
  download_location: string;
}

export interface UnsplashPhoto {
  id: string;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string | null;
  description: string | null;
  alt_description: string | null;
  urls: UnsplashPhotoUrls;
  links: UnsplashPhotoLinks;
  user: UnsplashUser;
}

export interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export interface UnsplashRateLimit {
  limit: number;
  remaining: number;
}

export interface UnsplashConfig {
  accessKey?: string;
  appName?: string;
}

/** Get saved Unsplash configuration from localStorage (custom key override) */
export function getUnsplashConfig(): UnsplashConfig | null {
  try {
    const raw = localStorage.getItem(UNSPLASH_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      accessKey: typeof parsed?.accessKey === 'string' && parsed.accessKey.trim() ? parsed.accessKey.trim() : undefined,
      appName: typeof parsed?.appName === 'string' && parsed.appName.trim() ? parsed.appName.trim() : (siteName || 'interstellar-cms'),
    };
  } catch {
    return null;
  }
}

/** Save Unsplash configuration to localStorage */
export function setUnsplashConfig(cfg: UnsplashConfig): void {
  try {
    localStorage.setItem(
      UNSPLASH_CONFIG_KEY,
      JSON.stringify({
        accessKey: cfg.accessKey?.trim() || '',
        appName: cfg.appName?.trim() || siteName || 'interstellar-cms',
      }),
    );
  } catch {}
}

/** Remove Unsplash configuration */
export function clearUnsplashConfig(): void {
  try {
    localStorage.removeItem(UNSPLASH_CONFIG_KEY);
  } catch {}
}

/** Whether Unsplash is available (always true via Interstellar services or custom key) */
export function hasUnsplashConfig(): boolean {
  return true;
}

/** Extract rate limit from response headers */
export function extractRateLimit(res: Response): UnsplashRateLimit | undefined {
  const limitStr = res.headers.get('X-Ratelimit-Limit') || res.headers.get('x-ratelimit-limit');
  const remainingStr = res.headers.get('X-Ratelimit-Remaining') || res.headers.get('x-ratelimit-remaining');
  if (limitStr && remainingStr) {
    const limit = Number.parseInt(limitStr, 10);
    const remaining = Number.parseInt(remainingStr, 10);
    if (!Number.isNaN(limit) && !Number.isNaN(remaining)) {
      return { limit, remaining };
    }
  }
  return undefined;
}

/** Format UTM-tagged attribution URLs and credits according to Unsplash guidelines */
export function getUnsplashAttribution(photo: UnsplashPhoto, appName?: string) {
  const app = encodeURIComponent(appName || getUnsplashConfig()?.appName || siteName || 'interstellar-cms');
  const utm = `utm_source=${app}&utm_medium=referral`;
  const photographerName = photo.user.name || `@${photo.user.username}`;
  const photographerUrl = `${photo.user.links.html}?${utm}`;
  const unsplashUrl = `https://unsplash.com/?${utm}`;

  const text = `Photo by ${photographerName} on Unsplash`;
  const markdown = `Photo by [${photographerName}](${photographerUrl}) on [Unsplash](${unsplashUrl})`;
  const html = `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener noreferrer">${photographerName}</a> on <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer">Unsplash</a>`;

  return {
    photographerName,
    photographerUrl,
    unsplashUrl,
    text,
    markdown,
    html,
  };
}

/** Mandatory Unsplash download tracking: must be triggered whenever a photo is chosen/downloaded */
export async function trackUnsplashDownload(downloadLocation: string, accessKey?: string): Promise<boolean> {
  const key = accessKey || getUnsplashConfig()?.accessKey;
  try {
    if (key) {
      const res = await fetch(downloadLocation, {
        headers: { Authorization: `Client-ID ${key}` },
      });
      return res.ok;
    }
    const res = await fetch(`${INTERSTELLAR_SERVICES_ROOT}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadLocation }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Search Unsplash photos */
export async function searchUnsplashPhotos(
  params: {
    query: string;
    page?: number;
    per_page?: number;
    orientation?: UnsplashOrientation;
    order_by?: UnsplashOrderBy;
  },
  accessKey?: string,
): Promise<{ photos: UnsplashPhoto[]; total: number; total_pages: number; rateLimit?: UnsplashRateLimit }> {
  const key = accessKey || getUnsplashConfig()?.accessKey;
  const isDirect = Boolean(key);

  const queryParams = new URLSearchParams({
    query: params.query,
    page: String(params.page ?? 1),
    per_page: String(params.per_page ?? 24),
  });
  if (params.orientation) queryParams.set('orientation', params.orientation);
  if (params.order_by) queryParams.set('order_by', params.order_by);

  const targetUrl = isDirect
    ? `${UNSPLASH_API_ROOT}/search/photos?${queryParams.toString()}`
    : `${INTERSTELLAR_SERVICES_ROOT}/search?${queryParams.toString()}`;

  const headers: Record<string, string> = isDirect ? { Authorization: `Client-ID ${key}` } : {};

  const res = await fetch(targetUrl, { headers });
  const rateLimit = extractRateLimit(res);

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Unsplash API error (${res.status})`);
  }

  const data = (await res.json()) as UnsplashSearchResult;
  return {
    photos: data.results || [],
    total: data.total || 0,
    total_pages: data.total_pages || 0,
    rateLimit,
  };
}

/** List editorial/curated photos (when no search query has been entered yet) */
export async function listUnsplashPhotos(
  params?: {
    page?: number;
    per_page?: number;
    order_by?: 'latest' | 'popular' | 'oldest';
  },
  accessKey?: string,
): Promise<{ photos: UnsplashPhoto[]; rateLimit?: UnsplashRateLimit }> {
  const key = accessKey || getUnsplashConfig()?.accessKey;
  const isDirect = Boolean(key);

  const queryParams = new URLSearchParams({
    page: String(params?.page ?? 1),
    per_page: String(params?.per_page ?? 24),
    order_by: params?.order_by ?? 'popular',
  });

  const targetUrl = isDirect
    ? `${UNSPLASH_API_ROOT}/photos?${queryParams.toString()}`
    : `${INTERSTELLAR_SERVICES_ROOT}/photos?${queryParams.toString()}`;

  const headers: Record<string, string> = isDirect ? { Authorization: `Client-ID ${key}` } : {};

  const res = await fetch(targetUrl, { headers });
  const rateLimit = extractRateLimit(res);

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Unsplash API error (${res.status})`);
  }

  const photos = (await res.json()) as UnsplashPhoto[];
  return { photos: Array.isArray(photos) ? photos : [], rateLimit };
}

/** Test Unsplash Connection and verify connectivity + rate limit */
export async function testUnsplashConnection(
  accessKey?: string,
): Promise<{ ok: boolean; rateLimit?: UnsplashRateLimit; error?: string }> {
  try {
    const key = accessKey || getUnsplashConfig()?.accessKey;
    const isDirect = Boolean(key);

    const targetUrl = isDirect
      ? `${UNSPLASH_API_ROOT}/photos?per_page=1`
      : `${INTERSTELLAR_SERVICES_ROOT}/status`;

    const headers: Record<string, string> = isDirect ? { Authorization: `Client-ID ${key}` } : {};

    const res = await fetch(targetUrl, { headers });
    const data = await res.json().catch(() => ({}));

    if (data.rateLimit) {
      return { ok: res.ok, rateLimit: data.rateLimit };
    }
    const rateLimit = extractRateLimit(res);
    return { ok: res.ok, rateLimit, error: res.ok ? undefined : (data.error || `HTTP ${res.status}`) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Imports an Unsplash photo as a local asset into the CMS media files:
 * 1. Downloads the image binary at regular size (approx 1080px wide)
 * 2. Fires download tracking to Unsplash
 * 3. Prepares file metadata and dimensions as a local Upload asset
 */
export async function importUnsplashToMedia(
  photo: UnsplashPhoto,
  accessKey?: string,
): Promise<{ upload: Upload; attribution: ReturnType<typeof getUnsplashAttribution> }> {
  const key = accessKey || getUnsplashConfig()?.accessKey;

  // Trigger download tracking as required by Unsplash guidelines
  void trackUnsplashDownload(photo.links.download_location, key);

  // Download photo binary at regular size
  const res = await fetch(photo.urls.regular);
  if (!res.ok) throw new Error(`Kunne ikke hente foto fra Unsplash (${res.status})`);

  const blob = await res.blob();
  const filename = `unsplash-${photo.user.username}-${photo.id}.jpg`;
  const file = new File([blob], filename, { type: 'image/jpeg' });

  const attribution = getUnsplashAttribution(photo);
  const upload = await prepareImage(file);

  return {
    upload,
    attribution,
  };
}
