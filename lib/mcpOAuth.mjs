// The checks of the assistants' sign-in (OAuth 2.1: authorization code with PKCE, dynamic client registration, discovery),
// without any storage: the Worker (worker/mcp-oauth.js) keeps what these return. Exposes redirectProblem, pkceMatches,
// randomToken, sha256Hex, clientFromRegistration, isMetadataClientId, clientFromMetadataDocument, protectedResourceMetadata and authorizationServerMetadata. No dependencies
// (Web Crypto), so the Worker can use it.

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const MAX_URI = 2000;

/** Why an assistant's redirect address is refused, or null when it is fine: `https`, or `http` on the same computer
 * (loopback, where desktop assistants listen); no user info and no fragment.
 * @param {unknown} uri @returns {string | null} */
export function redirectProblem(uri) {
  if (typeof uri !== 'string' || !uri) return 'The redirect address is missing.';
  if (uri.length > MAX_URI) return 'The redirect address is too long.';
  let url;
  try {
    url = new URL(uri);
  } catch {
    return 'The redirect address is not an address.';
  }
  if (url.username || url.password) return 'The redirect address must not have a user name or password.';
  if (url.hash) return 'The redirect address must not have a fragment.';
  if (url.protocol === 'https:') return null;
  if (url.protocol === 'http:' && LOOPBACK.has(url.hostname)) return null;
  return 'The redirect address must be https (or http on this computer).';
}

const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

/** Whether a PKCE verifier (RFC 7636, 43 to 128 unreserved characters) is the one the S256 challenge was made from.
 * @param {unknown} verifier @param {unknown} challenge @returns {Promise<boolean>} */
export async function pkceMatches(verifier, challenge) {
  if (typeof verifier !== 'string' || typeof challenge !== 'string') return false;
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  const made = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  return made === challenge;
}

/** A random opaque token, 256 bits, URL safe. @returns {string} */
export const randomToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

/** A text's SHA-256 as hex: what the database keeps of a token. @param {string} text @returns {Promise<string>} */
export async function sha256Hex(text) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** What the Worker keeps of a registering assistant (RFC 7591), or why it is refused. A public client only: no secret.
 * @param {unknown} body @returns {{ name: string, redirectUris: string[], problem?: undefined } | { problem: string }} */
export function clientFromRegistration(body) {
  const b = body && typeof body === 'object' ? /** @type {Record<string, any>} */ (body) : null;
  if (!b) return { problem: 'The registration is not an object.' };
  const uris = b.redirect_uris;
  if (!Array.isArray(uris) || uris.length < 1 || uris.length > 5) return { problem: 'Give one to five redirect addresses.' };
  for (const uri of uris) {
    const problem = redirectProblem(uri);
    if (problem) return { problem };
  }
  if (b.token_endpoint_auth_method !== undefined && b.token_endpoint_auth_method !== 'none')
    return { problem: 'Only clients without a secret (token_endpoint_auth_method none) are accepted.' };
  // A client may list more grants than this server offers (Claude lists jwt-bearer): the extra ones are ignored, authorization_code is needed.
  if (b.grant_types !== undefined && !(Array.isArray(b.grant_types) && b.grant_types.includes('authorization_code')))
    return { problem: 'The authorization code grant is required.' };
  const name = typeof b.client_name === 'string' && b.client_name.trim() ? b.client_name.trim().slice(0, 80) : 'Assistant';
  return { name, redirectUris: [...new Set(uris)] };
}

/** RFC 9728: what the MCP endpoint says about itself, so an assistant finds its authorization server. @param {string} origin */
export const protectedResourceMetadata = (origin) => ({
  resource: `${origin}/mcp`,
  authorization_servers: [origin],
  bearer_methods_supported: ['header'],
  scopes_supported: ['read'],
});

/** RFC 8414: the Worker as an authorization server. @param {string} origin */
export const authorizationServerMetadata = (origin) => ({
  issuer: origin,
  authorization_endpoint: `${origin}/oauth/mcp/authorize`,
  token_endpoint: `${origin}/oauth/mcp/token`,
  registration_endpoint: `${origin}/oauth/mcp/register`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  scopes_supported: ['read'],
  authorization_response_iss_parameter_supported: true,
  client_id_metadata_document_supported: true,
});

/** Whether a client_id is a Client ID Metadata Document address (https, with a path, no user info, fragment or dot segments). @param {unknown} id */
export function isMetadataClientId(id) {
  if (typeof id !== 'string' || id.length > MAX_URI) return false;
  let url;
  try {
    url = new URL(id);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.pathname.length > 1 &&
    !url.username &&
    !url.password &&
    !url.hash &&
    !/(^|\/)\.\.?(\/|$)/.test(url.pathname) &&
    url.href === id &&
    !LOOPBACK.has(url.hostname) &&
    !/^[\d.]+$/.test(url.hostname) &&
    !url.hostname.startsWith('[')
  );
}

/** What a fetched Client ID Metadata Document gives (draft-ietf-oauth-client-id-metadata-document), or why it is refused: its
 * client_id must be its own address, and it is a public client with redirect addresses like a registration's.
 * @param {string} id @param {unknown} doc @returns {{ name: string, redirectUris: string[], problem?: undefined } | { problem: string }} */
export function clientFromMetadataDocument(id, doc) {
  const d = doc && typeof doc === 'object' && !Array.isArray(doc) ? /** @type {Record<string, any>} */ (doc) : null;
  if (!d) return { problem: 'The client metadata document is not an object.' };
  if (d.client_id !== id) return { problem: 'The client_id in the client metadata document is not its address.' };
  if (d.token_endpoint_auth_method !== undefined && d.token_endpoint_auth_method !== 'none')
    return { problem: 'Only clients without a secret (token_endpoint_auth_method none) are accepted.' };
  const made = clientFromRegistration({ client_name: d.client_name, redirect_uris: d.redirect_uris, grant_types: d.grant_types });
  return made.problem ? { problem: made.problem } : made;
}
