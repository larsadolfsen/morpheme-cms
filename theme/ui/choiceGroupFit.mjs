// Which form a choice group (ChoiceGroup.tsx) takes, by measuring: the connected button group when every button fits its
// label on one line at an equal share of the width, else the list of radio buttons. A pure function, so the rule is tested
// on its own (choiceGroupFit.test.mjs). Exposes fitsAsButtons, MAX_BUTTONS and HYSTERESIS.

/** Material's cap for a segmented button, kept for the connected group that replaces it: six or more choices are a list. */
export const MAX_BUTTONS = 5;

/** The extra width (px, 8 dp) the switch back from the list to the buttons needs, so a width at the edge never flips the
 * form back and forth while a sheet animates. */
export const HYSTERESIS = 8;

/**
 * Whether the choices are drawn as buttons.
 * @param {number[]} widths each button's natural width (its padding, its icon and gap, its label), in px
 * @param {number} width the width the group gets, in px
 * @param {number} gap the space between two buttons, in px
 * @param {boolean} [wasButtons] the group is drawn as buttons now (a list needs HYSTERESIS more to become buttons)
 * @returns {boolean}
 */
export function fitsAsButtons(widths, width, gap, wasButtons = false) {
  const n = widths.length;
  if (n === 0 || n > MAX_BUTTONS || !(width > 0)) return false;
  // Every button gets the same width (Material: "increasing the button widths inside"), so the widest decides.
  const needed = Math.max(...widths) * n + (n - 1) * gap;
  return needed <= width - (wasButtons ? 0 : HYSTERESIS);
}
