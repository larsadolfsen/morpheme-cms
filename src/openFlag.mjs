// A true/false value that listeners follow (for useSyncExternalStore): createFlag(initial) gives { get, set, subscribe }.
// `set` tells the listeners only when the value changes. No dependencies, so node can import it; used by notificationsOpen.ts.

export function createFlag(initial = false) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    set(next) {
      if (value === next) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(changed) {
      listeners.add(changed);
      return () => listeners.delete(changed);
    },
  };
}
