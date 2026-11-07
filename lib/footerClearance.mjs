// Whether a screen needs clearance under its footer for the floating action button: only when it has one and its content
// pushes the footer below the window, so a short screen has its footer at the very bottom. Exposes needsClearance. No imports.

/**
 * @param {number} pageHeight The page's height with no clearance added.
 * @param {number} windowHeight The window's height.
 * @param {boolean} hasFab Whether the screen shows a FAB.
 */
export const needsClearance = (pageHeight, windowHeight, hasFab) => hasFab && pageHeight > windowHeight;
