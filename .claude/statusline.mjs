#!/usr/bin/env node
// Claude Code status line: model | context bar + cache countdown | plan usage + reset | project | worktree | scratchpad
// Reads the session JSON on stdin and prints one line. Needs only Node 18+.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---- input -----------------------------------------------------------------
let d = {};
try {
  d = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  /* blank line on bad input */
}
const now = Math.floor(Date.now() / 1000);

// ---- helpers ---------------------------------------------------------------
const c = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const GREEN = '38;5;77',
  YELLOW = '38;5;214',
  RED = '38;5;203',
  DIM = '2';
const level = (pct) => (pct < 50 ? GREEN : pct < 80 ? YELLOW : RED);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const links = process.env.STATUSLINE_LINKS !== '0';
const link = (url, text) => (links ? `\x1b]8;;${url}\x07${text}\x1b]8;;\x07` : text);
const sepr = c(DIM, ' │ ');

// ---- model -----------------------------------------------------------------
const parts = [];
parts.push(d.model?.display_name ?? 'Claude');

// ---- context window + prompt cache -----------------------------------------
const ctxPct = num(d.context_window?.used_percentage);
let ctx = '';
if (ctxPct !== null) {
  const cells = 10;
  const filled = Math.min(cells, Math.round((ctxPct / 100) * cells));
  ctx = c(level(ctxPct), '█'.repeat(filled)) + c(DIM, '░'.repeat(cells - filled)) + ` ${Math.round(ctxPct)}%`;
}
// Cache: only worth showing when a cold cache would cost real tokens (20k+).
const pc = d.prompt_cache;
const coldCost = num(pc?.recache_tokens_if_cold) ?? 0;
if (pc && pc.caching_observed !== false && coldCost >= 20000) {
  const left = num(pc.expires_at) !== null ? pc.expires_at - now : null;
  if (left !== null && left > 0) {
    const mins = Math.ceil(left / 60);
    ctx += ' ' + c(left < 120 ? RED : YELLOW, `⧗ ${mins} min`);
  } else if (left !== null) {
    ctx += ' ' + c(RED, '⧗ cold');
  }
}
if (ctx) parts.push(ctx);

// ---- plan usage: the window closest to its limit ---------------------------
const WINDOWS = [
  ['five_hour', 5 * 3600],
  ['seven_day', 7 * 86400],
];
let best = null;
for (const [key, len] of WINDOWS) {
  const w = d.rate_limits?.[key];
  const used = num(w?.used_percentage);
  if (used !== null && (!best || used > best.used)) best = { used, resets: num(w.resets_at), len };
}
if (best) {
  let txt = `${Math.round(best.used)}%`;
  if (best.resets !== null) {
    const left = Math.max(0, best.resets - now);
    const elapsedPct = ((best.len - left) / best.len) * 100;
    if (best.used > elapsedPct + 5) txt += '↑'; // usage is ahead of the clock
    const h = Math.floor(left / 3600),
      m = Math.floor((left % 3600) / 60);
    const reset = left >= 86400 ? `${Math.floor(left / 86400)}d ${h % 24}h` : `${h}:${String(m).padStart(2, '0')}`;
    parts.push(c(level(best.used), txt) + ' ' + reset);
  } else {
    parts.push(c(level(best.used), txt));
  }
}

// ---- project (clickable) ---------------------------------------------------
const dir = d.workspace?.project_dir ?? d.workspace?.current_dir ?? d.cwd;
if (dir) {
  const segs = dir.split(/[\\/]/).filter(Boolean);
  const short = segs.slice(-2).join('/');
  parts.push(link(pathToFileURL(dir).href, short));
}

// ---- git worktree (hidden unless in one) -----------------------------------
const wt = d.worktree?.name ?? (d.workspace?.git_worktree ? basename(d.workspace.git_worktree) : null);
if (wt) parts.push(c(GREEN, '🌿') + ' ' + wt);

// ---- scratchpad (hidden when empty) ----------------------------------------
// Best effort: <tmp>/claude-*/<project>/<session_id>/scratchpad. Not a documented location.
function findScratchpad() {
  const id = d.session_id;
  if (!id) return null;
  try {
    for (const top of readdirSync(tmpdir())) {
      if (!top.startsWith('claude-')) continue;
      const base = join(tmpdir(), top);
      for (const proj of readdirSync(base)) {
        const p = join(base, proj, id, 'scratchpad');
        if (existsSync(p) && readdirSync(p).length > 0) return p;
      }
    }
  } catch {
    /* none found */
  }
  return null;
}
const pad = findScratchpad();
if (pad) parts.push(c(YELLOW, '📁') + ' ' + link(pathToFileURL(pad).href, 'scratch'));

process.stdout.write(parts.join(sepr) + '\n');
