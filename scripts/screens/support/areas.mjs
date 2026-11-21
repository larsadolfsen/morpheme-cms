// Which screens areas a change touches, and the core set that always runs (plan docs/superpowers/plans/2026-11-18-build-and-check-speed.md,
// pull request A3; skill checks, "What CI runs"). Kept next to the areas (scripts/screens/<area>.mjs), read by
//   - scripts/ci-changes.mjs   (the job `changes` prints `areas=` for a pull request),
//   - scripts/editor-screens.mjs (--areas a,b runs the core units and the units of those areas),
//   - scripts/screens-areas.test.mjs (every tracked path has an explicit rule; every area and core unit exists).
// The engine is lib/affected.mjs, so site build lanes (track B) can read their own rules with it.
//
// HOW TO READ THE RULES. The first rule that matches a path decides. `[...]` names the areas that draw or measure what the path
// changes; 'none' means no screens unit reads the path (the reason is in the comment above the rule); 'all' means a change may show
// anywhere. A path no rule matches is `all` too (when in doubt, run everything), and the test fails until it has a rule. A rule that
// names an area is a promise that the area, with the core set, covers what the path can break: name the neighbours, not only the
// owner. A new unit goes in its area's file, never in this list (the list is of areas, not units).
import { select } from '../../../lib/affected.mjs';

/** The area files in scripts/screens/ (support/ is a folder, not an area). The test keeps this list and the folder equal. */
export const AREAS = [
  'block-bar',
  'cards',
  'choice-groups',
  'demo-names',
  'density',
  'files',
  'forms',
  'inline-blocks',
  'lists',
  'page-rows',
  'search-and-palette',
  'sections',
  'sheets',
  'site-checks',
  'start-screens',
  'tables',
  'text-bar',
  'type',
];

/**
 * The core set: units that run on every pull request that is not docs-only, whatever it touched. By name, as registered
 * (the test checks that each one exists):
 *  - `screens 390`, `screens 1280`, `key states`: every screen of the editor opens without errors on a phone and a computer, and
 *    the icons exist (start-screens.mjs);
 *  - `checkSaveKeyNoAutosave`: a page is edited and Save commits it (text-bar.mjs);
 *  - `checkSpacingGrid 375`, `checkSpacingGrid 1280`: the built site's Blocks page draws on the 4 dp grid, so the theme builds and
 *    the site is drawn (site-checks.mjs).
 */
export const CORE_UNITS = [
  'screens 390',
  'screens 1280',
  'key states',
  'checkSaveKeyNoAutosave',
  'checkSpacingGrid 375',
  'checkSpacingGrid 1280',
];

/** What draws or measures a block: the areas a change to a block's look must reach. */
const BLOCKS = ['inline-blocks', 'lists', 'cards', 'tables', 'sections', 'block-bar', 'page-rows', 'site-checks'];

const s = (names) => new RegExp(`^src/(?:${names})\\.(?:tsx?|mjs|css)$`);

/** @type {Array<[RegExp, string[] | 'all' | 'none']>} */
export const RULES = [
  // The workflow and what decides the checks: a mistake in them must not hide itself.
  [/^\.github\/(workflows\/check\.yml|actions\/.+)$/, 'all'],
  [/^scripts\/ci-changes(\.test)?\.mjs$/, 'all'],
  [/^scripts\/(editor-screens|built-site|core-blocks-page|spacing-grid\.allow)\.mjs$/, 'all'],
  [/^scripts\/screens\/(support\/|order\.txt$)/, 'all'],
  [/^lib\/affected(\.test)?\.mjs$/, 'all'],
  [/^scripts\/screens-areas\.test\.mjs$/, 'all'],
  // An area's own file: that area.
  ...AREAS.map((a) => [new RegExp(`^scripts/screens/${a}\\.mjs$`), [a]]),
  // The measured times and the script that refreshes them only decide which shard runs a unit, never which units run.
  [/^scripts\/(screens\/unit-times\.json|refresh-unit-times\.mjs)$/, 'none'],
  [/^scripts\/screens\//, 'all'], // a file there that is no area yet
  // Tests run in `static` (npm test), never in a screens unit.
  [/\.test\.(mjs|js|ts|tsx)$/, 'none'],
  // Fixtures only tests read.
  [/^(lib\/fixtures|lib\/sandbox\/fixtures|worker\/fixtures|scripts\/fixtures)\//, 'none'],
  // Docs, agent files, changesets, the other workflows and the notes at the root: nothing in a screens unit reads them.
  [/^(docs|\.claude|\.agents|\.changeset)\//, 'none'],
  [/^\.github\/workflows\/(publish|cache-fill|daily-full)\.yml$/, 'none'],
  [/^(README|CLAUDE|AGENTS|SECURITY)\.md$|^LICENSE$|^\.(prettierrc\.json|prettierignore|gitignore|gitattributes)$/, 'none'],
  // The site's Worker: the screens answer the editor's requests themselves (scripts/built-site.mjs workerAnswer), they never import it.
  // `static` runs its test; the demo and starter jobs run it on a site.
  [/^worker\//, 'none'],
  // The static-only check scripts and allowlists: `npm run check` runs them, no screens unit imports them.
  [
    /^scripts\/(check-language|check-phosphor|check-web|check-editor-colors|check-colors|check-colors\.allow|check-css-values|check-css-values\.allow|check-density|check-color-roles|color-roles\.allow)\.mjs$/,
    'none',
  ],
  [/^scripts\/(phosphor|web)-allowlist\.json$/, 'none'],
  // The accessibility scan: the editor's part runs in the units `screens 390` and `screens 1280` (start-screens.mjs), which read the shared
  // module and the list; the site's part (check-a11y.mjs) is its own command, in the job `demo`.
  [/^scripts\/(a11y\.mjs|a11y-allowlist\.json)$/, ['start-screens']],
  [/^scripts\/check-a11y\.mjs$/, 'none'],
  // The keyboard check (plan 2026-11-20-0-19-3-keyboard): the walk and the flows run in start-screens.mjs (the units `screens 390`, `screens 1280` and
  // `checkKeyboardFlows`), which read the shared modules and the list; its own command (check-keyboard.mjs) is not read by a unit.
  [/^scripts\/(keyboard\.mjs|keyboard-flows\.mjs|keyboard-allowlist\.json)$/, ['start-screens']],
  [/^scripts\/check-keyboard\.mjs$/, 'none'],
  // The screen reader check (plan 2026-11-21-0-19-4-screen-readers): the name walk and the flows run in start-screens.mjs (the units `screens 390`, `screens 1280`
  // and `checkAnnounceFlows`), which read the shared modules and the list; its own command (check-announce.mjs) is not read by a unit.
  [/^scripts\/(allowlist\.mjs|announce\.mjs|announce-flows\.mjs|announce-allowlist\.json)$/, ['start-screens']],
  [/^scripts\/check-announce\.mjs$/, 'none'],
  // The version rule (job `static`) and the release version step: read changesets, package.json and CHANGELOG.md only.
  [/^scripts\/(version-rule\.mjs|release-version\.mjs)$/, 'none'],
  // The token checks of `npm run check` and their lists (only check-css-tokens.mjs and check-token-names.mjs read them), and the checks
  // that `check:screens:extra` runs over the whole site: none is imported by a unit of scripts/screens/. The light levels skip
  // screens-extra; the full level runs it and every unit.
  [/^scripts\/(css-tokens-allowlist|renamed-tokens)\.json$/, 'none'],
  [/^scripts\/(check-css-tokens|check-token-names|check-token-registry|check-release-notes|gen-token-registry)\.mjs$/, 'none'],
  [/^scripts\/check-(save-twice|unlisted|imagegrid|popup-focus|test-page|text-measure|preview)\.mjs$/, 'none'],
  // The notes and the changelog are bundled into the editor (src/bundledNotes.ts) and show on the start screen's updates card.
  [/^(release-notes\/|CHANGELOG\.md$)/, ['start-screens']],

  // The editor, by what a file draws. Shared parts (ui.tsx, editor.css, store.ts, fields.tsx, i18n, icons, density …) are 'all' by the
  // catch-all at the end of this group.
  [/^src\/Inline(Table)\.tsx$/, ['tables', 'inline-blocks']],
  [/^src\/Inline(Cards|ImageGrid|PriceCards|Testimonials|Posts)\.tsx$/, ['cards', 'inline-blocks', 'lists']],
  [/^src\/Inline(List|Expand|LiveList|Steps|Buttons|Notice|Video|Single)\.tsx$/, ['inline-blocks', 'lists']],
  [/^src\/(Inline\w*|inline\w*)\.(tsx?|mjs)$/, BLOCKS],
  [
    s(
      'Dashboard\\w*|AddWidget|WidgetSettings|Start\\w*|Updates\\w*|ReleaseNote\\w*|CmsVersion|cms\\w*|dashboard\\w*|start\\w*|widget\\w*|widgets/\\w+',
    ),
    ['start-screens'],
  ],
  [s('Library|Media\\w*|File\\w*|Redirects|Deleted|file\\w*|tagUses|mediaDelete|redirectData|bulkDelete'), ['files', 'sheets']],
  [s('CommandPalette|ShortcutsSheet|palette\\w*|shortcuts\\w*'), ['search-and-palette']],
  [s('textBar|textActions|styleMenu|styleKind|ToolSelect|TextSizeIcons'), ['text-bar']],
  [
    s(
      'blockBar|blockActions\\w*|blockDrag|blockRow|blockSelection\\w*|SelectionBar|SelectionParts|useSelection|selectionRules|MoveButtons|moveItem',
    ),
    ['block-bar', 'page-rows'],
  ],
  [s('Section\\w*|section\\w*'), ['sections', 'page-rows']],
  [
    s('Sheet|CropView|LinkSheet|OwnListSheet|BlockSettings|liveSheet|sheetPlacement|sheetCopy|useSheetBack'),
    ['sheets', 'forms', 'block-bar', 'page-rows'],
  ],
  [s('EntryForm|FormFrame|DataForm|formSection\\w*'), ['forms', 'sheets']],
  [s('choiceSamples'), ['choice-groups']],
  [/^src\//, 'all'],

  // The default theme: a block's own folder reaches the areas that draw blocks; everything shared (styles, tokens, ui, layouts,
  // templates, components, scripts, theme.json) can show anywhere.
  [/^theme\/blocks\//, BLOCKS],
  [/^theme\/(screenshots\/|LICENSE$)/, 'none'],
  [/^theme\//, 'all'],

  // The demo is the site the screens run on: its Blocks pages reach the block areas, its type and names pages their own checks.
  [/^demo\/src\/content\/pages\/blocks-[\w-]+\.md$/, BLOCKS],
  [/^demo\/(src\/content\/pages\/typography\.md|public\/demo-type\.js)$/, ['type']],
  [/^demo\/public\/demo-names\.js$/, ['demo-names']],
  [/^demo\//, 'all'],

  // The app sandbox: an app's blocks are drawn on its test page (page-rows' checkAppTestPages). The rest of lib/ is shared with the site.
  [/^lib\/sandbox\//, ['page-rows']],
  [/^lib\//, 'all'],

  // Everything the build, the package and the site are made of.
  [/^(pages|site|defaults|icons|starter|bin|scripts)\//, 'all'],
  [/^(astro\.mjs|client\.d\.ts|package\.json|package-lock\.json|\.npmrc|wrangler\.jsonc|tsconfig\.types\.json)$/, 'all'],
];

/**
 * What a pull request's changed paths ask of the screens check: `all`, or the areas to run besides the core set.
 * @param {string[]} paths
 */
export function screensSelection(paths) {
  return select(paths, RULES);
}

/**
 * `areas=` for CI and `--areas`: `all`, or the comma list of areas (empty when only the core set must run: `none`).
 * @param {string[]} paths
 */
export function areasArg(paths) {
  const r = screensSelection(paths);
  if (r.all) return 'all';
  return r.areas.length ? r.areas.join(',') : 'none';
}
