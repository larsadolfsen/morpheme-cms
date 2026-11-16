// Enter that confirms an IME composition (Japanese, Chinese, Korean) is not a command: a handler that acts on Enter
// ignores it. Safari reports the confirming keydown with isComposing already false, but with keyCode 229
// (Modern Web Guidance, ime-safe-enter-submit). Takes a DOM KeyboardEvent or a React one.

/** True when `event` is a plain Enter keydown the handler may act on (not one that confirms a composition). */
export function isActionEnter(event) {
  if (event.key !== 'Enter') return false;
  const native = event.nativeEvent ?? event;
  return !native.isComposing && native.keyCode !== 229;
}
