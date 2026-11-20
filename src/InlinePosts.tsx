// The Blog posts block typed in place (InlineLiveList.tsx): the posts are drawn as the site draws them, from the site's blog; the heading and
// the subheading are typed above them. Which posts, how many and the design are in Edit.
import InlineLiveList from './InlineLiveList';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/posts/view';
import Posts from '@theme/blocks/posts/View';

export default function InlinePosts({ props, data, active, focus, onChange }: InlineViewProps) {
  return (
    <InlineLiveList
      props={props}
      active={active}
      focus={focus}
      onChange={onChange}
      drawn={(p) => {
        const view = viewOf(p, data);
        return view && <Posts view={view} />;
      }}
    />
  );
}
