// Pages that are not for search engines: the pages a booking or an order ends on (`booking.thanks` in the site's
// config; someone arriving there from Google would also count as a booking in Google Ads) and the editor. Left out
// of the sitemap (packages/editor/astro.mjs) and marked noindex (Base.astro).
import { config } from './siteConfig.mjs';

export const NOINDEX = [...config.booking.thanks, '/editor/'];

// New versions of the service pages, for the owner to compare with the current ones before they replace
// them: /ny/<the current page's address>, e.g. /ny/psykoterapi/angst-behandling/. The overview is
// /ny/ itself (packages/editor/theme/templates/New.astro). Not for search engines either, and not in the lists of pages.
export const PREVIEW = '/ny/';
export const isPreview = (path) => path.startsWith(PREVIEW) && path !== PREVIEW;
/** The address of the current page a new version is for: /ny/vrede/ -> /vrede/. */
export const livePath = (path) => (isPreview(path) ? path.slice(PREVIEW.length - 1) : path);
/** A new version's place on the overview (/ny/#vrede), where what the owner should look at stands. */
export const previewId = (path) =>
  livePath(path)
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, '-');

export const isNoindex = (path) => NOINDEX.includes(path) || path.startsWith(PREVIEW);
