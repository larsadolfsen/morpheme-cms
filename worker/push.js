// The editor's notifications on the phone or computer also when the editor is closed: Web Push from the Worker
// (packages/editor/src/notificationData.ts, packages/editor/pages/editor/sw.js). A device where "On the phone" is on under "Account" ›
// "Notifications" signs up here with the browser's push subscription, the types it has turned off and the editor's
// language; the Worker sends to the browser's push service (Google's, Mozilla's, Apple's), which wakes the editor's
// service worker, which shows it. Kept in Workers KV (the binding PUSH in wrangler.jsonc):
//   vapid          the Worker's own key pair for the push services (VAPID, RFC 8292), made the first time it is needed;
//                  a device signed up with another key signs up again when the editor opens
//   device:<id>    a device: its subscription, the types turned off and the language
//   wait:<id>      the device's last save, until the site is built with it: the commit and the two texts to send
//   waiting        until when there may be a wait (so the cron each minute asks KV once, and lists only then)
// What is sent:
// - "The website is updated with your changes" (type `site`) to the device that saved, when the site has been built
//   with the save (each minute, waitForBuilds: the cron in wrangler.jsonc), or that it was not, after ten minutes;
//   the texts are the editor's, in its language. An editor on screen says it itself and takes the wait back.
// - an app's notification from its part of the Worker (`notify` in the tools it is given, packages/editor/worker/index.js) to each
//   device with the type on, in the device's language (the app's texts.ts).
// The payload is encrypted for the device (RFC 8291, aes128gcm); a device the push service no longer knows is removed.
//   GET    /api/push        { key }: the Worker's public key, for the browser's subscription
//   PUT    /api/push        { subscription, off, locale }: signs a device up, or updates its choices
//   DELETE /api/push        { endpoint }: signs it off ("On the phone" off, "Log out")
//   PUT    /api/push/wait   { endpoint, commit, text, failText, to? }: sends `text` when the site is built with `commit`
//   DELETE /api/push/wait   { endpoint }: takes it back (the editor said it itself)
// Only someone who can save the site (write access to the repository on GitHub) can use them. Without the binding (a
// preview of a branch) nothing is kept or sent, and the editor's notifications come only while it is open.
import { config } from '@site/config';
import { contact } from '@site/worker';
import { json } from './not-found.js';
import { mayEdit } from './session.js';
import { giveUpAfter } from '../lib/build-settings.mjs';

const VAPID = 'vapid';
const DEVICE = 'device:';
const WAIT = 'wait:';
const WAITING = 'waiting';
// How long the editor waits for a save to be on the site (packages/editor/src/deploy.ts): giveUpAfter(paidBuilds), where
// paidBuilds is in /editor/version.json. Before a wait is checked that is not known: the longest limit is used.
const LONGEST = giveUpAfter(false);
// A device not seen (the editor not opened on it) for half a year drops out by itself.
const KEEP = 180 * 24 * 60 * 60;
// How long a push service keeps a notification for a device that is off.
const TTL = 24 * 60 * 60;

const encoder = new TextEncoder();

function b64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

const concat = (...parts) => {
  const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) all.set(p, (at += p.length) - p.length);
  return all;
};

/** A device's id: a hash of its endpoint, so the endpoint is not a key. */
async function idOf(endpoint) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(endpoint)));
  return b64url(hash.slice(0, 16));
}

/** The Worker's key pair as a JWK with the private part, made and kept the first time. */
async function vapidOf(kv) {
  const kept = await kv.get(VAPID, 'json');
  if (kept) return kept;
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  await kv.put(VAPID, JSON.stringify(jwk));
  return jwk;
}

/** The public key as the browser takes it (an uncompressed point, base64url). */
const publicKeyOf = (jwk) => b64url(concat(new Uint8Array([4]), fromB64url(jwk.x), fromB64url(jwk.y)));

/** The header that says the push comes from this site (VAPID, RFC 8292). */
async function vapidHeader(jwk, endpoint) {
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const part = (o) => b64url(encoder.encode(JSON.stringify(o)));
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: `https://${config.domain}` };
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part(claims)}`;
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(unsigned));
  return `vapid t=${unsigned}.${b64url(new Uint8Array(signature))}, k=${publicKeyOf(jwk)}`;
}

async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

/** The payload encrypted for the device (RFC 8291, the content coding aes128gcm of RFC 8188, one record).
 * `salt` and `pair` are for the tests only. */
export async function encrypt(payload, { p256dh, auth }, { salt = crypto.getRandomValues(new Uint8Array(16)), pair } = {}) {
  const device = fromB64url(p256dh);
  const own = pair ?? (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']));
  const ownPublic = new Uint8Array(await crypto.subtle.exportKey('raw', own.publicKey));
  const deviceKey = await crypto.subtle.importKey('raw', device, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: deviceKey }, own.privateKey, 256));
  const ikm = await hkdf(fromB64url(auth), shared, concat(encoder.encode('WebPush: info\0'), device, ownPublic), 32);
  const cek = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  // The last (and only) record ends with 2.
  const plain = concat(encoder.encode(payload), new Uint8Array([2]));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plain));
  const size = new Uint8Array(4);
  new DataView(size.buffer).setUint32(0, 4096);
  return concat(salt, size, new Uint8Array([ownPublic.length]), ownPublic, sealed);
}

/** Sends a notification ({ title, body, to, tag, error }) to a device; removes the device when its push service no
 * longer knows it. */
async function send(env, id, device, message) {
  const { endpoint, keys } = device.subscription;
  try {
    const jwk = await vapidOf(env.PUSH);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: await vapidHeader(jwk, endpoint),
        'content-encoding': 'aes128gcm',
        'content-type': 'application/octet-stream',
        ttl: String(TTL),
        urgency: 'normal',
      },
      body: await encrypt(JSON.stringify({ title: contact.name, ...message }), keys),
    });
    if (res.status === 404 || res.status === 410) await env.PUSH.delete(DEVICE + id);
    else if (!res.ok) console.error(`The notification could not be sent: ${res.status} ${(await res.text()).slice(0, 200)}`);
  } catch (e) {
    console.error(`The notification could not be sent: ${e?.message ?? e}`);
  }
}

/** The devices signed up, by their ids. */
async function devices(kv) {
  const all = [];
  let cursor;
  for (let i = 0; i < 5; i++) {
    const page = await kv.list({ prefix: DEVICE, cursor });
    all.push(...page.keys.map((k) => k.name.slice(DEVICE.length)));
    if (page.list_complete) break;
    cursor = page.cursor;
  }
  const kept = await Promise.all(all.map((id) => kv.get(DEVICE + id, 'json')));
  return all.map((id, i) => ({ id, device: kept[i] })).filter((d) => d.device?.subscription);
}

/** Sends an app's notification ({ type, id, text, error, to }, its type as `<app>/<type>`) to each device with the type
 * on, its text in the device's language (`texts`: the app's texts.ts). */
export async function notifyAll(env, { type, id, text, error, to }, texts = {}) {
  if (!env.PUSH) return;
  for (const { id: device, device: d } of await devices(env.PUSH)) {
    if (d.off?.includes(type)) continue;
    await send(env, device, d, { body: texts[d.locale]?.[text] ?? text, error: !!error, to, tag: `${type}:${id}` });
  }
}

/** What the site was last built from (/editor/version.json, packages/editor/pages/editor/version.json.js). */
async function builtOf(env) {
  try {
    const res = await env.ASSETS.fetch(new Request('https://assets.local/editor/version.json'));
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

/** Whether the build's commit has `commit` in it (it may be built from a later one): asked of GitHub with the Worker's
 * own token (GITHUB_PUBLISH_TOKEN); without it, only the commit itself counts. */
async function includes(env, build, commit) {
  if (build === commit) return true;
  if (!env.GITHUB_PUBLISH_TOKEN) return false;
  const { owner, name } = config.repo;
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/compare/${commit}...${build}`, {
    headers: { authorization: `Bearer ${env.GITHUB_PUBLISH_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': `${name}-worker` },
  });
  if (!res.ok) return false;
  const { status } = await res.json().catch(() => ({}));
  return status === 'ahead' || status === 'identical';
}

/** Each minute: tells each device waiting for its save whether the site has been built with it (see above). */
export async function waitForBuilds(env, now = Date.now()) {
  if (!env.PUSH) return;
  const until = Number(await env.PUSH.get(WAITING));
  if (!until || now > until) return;
  const { keys } = await env.PUSH.list({ prefix: WAIT });
  if (!keys.length) return;
  const built = await builtOf(env);
  const builtAt = Date.parse(built.builtAt ?? '');
  for (const { name, metadata: wait } of keys) {
    if (!wait) continue;
    const at = Date.parse(wait.at);
    // A build made before the save cannot have it.
    const online = !!built.commit && builtAt >= at && (await includes(env, built.commit, wait.commit).catch(() => false));
    const late = now - at > giveUpAfter(built.paidBuilds === true);
    if (!online && !late) continue;
    await env.PUSH.delete(name);
    const device = await env.PUSH.get(DEVICE + wait.device, 'json');
    // Without any version file (a build from before it existed) there is nothing to tell, as in the editor.
    if (!device?.subscription || device.off?.includes('site') || (!online && !built.commit)) continue;
    await send(env, wait.device, device, { body: online ? wait.text : wait.failText, error: !online, to: wait.to, tag: 'site' });
  }
}

const text = (value, max = 300) => (typeof value === 'string' ? value.slice(0, max) : '');
// A route of the editor: a slug may hold the Danish letters (a-e, o-slash and a-ring, and their capitals), written as escapes.
export const isRoute = (to) => typeof to === 'string' && /^[\w\-/\u00e6\u00f8\u00e5\u00c6\u00d8\u00c5]{1,200}$/.test(to);

// The browsers' push services (Chrome's, Firefox's, Safari's, Edge's): the Worker sends to no other address.
const PUSH_SERVICE =
  /^https:\/\/(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[\w-]+(\.[\w-]+)*\.push\.apple\.com|[\w-]+(\.[\w-]+)*\.notify\.windows\.com)\//;

function subscriptionOf(value) {
  const { endpoint, keys } = value ?? {};
  if (typeof endpoint !== 'string' || !PUSH_SERVICE.test(endpoint) || endpoint.length > 1000) return null;
  if (typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string') return null;
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

/** The addresses /api/push and /api/push/wait (see above). */
export async function handlePush(request, env) {
  if (!(await mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (!env.PUSH) return json({ error: 'unavailable' }, 503);
  const wait = new URL(request.url).pathname.replace(/\/$/, '') === '/api/push/wait';
  if (request.method === 'GET' && !wait) return json({ key: publicKeyOf(await vapidOf(env.PUSH)) });
  const body = await request.json().catch(() => ({}));
  const endpoint = body.endpoint ?? body.subscription?.endpoint;
  if (typeof endpoint !== 'string' || !endpoint) return json({ error: 'endpoint' }, 400);
  const id = await idOf(endpoint);

  if (wait && request.method === 'PUT') {
    if (typeof body.commit !== 'string' || !/^[0-9a-f]{40}$/.test(body.commit)) return json({ error: 'commit' }, 400);
    const at = new Date().toISOString();
    const metadata = { commit: body.commit, device: id, text: text(body.text), failText: text(body.failText), at };
    if (isRoute(body.to)) metadata.to = body.to;
    // The value is empty: all of it is in the metadata, which the list each minute gives with the key.
    await env.PUSH.put(WAIT + id, '', { metadata, expirationTtl: (2 * LONGEST) / 1000 });
    await env.PUSH.put(WAITING, String(Date.now() + LONGEST + 2 * 60_000));
    return json({ ok: true });
  }
  if (wait && request.method === 'DELETE') {
    await env.PUSH.delete(WAIT + id);
    return json({ ok: true });
  }
  if (wait) return json({ error: 'method' }, 405);

  if (request.method === 'PUT') {
    const subscription = subscriptionOf(body.subscription);
    if (!subscription) return json({ error: 'subscription' }, 400);
    const off = Array.isArray(body.off)
      ? body.off
          .filter((t) => typeof t === 'string')
          .slice(0, 100)
          .map((t) => text(t, 100))
      : [];
    const device = { subscription, off, locale: text(body.locale, 20), at: new Date().toISOString() };
    await env.PUSH.put(DEVICE + id, JSON.stringify(device), { expirationTtl: KEEP });
    return json({ ok: true });
  }
  if (request.method === 'DELETE') {
    await Promise.all([env.PUSH.delete(DEVICE + id), env.PUSH.delete(WAIT + id)]);
    return json({ ok: true });
  }
  return json({ error: 'method' }, 405);
}
