// Transforms CMS status into a view for the update page.
// Exposes cmsView and DONE_SHOWN.
// Depends on cms-version for version comparison.

import { compareVersions } from '../lib/cms-version.mjs';
import { blockedUpdate } from './cmsBlocked.mjs';

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

  const state = status.update?.state;
  const busy = state === 'trying' || state === 'waiting' || state === 'undoing';

  // The newer version failed on its trial branch or in its build: why, the build's link and when it is tried again (24 hours after the try).
  // The Try again button tries it at once.
  let failed = null;
  if (latest !== null) {
    const record = (status.failed ?? []).find((f) => f.version === latest);
    if (record) {
      failed = {
        version: record.version,
        reason: record.reason ?? 'build-failed',
        buildUrl: record.buildUrl ?? null,
        retryAt: typeof record.retryAt === 'number' ? record.retryAt : null,
      };
    }
  }

  const action = latest !== null && !busy && failed ? 'try-again' : null;

  let npmCommand = null;
  if (latest !== null && status.checked?.problem?.kind === 'needs-npm') {
    npmCommand = `npm install @morphemecms/cms@${latest}`;
  }

  let update = null;
  if (status.update) {
    const shown = { state, to: status.update.to, at: status.update.at, buildUrl: status.update.buildUrl ?? null };
    if (state === 'trying' || state === 'waiting' || state === 'undoing' || state === 'undone' || state === 'stuck') {
      update = shown;
    } else if (state === 'done') {
      const at = Date.parse(status.update.at);
      if (now - at < DONE_SHOWN) {
        update = shown;
      }
    }
  }

  const problems = [];
  if (status.token === false) {
    problems.push('no-token');
  }
  if (status.kv === false) {
    problems.push('no-kv');
  }
  if (status.checked?.problem) {
    const kind = status.checked.problem.kind;
    if (kind === 'unreachable' || kind === 'cannot-write' || kind === 'not-managed' || kind === 'no-preview') {
      problems.push(kind);
    }
  }
  if (status.checked?.noChecks === true) {
    problems.push('slow-undo');
  }

  return { running, checkedAt, latest, notes, action, npmCommand, update, failed, problems, blocked: blockedUpdate(status) };
}
