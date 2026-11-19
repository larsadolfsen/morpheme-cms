// The one place that decides which addresses the editor puts in an image's `src` or a link's `href`. A value that is
// not on the list is dropped (undefined), never repaired. Each check is a plain pattern on the value in the branch that
// returns it, so the rule is readable and a scanner can see it.
//
// An image may be: a path on this site (/images/a.webp, images/a.webp), an http(s) address, a blob: address this
// browser made (an image picked in the editor), or a data:image address of a format an image can have (the editor
// makes SVG ones for its examples). Never javascript:, vbscript:, data:text/html or any other scheme. A link may be
// a route of the editor (#files), a path on this site or an http(s) address.

// A control character anywhere, or a leading space, lets a browser read another scheme ("java\tscript:").
const CONTROL = /\p{Cc}/u;

// One pattern for each kind of address, tested in the branch that returns the value, so a reader and a scanner see which
// check lets which value through.
const HTTP = /^https?:\/\/[^\s\\]+$/i;
const BLOB = /^blob:https?:\/\/[^\s\\]+$/i;
const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp|gif|avif|svg\+xml)(?:;[a-z0-9=-]+)*,[^\s]*$/i;
// A path on this site: one slash, never two ("//host") or a slash and a backslash.
const ROOT_PATH = /^\/(?![/\\])[^\\]*$/;
// A relative path: no scheme ("javascript:"), no leading slash, backslash or space.
const RELATIVE_PATH = /^(?![a-z][a-z0-9+.-]*:)(?![/\\\s])[^\\]*$/i;
const ROUTE = /^#[^\s\\]*$/;

/** The address if an image may be drawn from it, else undefined. */
export function safeImageSrc(value) {
  if (typeof value !== 'string' || value === '' || CONTROL.test(value)) return undefined;
  if (HTTP.test(value)) return value;
  if (BLOB.test(value)) return value;
  if (DATA_IMAGE.test(value)) return value;
  if (ROOT_PATH.test(value)) return value;
  if (RELATIVE_PATH.test(value)) return value;
  return undefined;
}

/** The address if a link may go there, else undefined. */
export function safeHref(value) {
  if (typeof value !== 'string' || value === '' || CONTROL.test(value)) return undefined;
  if (HTTP.test(value)) return value;
  if (ROUTE.test(value)) return value;
  if (ROOT_PATH.test(value)) return value;
  if (RELATIVE_PATH.test(value)) return value;
  return undefined;
}
