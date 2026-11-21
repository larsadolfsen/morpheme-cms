# Screen reader test (0.19.4)

For the owner. A real reader pass on staging: about 15 to 20 minutes. English only.

Do it after the feature is merged and `morpheme-staging` has built the `next` version (real sign-in, real saving). A screen reader is something you hear, so
the automated check (`check:announce`) cannot replace this pass.

## Before you start

A screen reader reads aloud what is on the screen and what changes. You move with gestures or keys instead of the mouse. It is loud and unfamiliar at first.
Turn it on, learn three gestures, and you can do this whole pass.

### TalkBack on Android (do this first)

- **On:** Settings > Accessibility > TalkBack > turn on. Allow it when the phone asks.
- **Off:** the same switch. If the screen will not respond, press and hold both volume keys for 3 seconds.
- **Tap once** on something: it is read aloud.
- **Double-tap anywhere** to activate what was read last (a button, a link, a field).
- **Swipe right** for the next item, **swipe left** for the previous one.
- **Swipe down then right** (one motion) opens TalkBack's menu. You do not need it for this pass.
- **Scroll** with two fingers.

### NVDA on Windows (free) or Narrator

- **NVDA:** download it at nvaccess.org and install it. Start it from the Desktop or Start menu. **Stop it** with `NVDA+Q` (`NVDA` is the Insert key), then Enter.
- **Narrator** (built into Windows): **on or off** with `Windows+Ctrl+Enter`.
- **Tab** moves to the next control, `Shift+Tab` to the previous one. The control is read aloud.
- **Enter** or **Space** activates a button or a link. **Escape** closes a menu or dialog.
- **Arrow keys** move inside a menu, a list or a row of tabs.
- **Down arrow** (in NVDA's browse mode) reads the page line by line. Press `NVDA+Space` to switch between reading the page and typing in a field.
- **Stop speech** with `Ctrl`.
- Use Firefox or Chrome.

### VoiceOver on iPhone (optional)

- **On or off:** Settings > Accessibility > VoiceOver, or ask Siri "Turn on VoiceOver".
- **Tap once** to hear, **double-tap** to activate, **swipe right** or **left** for next or previous.

## The steps

Do the steps in order, on a computer with NVDA or Narrator, and again on a phone with TalkBack. Write down what you hear. Short is fine.
If you hear nothing, or hear the same thing twice, write that. On a phone, a step may be a page or a bottom sheet instead of a side sheet; that is expected.

1. **Sign in.** Open the staging site's `/editor/`. Enter your details and sign in.
   *Hear:* each field read with its name, and the sign-in button read as a button. This screen is not walked by the automated check, so write down anything unclear.
2. **Open a page.** Go to Pages and open one.
   *Hear:* the new screen's title as the first thing (the browser tab says `<screen> – <site name>`). Focus is at the top of the new screen.
3. **Change the title and listen for the save.** Go to the title field and change a letter. Wait about a second.
   *Hear:* `Saving`, then `Saved`. The three states are `Saving…`, `Saved` and `Not saved`. Nothing is said while you type each letter. If you hear `Not saved`, write it down with what you did.
4. **Leave a required field empty and press Save.** Empty a field the page needs (the title), then press `Save`.
   *Hear:* with several problems, `3 problems.` (the real number) and then the first problem, said at once. With one problem you hear that problem alone. Focus is on the first wrong field, and it is read as invalid with its problem.
5. **Open the page menu and a dialog.** Open the page's menu (the button with three dots at the top of the page), then pick an action that asks something (for example Schedule or Delete).
   *Hear:* the menu button says it is a menu button and expanded or collapsed. Inside the menu, each item is read with its position. When the dialog opens, its title is read. Nothing in the dialog has focus until you move; Tab goes to its buttons. Escape closes it and focus returns to the menu button.
6. **Select, move and remove a block.** On a page with blocks, move to a block and select it.
   *Hear:* for example `Image, block 2 of 3, selected` (the block's kind, its place and the number of blocks). Press Move down: `Image moved to block 3 of 3`. Add a block with Insert: `Image added, block 2 of 3`. Remove it: `Image removed`, then where focus is: `Focus is in the text.` or `Focus is on the text tools.` With several blocks selected: `2 blocks removed`.
7. **Switch tabs in Settings.** Open Settings and move along its tabs with the arrow keys (computer) or by swiping (phone).
   *Hear:* each tab's name, that it is a tab, and `selected` on the current one. Opening a tab reads that tab's name as its panel.
8. **The text bar.** Click in the text of a page, so the cursor is in the text.
   *Hear:* the first time the text has focus on a page, the text area is read with `Alt+F10 moves to the formatting tools`. Click away and back: it is not said again. Press `Alt+F10`: focus goes to the text bar, read as a toolbar. Use the arrow keys between tools: each tool is read with its name and, if it is on, `pressed`. Press `Escape` to go back into the text.
9. **Back names.** Open a screen inside Settings.
   *Hear:* the back arrow is read as `Back to Settings` (or the real name of the screen before), never only `Back` and never `arrow back`.
10. **The screen title on a route change.** Go from Pages to Media to Settings with the menu.
    *Hear:* on each change, the new screen's title, and the browser tab shows `<screen> – <site name>`.
11. **The page preview.** Open the preview of a page and pick a size (Phone or Computer).
    *Hear:* `Preview updated` once, when it is ready. The preview itself is not read out while you move through the editor.

## What to send back

One line per step, in this form: `step, what I heard`. For example: `4, I heard "3 problems" and then nothing`. Send them to the PM of 0.19.4. A fix is a pull request
on `feature/0.19.4-screen-readers` before the merge.

## What the automated check does not prove

`check:announce` reads Chromium's accessibility tree and records what the editor puts into its two announcer regions, on the demo, in Chromium. It does not
prove that:

- NVDA, Narrator, TalkBack or VoiceOver actually speak those words, in that order, or how fast.
- A reader on a phone says the same as on a computer (the check also runs at 375 px, but in a browser, not on a device).
- The text is understood: only a person can say if `Image, block 2 of 3, selected` is clear.
- The staging site's real sign-in and real saves behave like the demo.
- Another browser or reader combination (Safari with VoiceOver) behaves the same.

If a step sounds wrong to you even though the check is green, it is wrong. Report it.
