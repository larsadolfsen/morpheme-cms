// The Image grid typed in place (InlineLiveList.tsx): the images are drawn as the site draws them, from the images of Files; the heading and the
// subheading are typed above them. The filter's chips are drawn hidden (the site's script shows them): here the card shows them, and they do
// nothing (editor.css), so a tap selects the block; the Preview has the real behaviour. Which images, what a card shows and its style are in Edit.
import { useLayoutEffect, useRef } from 'react';
import InlineLiveList from './InlineLiveList';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/imagegrid/view';
import ImageGrid from '@theme/blocks/imagegrid/View';

export default function InlineImageGrid({ props, data, active, focus, onChange }: InlineViewProps) {
  const box = useRef<HTMLDivElement>(null);
  // No script runs in the editor: the chips are shown here (the theme's `[hidden]` rule cannot be overridden by a rule of the editor's).
  useLayoutEffect(() => {
    box.current?.querySelectorAll<HTMLElement>('[data-imagegrid-filter]').forEach((filter) => (filter.hidden = false));
  });
  return (
    <div ref={box}>
      <InlineLiveList
        props={props}
        active={active}
        focus={focus}
        onChange={onChange}
        drawn={(p) => {
          const view = viewOf(p, data);
          return view && <ImageGrid view={view} />;
        }}
      />
    </div>
  );
}
