// The scope of an app's block (docs/superpowers/specs/2026-11-20-scoped-app-css-design.md): the block's outer element carries `data-mo-app="<id>"`, which the
// app's CSS is scoped to at build time (lib/appCss.mjs). The attribute goes on the block's OWN outer element, so no extra element sits in the page's flow:
// the theme's child and sibling rules (`.mo-prose > :first-child`, `.mo-text-section > :last-child`, `.mo-placed-block > …`) keep reaching the block as
// before. Only when the view does not return one element of its own (a fragment, text, nothing) does an element that takes no space (`display: contents`)
// carry it. The app does not write the attribute and cannot remove it. Exposes scoped, scopedNode, scopedPart.
import { cloneElement, isValidElement } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';

/** Puts the scope on `node`: on its own element when it is one HTML element, else on a wrapper that takes no space. */
export function scopedNode(id: string, node: ReactNode): ReactNode {
  if (isValidElement(node) && typeof node.type === 'string')
    return cloneElement(node as ReactElement<Record<string, unknown>>, { 'data-mo-app': id });
  if (node === null || node === undefined || node === false) return node;
  return (
    <div data-mo-app={id} style={{ display: 'contents' }}>
      {node}
    </div>
  );
}

/** A component of an app, drawn in the app's scope; the same one for the same input. The component is called here, in this component's own render, so
 * its hooks run as they would anywhere else. */
export function scoped<P extends object>(id: string, Component: ComponentType<P>): ComponentType<P> {
  const Scoped: ComponentType<P> =
    typeof Component === 'function' && !Component.prototype?.isReactComponent
      ? (props: P) => scopedNode(id, (Component as (p: P) => ReactNode)(props))
      : (props: P) => scopedNode(id, <Component {...props} />); // a class: drawn by React, on a wrapper
  Scoped.displayName = `Scoped(${Component.displayName ?? Component.name ?? id})`;
  return Scoped;
}

const parts = new WeakMap<object, Map<string, ComponentType<any>>>();
/** `scoped`, the same component for the same app and part (the site draws a part again on every render; a new component each time would remount it). */
export function scopedPart<P extends object>(id: string, Component: ComponentType<P>): ComponentType<P> {
  const byId = parts.get(Component) ?? new Map<string, ComponentType<any>>();
  parts.set(Component, byId);
  if (!byId.has(id)) byId.set(id, scoped(id, Component));
  return byId.get(id)!;
}
