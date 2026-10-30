// One drawing of a standard block, for the site and the editor alike. A standard block's contract says what it shows
// (view.ts in its folder here: the type of its view, and viewOf, which makes it from the block's fields and the
// site's data in the editor; load.ts: the same view on the site, when it is built), and the theme draws that view
// (View.tsx in the theme's blocks/<type>/, a React component given `view`). On the site BlockSite.astro loads the view
// and has React draw it as HTML, without sending any JavaScript; in the editor registry.tsx draws it as the block's
// `draw`. The parts a theme's drawings are made of (Buttons, LinkCards …) are React components too, which the site's
// Astro components show the same way. What differs between the two is said here, so the drawing is the same: a link
// is a link only on the site (Link), and only there does a block stand in the text (useInText). A drawing is on the
// site unless the editor says otherwise (InEditor, around the editor and its pictures of the blocks).
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type { BlockData } from '../blocks';
import { shownAt } from '../images';

const Editor = createContext(false);
// The editor's own screens, which are drawn with the theme's UI parts too (packages/editor/src/ui.tsx): their links lead
// somewhere. What the editor draws of the site in them (a preview, a picture of a block) is InEditor again.
const Own = createContext(false);

/** What is drawn in it is in the editor: the editor (App.tsx) and its pictures of the blocks (registry.tsx, Preview). */
export const InEditor = ({ children }: { children: ReactNode }) => (
  <Editor.Provider value={true}>
    <Own.Provider value={false}>{children}</Own.Provider>
  </Editor.Provider>
);

/** The editor's own screens (App.tsx), in the editor: a Link in them is a link. */
export const EditorOwn = ({ children }: { children: ReactNode }) => <Own.Provider value={true}>{children}</Own.Provider>;

/** Whether the block is drawn on the site (as HTML, when it is built), not in the editor. */
export const useOnSite = () => !useContext(Editor);

/** The classes of a block's outermost element on the site: out of the text's style (not-prose), with the space a
 * block has in the text (.block-in-text); in the editor, where it is drawn on its own, none. With the block's own
 * classes after them. */
export function useInText(...classes: (string | false | undefined)[]): string {
  return [useOnSite() && 'not-prose block-in-text', ...classes].filter(Boolean).join(' ');
}

/** Something in the text's style (prose): on the site it is in the text already; in the editor it is drawn in a box of
 * that style. */
export function InProse({ children }: { children: ReactNode }) {
  return useOnSite() ? children : <div className="prose max-w-none">{children}</div>;
}

/** A link on the site and on the editor's own screens (EditorOwn); in what the editor draws of the site only drawn (its
 * text, with the same classes and the attributes that say its state, aria-current and data-…, which the theme styles),
 * so nothing leads away from it. */
export function Link({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & Record<string, unknown>) {
  const state = Object.fromEntries(Object.entries(rest).filter(([k]) => k === 'aria-current' || k.startsWith('data-')));
  const own = useContext(Own);
  return useOnSite() || own ? (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ) : (
    <span className={className} {...state}>
      {children}
    </span>
  );
}

/** A picture with the sizes the site has made of it (srcset, width and height), for the browser to pick the one that
 * fits (pictureOf, load.ts); in the editor only the picture. */
export type Picture = { src: string; srcset?: string; width?: number; height?: number };

/** A picture in the editor: as it is shown there (shownAt: one made ready in this visit, from the browser). */
export const shownPicture = (src: string): Picture => ({ src: shownAt(src) });

/** What a block's contract makes its view from in the editor (view.ts): its fields and the site's data. Null: nothing
 * is shown. */
export type ViewOf<V> = (props: Record<string, any>, data: BlockData) => V | null;

/** Where a block stands on the site, for its load.ts: its shared texts (shared.ts, with those saved over them), its
 * place among the parts of the text, the page's address, and whether the page is a new version (/ny/). */
export type LoadContext = { texts: Record<string, any>; index: number; path?: string; preview?: boolean };

/** What a block's contract makes its view from on the site, when it is built (load.ts). Null: nothing is shown. */
export type Load<V> = (props: Record<string, any>, at: LoadContext) => Promise<V | null>;

/** A block's load.ts: its view on the site, and what is put right after it there (`after`: HTML, e.g. a script that
 * runs as the page is read, or structured data). */
export type Contract<V> = {
  load: Load<V>;
  after?: (view: V) => string | undefined;
  /** Drawn across the page, below the text and the column beside it, when it ends a page's text (endBlock in views.ts). */
  across?: boolean;
};

/** The kinds of a button, as Material 3 names them (m3.material.io/components/buttons): what a block's or an app's
 * button is (a button's `kind` in its view), which the theme's Button (ui/Button.tsx) draws in its look. */
export const buttonKinds = ['filled', 'tonal', 'elevated', 'outlined', 'text'] as const;
export type ButtonKind = (typeof buttonKinds)[number];

/** The kinds of an icon button, as Material 3 names them (m3.material.io/components/icon-buttons), drawn by the
 * theme's IconButton (ui/IconButton.tsx). */
export const iconButtonKinds = ['standard', 'filled', 'tonal', 'outlined'] as const;
export type IconButtonKind = (typeof iconButtonKinds)[number];

/** A theme's drawing of a block (View.tsx). */
export type View<V> = ComponentType<{ view: V }>;
