// The scope of an app's block (docs/superpowers/specs/2026-11-20-scoped-app-css-design.md): the block's outer element carries `data-mo-app="<id>"`, which the
// app's CSS is scoped to at build time (lib/appCss.mjs). The element takes no space (`display: contents`), so no look changes; the app does not write it and
// cannot remove it. Exposes scoped, scopedNode.
import type { ComponentType, ReactNode } from 'react';

/** What draws the block, in its scope. @param {string} id */
export function scopedNode(id: string, children: ReactNode) {
  return (
    <div data-mo-app={id} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/** A component of an app, drawn in the app's scope; the same one for the same input. */
export function scoped<P extends object>(id: string, Component: ComponentType<P>): ComponentType<P> {
  const Scoped = (props: P) => scopedNode(id, <Component {...props} />);
  Scoped.displayName = `Scoped(${Component.displayName ?? Component.name ?? id})`;
  return Scoped;
}
