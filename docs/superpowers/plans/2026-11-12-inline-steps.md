# Plan: Steps typed in place

Part of `docs/superpowers/plans/2026-11-12-inline-block-editing.md` (design: `docs/superpowers/specs/2026-11-12-inline-block-editing-design.md`).
One pull request into `main`, after the shared parts of #413. For the PM to hand to a new session. All decisions below are the owner's.

## User story

As a site owner I add Steps and type each step where it stands, so I never open a sheet.

1. Inserting Steps goes straight into the text: one faded, empty step numbered 1; typing in it makes the first step.
2. The steps are drawn as the site draws them (numbers, line). Each step's heading and text are typed in place.
3. Enter in the heading goes to the text. Enter in the text adds a step below. Backspace in an empty heading removes the step.
4. While the block is active, the text button `Add step` is under the last step; it is gone when I leave.
5. The active step has the dotted outline and no background color; the others show their live look.
6. The floating toolbar has Add above, Add below, Move up, Move down and the block's menu. No Link and no Edit: a step has nothing to set.
7. Moving a step renumbers all steps.
8. The block has no heading, label or intro field in place. Old Steps with `heading` or `intro` keep showing them on the site and keep them
   editable in the block's sheet while they are filled.
9. Saved Steps open unchanged and are saved back in the same form (`items: [{ title, text }]`).

## Decisions

- A step with a heading and no text is valid: the text field stops being required.
- The numbers are not editable: steps always start at 1.
- Paste-to-create: pasting lines into an empty Steps block makes one step per line, the line as its heading. If the pasted text has
  headings among its lines (marked as headings in the pasted text), nothing is converted and the paste is left as it is.
  Not needed for the first pull request; the same rule applies later to Checklist and Questions and answers.

## Build notes

- `inline: { item: 'items', fields: ['title', 'text'], texts: { addAbove, addBelow } }` in `src/standard/steps/index.tsx`; no `icon`, `link`,
  `media` or `settings`, so the block has no slots and no sheet.
- The shared parts need two small changes for a block without settings: the floating toolbar's `edit` is optional (no gear button), and
  the Link action and the item sheet are only there when the block has settings.
- A new `src/InlineSteps.tsx` draws the theme's `StepList` markup (`ol.block-steps`, `li.block-step`) on `InlineItems`; one entry in
  `src/inlineViews.tsx` and one in `inlineBlocks` of `scripts/editor-screens.mjs`.
- Texts in `src/i18n/en-US/blocks.ts` and `da-DK/blocks.ts`: `Add step`, `New step`, `Step n of total`, `Add above`, `Add below`.
- A parked first attempt exists only as a git stash in the session that wrote it; it is unverified and is not to be relied on.

## Checks

`npm run check`, `check:screens` with the new Steps entry (add button text, dotted outline, no background, faded step hidden once there is
a step, toolbar icons without Link or Edit, at 375 px and on a computer), `check:language`, and a look at it in a browser. Changeset: `patch`
or empty into `main`, else the owner decides; a release note line for the owner-visible change.
