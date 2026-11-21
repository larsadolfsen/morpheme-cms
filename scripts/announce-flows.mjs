// The main flows of the editor, walked with the recorder on (plan `docs/superpowers/plans/2026-11-21-0-19-4-screen-readers.md`, *The main flows*).
// A, B, C, F and I are the keyboard check's flows (scripts/keyboard-flows.mjs), reused as they are: every step they end on is a step here too. J, K and L
// are the ones only a screen reader user meets:
//   J Save and errors  change the text -> the save state is announced -> Save -> a field left wrong and Save: the problem is announced
//   K Messages         an action that shows a snackbar (Change type, a removed block): it is announced, once, by a region that was there before
//   L Open and close   a route change, a block selected, a dialog, a menu and a sheet opened and closed: what is said, and where focus is
// Each step the flows end on (`expectFocus` of keyboard-flows, or `step` here) closes a window of what the recorder saw (scripts/announce.mjs, RECORDER).
// A step fails when its window has no announcement where EXPECT says one is due (`no-announcement`; an announcement from a region that came into the page with
// its text does not count), the same text twice from two regions within 1 s (`double-announcement`), the wrong urgency (`wrong-urgency`), or focus on
// `body` (`flow-lost-focus`) or on a node with no name (`flow-focus-unnamed`). A finding's selector is the step's name, as in the keyboard flows.
// Every step also writes a line of what a reader would say to the speech log (`announce-log.txt`): for people, not compared.
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE, TEXT, Stop, expectFocus, isBody, open, press, reach, reachTool, runFlow, settle } from './keyboard-flows.mjs';
import { RECORDER, judgeWindow, speakFocus } from './announce.mjs';

/** The flows of the keyboard check that are reused (at 1280 px), and the ones that also run on a phone. */
export const REUSED = ['A', 'B', 'C', 'F', 'I'];
export const FLOWS = [...REUSED, 'J', 'K', 'L'];
export const PHONE_FLOWS = ['A', 'B', 'F', 'J'];

/** Which element announces each message (batch 4, plan *Live regions*): the editor's one announcer (`lib/announce.ts`, two regions made at start, used through
 * `announce()` or `useAnnounce`), never an element's own `role` as well.
 *   Autosave `Saving…`, `Saved`, `Not saved`   announcer, from `useAnnounce` in EntryForm (800 ms after the last change); all three polite (a failed autosave is not a failed Save)
 *   `Save changes` and every save or delete    announcer, through the snackbar (`snackbar()` in lib/snackbar.ts, which has no live role of its own)
 *   A failed save, any `error` snackbar        announcer, urgent (the snackbar's `error`)
 *   A form's problems and their count          announcer, urgent, through the snackbar (`3 problems. …`); focus goes to the first wrong field (fields.tsx)
 *   `Change type` with Undo                    announcer, through the snackbar (`undoSnackbar` in MarkdownEditor.tsx; the theme part's `role` is taken off the copy)
 *   The dashboard's moves, its loading line    announcer (DashboardEdit, DashboardGrid)
 *   No icons found (icon picker)               announcer, once, from `Announce` (IconPicker)
 *   Preview width                              announcer, only when the person picks a size (PreviewScreen); the width line itself is silent
 *   Selected rows (SelectionBar), updates notice, blocks selected in the text, position of a file, search result count, date picker headline, lightbox count
 *                                              their own persistent region (kept: the text changes in a region that was there before)
 *   A page-level `Notice` (Media, dashboard), a `ProblemNote alert`, a failed load   announcer, urgent, from `Announce` inside `Notice role="alert"` / `ProblemNote alert` (an alert that comes into the page with its text is often not read)
 *   A long load (`EmptyNote busy`, the dashboard)   announcer: the loading text once after 400 ms, `Loaded` when it ends (`useLoadAnnounce`); `aria-busy` is only a state
 *   A determinate progress                     announcer at every 25 % (`useProgressAnnounce`); the theme's progress indicator has `role=progressbar` and `aria-valuenow`
 */
/** The steps that must be announced, and how: `{ urgent }` (the plan's *Live regions*: saves, errors, snackbars and block moves are said). */
export const EXPECT = {
  'A: after Save': { urgent: false },
  'B: after inserting a block': { urgent: false },
  'B: after Move down': { urgent: false },
  'B: after Move up': { urgent: false },
  'B: after Remove': { urgent: false },
  'I: after Move down': { urgent: false },
  'J: after typing': { urgent: false },
  'J: after Save': { urgent: false },
  'J: after Save with a field left wrong': { urgent: true },
  'K: after Change type': { urgent: false },
  'K: after Remove': { urgent: false },
  'K: after a copied link': { urgent: false },
  'K: after a notice': { urgent: true },
  'K: after a failed load': { urgent: true },
  'L: after a block is selected': { urgent: false },
};

/** Where the speech log is written: `ANNOUNCE_LOG`, or `announce-log.txt` in the folder the check runs in. */
const logFile = () => process.env.ANNOUNCE_LOG || join(process.cwd(), 'announce-log.txt');

/** The hooks a flow runs with: the recorder in, and at each step the window judged and a line written. */
function hooks(flow, width, findings, lines) {
  let from = 0;
  const add = (problem, selector) => {
    if (!findings.some((f) => f.problem === problem && f.selector === selector)) findings.push({ problem, selector });
  };
  return {
    init: (page) => page.addInitScript(RECORDER),
    async afterStep(page, step, focusOk = true) {
      const events = await page.evaluate(() => window.__announced ?? []).catch(() => []);
      const inWindow = events.filter((e) => e.t >= from);
      from = events.length ? events[events.length - 1].t + 0.001 : from;
      for (const problem of judgeWindow(inWindow, { expect: EXPECT[step] })) add(problem, step);
      const focus = await speakFocus(page);
      if (!focusOk || (await isBody(page))) add('flow-lost-focus', step);
      else if (!focus.name) add('flow-focus-unnamed', step);
      const said = inWindow.filter((e) => e.kind === 'live' || e.kind === 'title');
      lines.push(
        `${step}`,
        ...said.map(
          (e) =>
            `   ${e.kind === 'title' ? 'Title' : e.urgency === 'urgent' ? 'Alert' : 'Status'}: ${e.text}${e.inserted ? ' (region inserted with its text)' : ''}`,
        ),
        `   Focus: ${focus.text}`,
      );
    },
  };
}

/** A step of J, K and L: what the flow did is over, so its window is judged. */
const step = (ctx, name) => ctx.afterStep(name, true);

const WAIT = 1100;

async function flowJ(ctx) {
  const { page } = ctx;
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  await reach(ctx, 'J: the text', TEXT);
  await page.keyboard.type(' announced');
  // The autosave waits a moment before it says what state it is in.
  await settle(page, WAIT + 600);
  await step(ctx, 'J: after typing');
  await reach(ctx, 'J: Save', { css: 'button', text: 'Save' }, { max: 120 });
  await press(ctx, 'Enter');
  await settle(page, 800);
  await step(ctx, 'J: after Save');
  // A field of the page settings left wrong: its fields emptied. When none of them is marked invalid by that, there is nothing to announce, and the step is
  // not made (the log says so); the plan's batch 4 adds the required fields and their error count.
  await page.locator('button.mo-editor-fold-toggle', { hasText: 'Page settings' }).click();
  await settle(page);
  const fields = page.locator('input.mo-text-field__input:visible');
  for (let i = 0; i < (await fields.count()); i++) await fields.nth(i).fill('');
  await settle(page);
  if (await page.locator('[aria-invalid="true"]').count()) {
    await reach(ctx, 'J: Save again', { css: 'button', text: 'Save' }, { max: 160 });
    await press(ctx, 'Enter');
    await settle(page, 800);
    await step(ctx, 'J: after Save with a field left wrong');
  } else ctx.note('no field is marked invalid when emptied');
}

async function flowK(ctx) {
  const { page } = ctx;
  // First, while nothing is written yet (no "Keep your changes?" on a route change).
  await flowKMessages(ctx);
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  await reach(ctx, 'K: the text', TEXT);
  await page.keyboard.press('Alt+F10');
  await settle(page);
  if (await page.evaluate(() => document.activeElement?.closest?.('[role=toolbar]'))) {
    await reach(
      ctx,
      'K: Text style',
      { css: 'button', inside: '[role=toolbar]', label: 'Text style: Heading' },
      { keys: ['ArrowRight'], max: 12, optional: true },
    );
    await press(ctx, 'Enter');
    await press(ctx, 'Enter');
    await settle(page, WAIT);
    await step(ctx, 'K: after Change type');
  }
  await reachTool(ctx, 'K: Insert block', { css: 'button', label: 'Insert block' });
  await press(ctx, 'Enter');
  await page.keyboard.type('notice');
  await settle(page);
  await reach(ctx, 'K: the Notice result', { css: 'button.mo-list__item-container', text: 'Notice' });
  await press(ctx, 'Enter');
  await settle(page);
  const card = { css: 'button.mo-site-block-card' };
  await reach(ctx, 'K: a block card', card, { max: 100 });
  await press(ctx, 'Enter');
  await press(ctx, 'Alt+F10');
  if (await page.evaluate(() => !!document.querySelector('[role=toolbar] button[aria-label="Remove"]')))
    await reach(ctx, 'K: Remove', { css: 'button', label: 'Remove' }, { keys: ['ArrowRight'], max: 30 });
  else {
    await reach(ctx, 'K: More', { css: 'button', label: 'More' }, { keys: ['ArrowRight'], max: 30 });
    await press(ctx, 'Enter');
    await reach(ctx, 'K: Remove in More', { css: 'button', text: 'Remove' }, { keys: ['ArrowDown'], max: 20 });
  }
  await press(ctx, 'Enter');
  await settle(page, WAIT);
  await step(ctx, 'K: after Remove');
}

// Flow K, second part: a copied link, a notice and a failed load. Each is walked on a screen of its own and must be said once.
async function flowKMessages(ctx) {
  const { page } = ctx;
  await page
    .context()
    .grantPermissions(['clipboard-read', 'clipboard-write'])
    .catch(() => {});
  // A copied link: Assistants, Copy URL.
  await open(ctx, 'assistants');
  await page.locator('button', { hasText: 'Copy URL' }).focus();
  if (await page.evaluate(() => document.activeElement?.textContent?.includes('Copy URL'))) {
    await press(ctx, 'Enter');
    await settle(page, WAIT);
    await step(ctx, 'K: after a copied link');
  } else ctx.note('Copy URL was not reached');
  // A notice: the start screen's widgets do not load (a page-level Notice with Try again).
  await page.route('**/api/dashboard', (r) => (r.request().method() === 'GET' ? r.fulfill({ status: 500, body: '' }) : r.fallback()));
  await open(ctx, '');
  await page
    .locator('button', { hasText: 'Try again' })
    .focus({ timeout: 5000 })
    .catch(() => ctx.note('no Try again'));
  await step(ctx, 'K: after a notice');
  // A failed load: Assistants cannot read its connections (a problem note).
  await page.route('**/api/mcp/connections**', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"no"}' }));
  await open(ctx, 'assistants');
  await settle(page, WAIT);
  await step(ctx, 'K: after a failed load');
}

async function flowL(ctx) {
  const { page } = ctx;
  // A route change: Pages. The title and the heading are what a reader is given.
  await open(ctx, 'list/pages');
  await settle(page, WAIT);
  await step(ctx, 'L: after a page of the editor opens');
  await open(ctx, PAGE, '[role=textbox][aria-label="Text"]');
  await step(ctx, 'L: after a page opens');
  // A block selected.
  const card = { css: 'button.mo-site-block-card' };
  await reach(ctx, 'L: a block card', card, { max: 100 });
  await press(ctx, 'Enter');
  await settle(page, WAIT);
  await step(ctx, 'L: after a block is selected');
  await press(ctx, 'Escape');
  await step(ctx, 'L: after the block settings close');
  // A dialog (Schedule), and a sheet (Insert block): opened and closed.
  await reach(ctx, 'L: Schedule', { css: 'button.mo-list__item-container', text: 'Schedule' }, { max: 160, optional: true });
  if (!(await isBody(page)) && (await page.evaluate(() => document.activeElement?.textContent?.includes('Schedule')))) {
    await press(ctx, 'Enter');
    await step(ctx, 'L: after the Schedule dialog opens');
    await press(ctx, 'Escape');
    await step(ctx, 'L: after the Schedule dialog closes');
  }
  await reachTool(ctx, 'L: Insert block', { css: 'button', label: 'Insert block' });
  await press(ctx, 'Enter');
  await step(ctx, 'L: after the insert sheet opens');
  await press(ctx, 'Escape');
  await step(ctx, 'L: after the insert sheet closes');
  // A menu: the page's More menu.
  await reachTool(ctx, 'L: More', { css: 'button', label: 'More' });
  await press(ctx, 'Enter');
  await step(ctx, 'L: after the More menu opens');
  await press(ctx, 'Escape');
  await step(ctx, 'L: after the More menu closes');
}

const OWN = { J: flowJ, K: flowK, L: flowL };

/**
 * Walks one flow with the recorder on: gives its findings `[{ problem, selector }]`, the errors, and the lines of the speech log.
 * @param {import('playwright').Browser} browser @param {string} site
 */
export async function runAnnounceFlow(browser, site, flow, width) {
  const findings = [];
  const lines = [`== Flow ${flow} at ${width} px`];
  const h = hooks(flow, width, findings, lines);
  let page;
  const { errors } = await runFlow(browser, site, flow, width, {
    init: async (p) => {
      page = p;
      await h.init(p);
    },
    afterStep: (step, ok) => h.afterStep(page, step, ok),
    run: OWN[flow],
  });
  return { findings, errors, lines };
}

/** Appends a flow's lines to the speech log. */
export const writeLog = (lines) => appendFileSync(logFile(), `${lines.join('\n')}\n\n`);

export { Stop };
