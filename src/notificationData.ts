// The notifications (the side sheet Notifications.tsx): what the editor and the apps have to say that is worth
// reading again, newest first, with when it came and the link it had. Each has a type: the editor's own (`site`: the
// site is updated or not, `saved`: something is saved, deleted, restored or installed, `failed`: it could not be,
// `updates`: an app from the store updated on its own, AppList.tsx autoUpdate), or
// an app's, which it declares (`notifications` in its index.ts, AppNotifications in apps.ts) as `<app>/<type>`. A
// message about something going on ("Gemmer…") or about a form that cannot be saved has no type and is only shown at
// the bottom.
// Each type can be turned off under "Konto" › "Notifikationer" (Library.tsx Account): then it is not kept here or sent
// to the phone (the editor's own are still shown at the bottom, as the answer to what was done; an app's not at all).
// There too "På telefonen": when it is on, a notification comes on the phone or computer as well while the editor is
// open but not on screen (another app or tab; notifyDevice), and, through the site's Worker (Web Push, packages/editor/worker/push.js),
// when it is closed: this browser is signed up there with the types turned off and the editor's language (signUp), and
// after a save the Worker tells it when the site has been built with it (waitOnServer); an app's part of the Worker
// tells it the app's notifications. The bell in the top bar (Screen.tsx NotificationsButton) has a dot while some are not
// seen; opening the notifications marks them seen. Kept in this browser: the last 50, the choices and the ids of the
// apps' notifications already told.
import { useSyncExternalStore } from 'react';
import { siteName } from '@site/editor';
import { locale } from './i18n';

export const EDITOR_TYPES = ['site', 'saved', 'failed', 'updates'] as const;
export type EditorType = (typeof EDITOR_TYPES)[number];

/** The type of an app's notification, as it is kept and turned off. */
export const appType = (app: string, type: string) => `${app}/${type}`;

export type Notification = {
  text: string;
  type: string;
  error?: boolean;
  at: number;
  link?: { text: string; href: string };
};
type Kept = { items: Notification[]; seen: number; told: string[] };
/** `off`: the types turned off; `device`: "På telefonen" (not chosen yet: on when the browser allows it). */
type Choices = { off: string[]; device?: boolean };

const KEY = 'editor-notifications';
const CHOICES = 'editor-notification-settings';
const MAX = 50;
const MAX_TOLD = 200;

function read<T>(key: string, fallback: T, ok: (value: T) => boolean): T {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
    if (saved && ok(saved)) return { ...fallback, ...saved };
  } catch {}
  return fallback;
}

let kept = read<Kept>(KEY, { items: [], seen: 0, told: [] }, (k) => Array.isArray(k.items));
let choices = read<Choices>(CHOICES, { off: [] }, (c) => Array.isArray(c.off));
const listeners = new Set<() => void>();

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.forEach((l) => l());
}
const set = (next: Kept) => store(KEY, (kept = next));
const choose = (next: Choices) => store(CHOICES, (choices = next));

const subscribe = (changed: () => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};

/** Whether notifications of the type are on. */
export const isOn = (type: string) => !choices.off.includes(type);

/** Keeps a notification and sends it to the phone, when its type is on (not `device` when the Worker sends it). */
export function remember(item: Omit<Notification, 'at'>, device = true) {
  if (!isOn(item.type)) return;
  set({ ...kept, items: [{ ...item, at: Date.now() }, ...kept.items].slice(0, MAX) });
  if (device) notifyDevice(item.text);
}

/** Whether an app's notification (by its own id) has been told before; marks it told. */
export function told(type: string, id: string) {
  const key = `${type}:${id}`;
  if (kept.told.includes(key)) return true;
  set({ ...kept, told: [key, ...kept.told].slice(0, MAX_TOLD) });
  return false;
}

/** Marks them all seen (the notifications are open). */
export function markSeen() {
  if (kept.items.some((n) => n.at > kept.seen)) set({ ...kept, seen: Date.now() });
}

export function clearNotifications() {
  set({ ...kept, items: [], seen: Date.now() });
}

/** Turns a type on or off. */
export function setOn(type: string, on: boolean) {
  choose({ ...choices, off: on ? choices.off.filter((t) => t !== type) : [...choices.off, type] });
  if (signedUp) signUp().catch(() => {});
}

const allowed = () => typeof Notification !== 'undefined' && Notification.permission === 'granted';
const deviceOn = () => choices.device ?? allowed();

/** Turns "På telefonen" on or off; on asks the browser first. False when the browser does not allow it. */
export async function setDevice(on: boolean): Promise<boolean> {
  if (on && typeof Notification === 'undefined') return false;
  if (on && Notification.permission === 'default') await Notification.requestPermission().catch(() => {});
  if (on && !allowed()) return false;
  choose({ ...choices, device: on });
  await (on ? signUp() : signOff()).catch(() => {});
  return true;
}

// The Worker's notifications (packages/editor/worker/push.js), with the GitHub sign-in (the Worker's cookie, sent with the request): only
// someone who can save the site may.
const PUSH = '/api/push';
// The endpoint this browser is signed up with at the Worker, while it is.
let signedUp: string | null = null;

function api(path: string, method: string, body?: unknown) {
  return fetch(path, {
    method,
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// The service worker (registered when the editor opens, deploy.ts registerWorker), once it is running; none when the
// browser has no push (an iPhone outside the home screen).
const pushWorker = async (ready = true) =>
  typeof PushManager === 'undefined' || !navigator.serviceWorker
    ? undefined
    : ready
      ? await navigator.serviceWorker.ready
      : await navigator.serviceWorker.getRegistration('/editor/');

const b64url = (key: ArrayBuffer | null | undefined) =>
  key
    ? btoa(String.fromCharCode(...new Uint8Array(key)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    : '';

/** Signs this browser up at the Worker, or tells it the choices again: with the browser's push subscription to the
 * Worker's key (a new one when the key is another), the types turned off and the editor's language. Nothing when the
 * browser cannot (an iPhone outside the home screen) or the site keeps none (a preview of a branch). */
async function signUp() {
  const worker = await pushWorker();
  if (!worker) return;
  const res = await api(PUSH, 'GET');
  if (!res.ok) return;
  const { key } = (await res.json()) as { key: string };
  let subscription = await worker.pushManager.getSubscription();
  if (subscription && b64url(subscription.options.applicationServerKey) !== key) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const signed = await api(PUSH, 'PUT', { subscription: subscription.toJSON(), off: choices.off, locale });
  signedUp = signed.ok ? subscription.endpoint : null;
}

/** Signs this browser off at the Worker ("På telefonen" off, "Log ud": before the sign-in goes), and from the push
 * service. */
export async function signOff() {
  signedUp = null;
  const subscription = await (await pushWorker(false))?.pushManager.getSubscription();
  if (!subscription) return;
  await api(PUSH, 'DELETE', { endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe().catch(() => {});
}

/** When the editor opens: signs up again while "På telefonen" is on (the Worker may have a new key, or have forgotten
 * a browser not seen for half a year), else signs off. */
export function syncDevice() {
  (deviceOn() && allowed() ? signUp() : signOff()).catch(() => {});
}

/** After a save: asks the Worker to say on the phone when the site has been built with `commit` (`text`), or that it
 * was not after ten minutes (`failText`). True when it will (this browser is signed up, with the type on). */
export async function waitOnServer(commit: string, text: string, failText: string): Promise<boolean> {
  if (!signedUp || !isOn('site')) return false;
  const res = await api(`${PUSH}/wait`, 'PUT', { endpoint: signedUp, commit, text, failText }).catch(() => null);
  return !!res?.ok;
}

/** Takes the wait back: the editor said it itself. */
export function stopServerWait() {
  if (signedUp) api(`${PUSH}/wait`, 'DELETE', { endpoint: signedUp }).catch(() => {});
}

// Asks whether the editor may show notifications on the phone, once, while "På telefonen" is not chosen yet.
// Browsers only ask after a tap, so this is called from "Gem".
export function askToNotify() {
  if (choices.device === undefined && typeof Notification !== 'undefined' && Notification.permission === 'default')
    setDevice(true).catch(() => {});
}

// The message as a notification on the phone or computer (through the service worker, packages/editor/pages/editor/sw.js), when
// "På telefonen" is on and the editor is not on screen.
async function notifyDevice(text: string) {
  if (document.visibilityState === 'visible' || !deviceOn() || !allowed()) return;
  const options = { body: text, icon: '/editor/icon-192.png', tag: 'site' };
  try {
    const worker = await navigator.serviceWorker?.getRegistration('/editor/');
    if (worker) await worker.showNotification(siteName, options);
    else new Notification(siteName, options);
  } catch {}
}

export const useNotifications = () => useSyncExternalStore(subscribe, () => kept);

/** The choices: the types turned off and whether "På telefonen" is on. */
export const useNotificationChoices = () => {
  const now = useSyncExternalStore(subscribe, () => choices);
  return { off: now.off, device: now.device ?? allowed() };
};

/** How many are not seen yet. */
export const unseen = ({ items, seen }: Kept) => items.filter((n) => n.at > seen).length;
