// The editor's service worker URL, decided in one place: the build. A real site's build writes nothing and gets the plain worker; the
// demo's build (scripts/demo-editor.mjs) writes `window.moEditorWorker` into the editor's page before anything runs, and the editor
// (src/deploy.ts registerWorker) and the demo's page script (scripts/demo-editor-page.js) both register exactly that URL. Two
// different URLs would replace each other's worker and send /api/github/* to the real Worker (401).
export const REAL_WORKER = '/editor/sw.js';
export const DEMO_WORKER = '/editor/sw.js?demo';

/** The URL the editor registers, from the page's globals (`win` is `window`). */
export function editorWorkerUrl(win) {
  return win?.moEditorWorker === DEMO_WORKER ? DEMO_WORKER : REAL_WORKER;
}
