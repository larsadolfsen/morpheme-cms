// Which store action runs, for the buttons that show it: `running` is { id, action, asking } or null; `asking` is true
// while a dialog waits for the user. Exposes busyFor. No dependencies, so node can import it.

/** Whether the button of `action` ("install", "update" or "uninstall") on `id` shows the loading indicator: only the
 * one pressed, and not while a dialog waits for the user. */
export function busyFor(running, id, action) {
  return !!running && !running.asking && running.id === id && running.action === action;
}
