// A block that reads a list of the site (Testimonials, Blog posts, Image grid) typed in place: the block is drawn as the site draws it, with the
// real items (the theme's View, from the list's data). It has no head of its own to type (a heading above it is the text's); which items it shows,
// and how, are the block's settings (Edit, the gear).
import type { ReactNode } from 'react';
import type { InlineViewProps } from './inlineViews';

export default function InlineLiveList({
  props,
  onChange,
  drawn,
}: Pick<InlineViewProps, 'props' | 'active' | 'focus' | 'onChange'> & {
  /** The block as the site draws it, from the props it is given. */
  drawn: (props: InlineViewProps['props']) => ReactNode;
}) {
  // The items' links lead nowhere here: a tap on the items makes the block the active one and never opens a page.
  return (
    <div
      className="mo-editor-inline-live-list"
      onClick={(e) => {
        if ((e.target as Element).closest('a')) e.preventDefault();
        onChange({ active: 0 });
      }}
    >
      {drawn(props)}
    </div>
  );
}
