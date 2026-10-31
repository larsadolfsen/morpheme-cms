// Unsplash API integration for Interstellar CMS.
// Official documentation & guidelines:
// - Creating a developer account: https://unsplash.com/documentation#creating-a-developer-account
// - Developer dashboard / applications: https://unsplash.com/oauth/applications
// - API Guidelines: https://unsplash.com/documentation#guidelines--crediting
//
// Unsplash API requires:
// 1. Authorization: Client-ID <ACCESS_KEY>
// 2. Download tracking: Pinging `photo.links.download_location` whenever a photo is selected/downloaded
// 3. Photographer & Unsplash attribution with UTM parameters (?utm_source=<app>&utm_medium=referral)
// 4. Hotlinking photo.urls or storing imported media with credit

import { prepareImage, type Upload } from './images';
import { siteName } from '@site/editor';

export const UNSPLASH_DOCS_URL = 'https://unsplash.com/documentation#creating-a-developer-account';
export const UNSPLASH_REGISTER_URL = 'https://unsplash.com/oauth/applications';
export const UNSPLASH_API_ROOT = 'https://api.unsplash.com';
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
  accessKey: string;
  appName?: string;
}

/** Get saved Unsplash configuration from localStorage */
export function getUnsplashConfig(): UnsplashConfig | null {
  try {
    const raw = localStorage.getItem(UNSPLASH_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessKey === 'string' && parsed.accessKey.trim()) {
      return {
        accessKey: parsed.accessKey.trim(),
        appName: typeof parsed.appName === 'string' && parsed.appName.trim() ? parsed.appName.trim() : (siteName || 'interstellar-cms'),
      };
    }
  } catch {}
  return null;
}

/** Save Unsplash configuration to localStorage */
export function setUnsplashConfig(cfg: UnsplashConfig): void {
  try {
    localStorage.setItem(
      UNSPLASH_CONFIG_KEY,
      JSON.stringify({
        accessKey: cfg.accessKey.trim(),
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

/** Whether Unsplash is configured */
export function hasUnsplashConfig(): boolean {
  return !!getUnsplashConfig()?.accessKey;
}

/** Extract rate limit info from response headers */
export function extractRateLimit(res: Response): UnsplashRateLimit | undefined {
  const limit = res.headers.get('x-ratelimit-limit');
  const remaining = res.headers.get('x-ratelimit-remaining');
  if (limit !== null && remaining !== null) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
    };
  }
  return undefined;
}

/** Format UTM-tagged attribution URLs and credits according to Unsplash guidelines */
export function getUnsplashAttribution(photo: UnsplashPhoto, appName?: string) {
  const app = encodeURIComponent(appName || siteName || 'interstellar-cms');
  const utm = `utm_source=${app}&utm_medium=referral`;
  const photographerUrl = `${photo.user.links.html}?${utm}`;
  const unsplashUrl = `https://unsplash.com/?${utm}`;
  const photographerName = photo.user.name || `@${photo.user.username}`;
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
  if (!key) return false;
  try {
    const res = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${key}`,
      },
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
  if (!key) throw new Error('Unsplash access key not configured');

  const queryParams = new URLSearchParams({
    query: params.query,
    page: String(params.page ?? 1),
    per_page: String(params.per_page ?? 24),
  });
  if (params.orientation) queryParams.set('orientation', params.orientation);
  if (params.order_by) queryParams.set('order_by', params.order_by);

  const res = await fetch(`${UNSPLASH_API_ROOT}/search/photos?${queryParams.toString()}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
    },
  });

  const rateLimit = extractRateLimit(res);

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Unsplash API error (${res.status})`);
  }

  const data = (await res.json()) as UnsplashSearchResult;
  return {
    photos: data.results,
    total: data.total,
    total_pages: data.total_pages,
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
  if (!key) throw new Error('Unsplash access key not configured');

  const queryParams = new URLSearchParams({
    page: String(params?.page ?? 1),
    per_page: String(params?.per_page ?? 24),
    order_by: params?.order_by ?? 'popular',
  });

  const res = await fetch(`${UNSPLASH_API_ROOT}/photos?${queryParams.toString()}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
    },
  });

  const rateLimit = extractRateLimit(res);

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Unsplash API error (${res.status})`);
  }

  const photos = (await res.json()) as UnsplashPhoto[];
  return { photos, rateLimit };
}

/** Test an Unsplash Access Key and verify connectivity + rate limit mode (demo vs production) */
export async function testUnsplashConnection(
  accessKey: string,
): Promise<{ ok: boolean; rateLimit?: UnsplashRateLimit; error?: string }> {
  try {
    const res = await fetch(`${UNSPLASH_API_ROOT}/photos?per_page=1`, {
      headers: {
        Authorization: `Client-ID ${accessKey.trim()}`,
      },
    });
    const rateLimit = extractRateLimit(res);
    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: 'Unauthorized: Invalid Access Key' };
      if (res.status === 403) return { ok: false, error: 'Forbidden: Hourly rate limit exceeded' };
      return { ok: false, error: `Unsplash returned HTTP ${res.status}` };
    }
    return { ok: true, rateLimit };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Imports an Unsplash photo as a local asset into the CMS media files:
 * 1. Fetches the image blob (using regular high quality url)
 * 2. Fires download tracking to Unsplash
 * 3. Prepares it with `prepareImage` (optimized to WebP, responsive dimensions)
 */
export async function importUnsplashToMedia(
  photo: UnsplashPhoto,
  accessKey?: string,
): Promise<{ upload: Upload; attribution: ReturnType<typeof getUnsplashAttribution> }> {
  const key = accessKey || getUnsplashConfig()?.accessKey;

  // 1. Mandatory download tracking
  if (photo.links?.download_location) {
    void trackUnsplashDownload(photo.links.download_location, key);
  }

  // 2. Fetch the picture
  // Regular is 1080px wide which is ideal for responsive web pictures
  const imageUrl = photo.urls.regular || photo.urls.full;
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Kunne ikke hente foto fra Unsplash (${res.status})`);
  const blob = await res.blob();

  // 3. Build a File object with descriptive name based on photographer and photo id
  const filename = `unsplash-${photo.user.username}-${photo.id}.jpg`;
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // 4. Prepare image in CMS format (max 2000px, WebP, placed in uploads/<year>/<month>/)
  const upload = await prepareImage(file);
  const attribution = getUnsplashAttribution(photo);

  return { upload, attribution };
}
