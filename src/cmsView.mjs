// Transforms CMS status into a view for the update page.
// Exposes cmsView and DONE_SHOWN.
// Depends on cms-version for version comparison.

import { compareVersions } from '../lib/cms-version.mjs';

export const DONE_SHOWN = 24 * 60 * 60 * 1000;

export function cmsView(status, now = Date.now()) {
  const running = status.running;
  const checkedAt = status.checked?.at ?? null;

  let latest = null;
  if (status.checked?.latest) {
    try {
      if (compareVersions(status.checked.latest, running) === 1) {
        latest = status.checked.latest;
      }
    } catch {
      // Pre-release or invalid version, ignore
    }
  }

  let notes = [];
  if (latest !== null && status.notes && status.notes.length > 0) {
    notes = [...status.notes];
    try {
      notes.sort((a, b) => compareVersions(b.version, a.version));
    } catch {
      // Keep original order if sorting fails
    }
  }

  const busy = status.update?.state === 'waiting' || status.update?.state === 'undoing';

  let action = null;
  if (latest !== null && !busy) {
    if (status.checked?.problem?.kind === 'major') {
      action = 'update';
    } else if (status.checked?.problem?.kind === 'skipped') {
      action = 'try-again';
    }
  }

  let npmCommand = null;
  if (latest !== null && status.checked?.problem?.kind === 'needs-npm') {
    npmCommand = `npm install @morphemecms/cms@${latest}`;
  }

  let update = null;
  if (status.update) {
    const state = status.update.state;
    if (state === 'waiting' || state === 'undoing' || state === 'undone' || state === 'stuck') {
      update = { state, to: status.update.to, at: status.update.at };
    } else if (state === 'done') {
      const at = Date.parse(status.update.at);
      if (now - at < DONE_SHOWN) {
        update = { state, to: status.update.to, at: status.update.at };
      }
    }
  }

  const problems = [];
  if (status.token === false) {
    problems.push('no-token');
  }
  if (status.checked?.problem) {
    const kind = status.checked.problem.kind;
    if (kind === 'unreachable' || kind === 'cannot-write' || kind === 'not-managed') {
      problems.push(kind);
    }
  }
  if (status.checked?.noChecks === true) {
    problems.push('slow-undo');
  }

  return { running, checkedAt, latest, notes, action, npmCommand, update, problems };
}
