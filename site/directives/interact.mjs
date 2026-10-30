// Astro client directive: client:interact
// Hydrates an island only when the visitor reaches for it (touch, hover, focus or click),
// so pages don't download React/Motion for a menu that may never be opened.
// A click that lands before hydration has finished is replayed afterwards.
export default (load, _opts, el) => {
  const events = ['touchstart', 'pointerenter', 'focusin', 'click'];
  let started = false;
  let pendingClick = null;

  const onClick = (e) => {
    pendingClick = e.target instanceof Element ? e.target.closest('button, a') : null;
  };

  const start = async (e) => {
    if (e.type === 'click') onClick(e);
    if (started) return;
    started = true;
    events.forEach((name) => el.removeEventListener(name, start));
    el.addEventListener('click', onClick, { capture: true });
    const hydrate = await load();
    await hydrate();
    el.removeEventListener('click', onClick, { capture: true });
    if (pendingClick) {
      // Wait a frame so React has attached its handlers before replaying the click.
      const target = pendingClick;
      requestAnimationFrame(() => (el.contains(target) ? target : el.querySelector('button'))?.click());
    }
  };

  events.forEach((name) => el.addEventListener(name, start, { passive: true }));
};
