// The notice for the CMS's newest update from npm: maps the state to a key and version for the notifications list.
// Exports cmsNotice; no dependencies.
/** @returns {{ id: string, key: 'notifyDone' | 'notifyUndone' | 'notifyStuck', version: string, error: boolean } | null} */
export function cmsNotice(update) {
  if (!update || !update.commit || !update.to) return null;
  if (update.state === 'waiting' || update.state === 'undoing') return null;
  if (update.state === 'done') return { id: `${update.commit}:done`, key: 'notifyDone', version: update.to, error: false };
  if (update.state === 'undone') return { id: `${update.commit}:undone`, key: 'notifyUndone', version: update.to, error: true };
  if (update.state === 'stuck') return { id: `${update.commit}:stuck`, key: 'notifyStuck', version: update.to, error: true };
  return null;
}
