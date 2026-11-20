// "Notice", a notice in the text (the standard block in standard/notice/), can be shown until a date and time,
// written in Danish time ("2026-03-01T12:00"). The site leaves it out when it is built after that time,
// and a visitor's browser removes it once the time has come between two builds (its load.ts), so it
// goes at the time without the site being built again.
const ZONE = 'Europe/Copenhagen';
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

// How far Danish time is ahead of UTC at a moment (one or two hours), in milliseconds.
function offset(at) {
  const p = Object.fromEntries(parts.formatToParts(at).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - at;
}

/** A Danish date and time ("2026-03-01T12:00") as milliseconds since 1970, or null. */
export function untilTime(local) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local ?? '');
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return wall - offset(wall - offset(wall));
}

/** Whether a notice shown until `local` is over. */
export const isOver = (local, now = Date.now()) => {
  const at = untilTime(local);
  return at !== null && now >= at;
};
