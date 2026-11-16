// Notifications on the phone moved with the editor from /editor/ to /edit/ (its service worker has its own push subscription). Notification
// permission belongs to the origin, so it is kept: the editor signs up again by itself, without asking, and drops the old subscription.
// Plain functions, so they are tested (pushMigration.test.mjs); notificationData.ts uses them.

/** What the editor does when it opens: sign up (a new subscription at /edit/ and at the Worker, silently, since the permission is granted) while
 * "On the phone" is on, else sign off. `device`: the person's choice, or undefined when never chosen (then the permission says). */
export function syncAction({ permission, device }) {
  const allowed = permission === 'granted';
  return (device ?? allowed) && allowed ? 'sign-up' : 'sign-off';
}

/** The old subscription (from the service worker at /editor/) to remove at the Worker and the push service after the new one is saved:
 * its endpoint, or null when there is none or it is the same one. */
export function oldEndpointToDrop(oldEndpoint, newEndpoint) {
  return oldEndpoint && oldEndpoint !== newEndpoint ? oldEndpoint : null;
}
