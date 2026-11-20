// Pages that are not for search engines: the pages a booking or an order ends on (`booking.thanks` in the site's
// config; someone arriving there from Google would also count as a booking in Google Ads) and the editor. Left out
// of the sitemap (packages/editor/astro.mjs) and marked noindex (Base.astro).
import { config } from './siteConfig.mjs';
import { inPreview, PREVIEW, renamedPreview } from '../lib/previewAddress.mjs';

export const NOINDEX = [...config.booking.thanks, '/editor/'];

// New versions of the service pages, for the owner to compare with the current ones before they replace
// them: /new/<the current page's address>, e.g. /new/services/consulting/. The overview is
// /new/ itself (packages/editor/theme/templates/New.astro). Not for search engines either, and not in the lists of pages.
// A page still under the old address /ny/ counts as one (lib/previewAddress.mjs); getPages() gives it its new address.
export { PREVIEW };
export const isPreview = inPreview;
/** The address of the current page a new version is for: /new/about/ -> /about/. */
export const livePath = (path) => (isPreview(path) ? renamedPreview(path).slice(PREVIEW.length - 1) : path);
/** A new version's place on the overview (/new/#about), where what the owner should look at stands. */
export const previewId = (path) =>
  livePath(path)
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, '-');

export const isNoindex = (path) => NOINDEX.includes(path) || renamedPreview(path).startsWith(PREVIEW);
