// A secret text (the GitHub token an assistant's connection reads the site with) sealed with a Worker secret (AES-GCM), so
// what the database holds is no use without it. Exposes seal and open. No dependencies (Web Crypto), so the Worker can use it.

const encoder = new TextEncoder();
const b64 = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
const unb64 = (text) => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));

// The key is the secret's SHA-256, so any secret text gives a 256-bit key.
const keyOf = async (secret) =>
  crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', encoder.encode(secret)), 'AES-GCM', false, ['encrypt', 'decrypt']);

/** The text sealed with the secret: `<iv>.<sealed>`, URL-safe base64. Throws without a secret.
 * @param {string | undefined} secret @param {string} text @returns {Promise<string>} */
export async function seal(secret, text) {
  if (!secret) throw new Error('No secret to seal with.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyOf(secret), encoder.encode(text));
  return `${b64(iv)}.${b64(new Uint8Array(sealed))}`;
}

/** The text a `seal` holds, or null for another secret, a changed text or anything that is not a seal.
 * @param {string | undefined} secret @param {string} sealed @returns {Promise<string | null>} */
export async function open(secret, sealed) {
  if (!secret || typeof sealed !== 'string') return null;
  const [iv, body, ...rest] = sealed.split('.');
  if (!iv || !body || rest.length) return null;
  try {
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await keyOf(secret), unb64(body));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
