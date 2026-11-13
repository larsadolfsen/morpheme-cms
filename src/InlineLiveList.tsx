// A block that reads a list of the site (Testimonials, Blog posts) typed in place: the block is drawn as the site draws it, with the real
// items (the theme's View, from the list's data), and only its head is typed where it stands: the heading and the subheading above the items
// (InlineSingle.tsx). Which items it shows, and how, are the block's settings (Edit, the gear). The block is drawn with no head of its own
// while it is typed in (the typed fields stand there) and as the site draws it otherwise; with no head, a tap on it starts one.
import type { ReactNode } from 'react';
import { t } from './i18n';
import InlineSingle from './InlineSingle';
import type { InlineViewProps } from './inlineViews';
import { InProse } from './standard/view';

export default function InlineLiveList({
  props,
  active,
  focus,
  onChange,
  drawn,
}: Pick<InlineViewProps, 'props' | 'active' | 'focus' | 'onChange'> & {
  /** The block as the site draws it, from the props it is given (its head is the block's own while it is not typed in). */
  drawn: (props: InlineViewProps['props']) => ReactNode;
}) {
  const start = () => onChange({ active: 0, focus: { row: 0, field: 'heading' } });
  return (
    <InlineSingle
      props={props}
      active={active}
      focus={focus}
      fields={['heading', 'intro']}
      onChange={onChange}
      render={({ here, field }) => (
        <div
          className="inline-live-list"
          onClick={(e) => {
            // A tap on the items (their links lead nowhere here) puts the cursor in the head.
            if (!here && !(e.target as Element).closest('textarea')) {
              e.preventDefault();
              start();
            }
          }}
        >
          {here ? (
            <InProse>
              <hgroup className="block-head inline-live-head inline-list-row-active">
                <h2>{field('heading', t.blocks.heading, t.blocks.heading)}</h2>
                <p className="block-subheading">{field('intro', t.blocks.subheading, t.blocks.subheading)}</p>
              </hgroup>
            </InProse>
          ) : null}
          {drawn(here ? { ...props, heading: '', intro: '' } : props)}
        </div>
      )}
    />
  );
}
