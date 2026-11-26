// The demo's editor without sign-in, page side (scripts/demo-editor.mjs adds it to the demo's /editor/ only): registers the service
// worker that answers the Worker's calls (scripts/demo-editor-sw.js), reloads once when it takes over, and resets the saves on
// `/editor/?demo-reset`. Not in the package.
(async () => {
  if (!('serviceWorker' in navigator)) return;
  // A browser under automation (the screens checks open this build and fake the Worker themselves) keeps its own fakes, unless the
  // proof of the demo editor (scripts/check-demo-editor.mjs) asks for the worker.
  if (navigator.webdriver && !window.demoEditorProof) return;
  // The build wrote the worker's URL (scripts/demo-editor.mjs); the editor registers the same one (lib/editorWorker.mjs), so nothing replaces it.
  const reg = await navigator.serviceWorker.register(window.moEditorWorker, { scope: '/editor/' });
  await navigator.serviceWorker.ready;
  if (new URLSearchParams(location.search).has('demo-reset')) {
    const done = new Promise((ok) =>
      navigator.serviceWorker.addEventListener('message', (e) => e.data?.demoEditor === 'reset-done' && ok()),
    );
    (navigator.serviceWorker.controller ?? reg.active).postMessage({ demoEditor: 'reset' });
    await done;
    // The editor's own copies of the files and its recent edits are the demo's saves too.
    try {
      localStorage.clear();
    } catch {}
    await Promise.all(
      (await indexedDB.databases())
        .filter((d) => d.name !== 'morpheme-demo-editor')
        .map((d) => new Promise((ok) => Object.assign(indexedDB.deleteDatabase(d.name), { onsuccess: ok, onerror: ok, onblocked: ok }))),
    );
    location.replace('/editor/');
    return;
  }
  if (!navigator.serviceWorker.controller) location.reload();
})();
