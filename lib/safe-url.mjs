// The one place that decides which addresses the editor puts in an image's `src` or a link's `href`. A value that is
// not on the list is dropped (undefined), never repaired. An image address is checked by patterns and then by the scheme of
// the parsed address, which is what is given back (`safeImageSrc`); a link is checked by patterns (`safeHref`).
//
// An image may be: a path on this site (/images/a.webp, images/a.webp), an http(s) address, a blob: address this
// browser made (an image picked in the editor), or a data:image address of a format an image can have (the editor
// makes SVG ones for its examples). Never javascript:, vbscript:, data:text/html or any other scheme. A link may be
// a route of the editor (#files), a path on this site or an http(s) address.

// A control character anywhere, or a leading space, lets a browser read another scheme ("java\tscript:").
const CONTROL = /\p{Cc}/u;

// One pattern for each kind of address.
const HTTP = /^https?:\/\/[^\s\\]+$/i;
const BLOB = /^blob:https?:\/\/[^\s\\]+$/i;
const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp|gif|avif|svg\+xml)(?:;[a-z0-9=-]+)*,[^\s]*$/i;
// A path on this site: one slash, never two ("//host") or a slash and a backslash.
const ROOT_PATH = /^\/(?![/\\])[^\\]*$/;
// A relative path: no scheme ("javascript:"), no leading slash, backslash or space.
const RELATIVE_PATH = /^(?![a-z][a-z0-9+.-]*:)(?![/\\\s])[^\\]*$/i;
const ROUTE = /^#[^\s\\]*$/;

/** Whether an image may be drawn from this address. */
export function isSafeImageSrc(value) {
  if (typeof value !== 'string' || value === '' || CONTROL.test(value)) return false;
  return HTTP.test(value) || BLOB.test(value) || DATA_IMAGE.test(value) || ROOT_PATH.test(value) || RELATIVE_PATH.test(value);
}

/** Whether a link may go to this address. */
export function isSafeHref(value) {
  if (typeof value !== 'string' || value === '' || CONTROL.test(value)) return false;
  return HTTP.test(value) || ROUTE.test(value) || ROOT_PATH.test(value) || RELATIVE_PATH.test(value);
}

// What a relative address is read against: the page it is drawn on (the browser reads an `src` the same way). Outside a
// page (tests, a build) or on a page that is not http(s) (about:srcdoc), a placeholder host.
function baseUrl() {
  const here = typeof document === 'object' && document.baseURI ? document.baseURI : typeof location === 'object' ? location.href : '';
  return /^https?:/i.test(here) ? here : 'http://localhost/';
}

/**
 * The address to draw an image from, else undefined. An address that passes the patterns above is parsed, and only a
 * parsed address whose scheme is http(s), blob: or data:image is given back (as the browser reads it: a path on this
 * site comes back as a full address of this site). The scheme is tested on the parsed address, the check a scanner can
 * follow; the patterns before it drop what a browser could read as another host or scheme.
 */
export function safeImageSrc(value) {
  if (!isSafeImageSrc(value)) return undefined;
  let url;
  try {
    url = new URL(value, baseUrl());
  } catch {
    return undefined;
  }
  if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'blob:') return url.href;
  if (url.protocol === 'data:' && /^data:image\//i.test(url.href)) return url.href;
  return undefined;
}

/** The address if a link may go there, else undefined. */
export function safeHref(value) {
  return isSafeHref(value) ? value : undefined;
}
