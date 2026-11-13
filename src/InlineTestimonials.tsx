// The Testimonials block typed in place (InlineLiveList.tsx): its testimonials are drawn as the site draws them, from the site's list; the
// heading and the subheading are typed above them. Which testimonials, the layout and the tags are in Edit.
import InlineLiveList from './InlineLiveList';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/testimonials/view';
import Testimonials from '@theme/blocks/testimonials/View';

export default function InlineTestimonials({ props, data, active, focus, onChange }: InlineViewProps) {
  return (
    <InlineLiveList
      props={props}
      active={active}
      focus={focus}
      onChange={onChange}
      drawn={(p) => {
        const view = viewOf(p, data);
        return view && <Testimonials view={view} />;
      }}
    />
  );
}
