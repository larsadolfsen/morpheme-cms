// Keeps the editor's bars in view while the page is zoomed in (pinch zoom is on: WCAG 2.2 1.4.4, plan 0.19.2). A pinch zooms the
// visual viewport, a window onto the layout viewport that the bars are fixed or sticky to, so they would stay where the layout
// viewport is and leave the screen. While zoomed (scale above 1) this sets on the page where the visual viewport is, and
// editor.css places the Save bar (fixed to the bottom) and the text toolbar (sticky at the top) against it. Not zoomed, it sets nothing
// and the bars stay as they were.
const ZOOMED = 1.01;
const NAMES = [
  '--mo-comp-editor-visual-left',
  '--mo-comp-editor-visual-top',
  '--mo-comp-editor-visual-bottom',
  '--mo-comp-editor-visual-scale',
] as const;

/** Where the visual viewport stands, as the values the page gets; null while the page is not zoomed. Pure, for the tests. */
export function visualBox(
  view: { offsetLeft: number; offsetTop: number; width: number; height: number; scale: number },
  layoutHeight: number,
): Record<(typeof NAMES)[number], string> | null {
  if (view.scale <= ZOOMED) return null;
  const px = (n: number) => `${Math.max(0, Math.round(n * 100) / 100)}px`;
  return {
    '--mo-comp-editor-visual-left': px(view.offsetLeft),
    '--mo-comp-editor-visual-top': px(view.offsetTop),
    '--mo-comp-editor-visual-bottom': px(layoutHeight - view.offsetTop - view.height),
    '--mo-comp-editor-visual-scale': String(1 / view.scale),
  };
}

/** Starts following the visual viewport; gives what stops it. */
export function followVisualViewport(): () => void {
  const view = window.visualViewport;
  if (!view) return () => {};
  const root = document.documentElement;
  const update = () => {
    const box = visualBox(view, root.clientHeight);
    root.toggleAttribute('data-zoomed', !!box);
    for (const name of NAMES) {
      if (box) root.style.setProperty(name, box[name]);
      else root.style.removeProperty(name);
    }
  };
  update();
  view.addEventListener('resize', update);
  view.addEventListener('scroll', update);
  return () => {
    view.removeEventListener('resize', update);
    view.removeEventListener('scroll', update);
    root.removeAttribute('data-zoomed');
    for (const name of NAMES) root.style.removeProperty(name);
  };
}
