// One related post under a blog post (RelatedPosts.astro): a Material card (ui/Card.tsx) with the post's image, its
// title, and its date and reading time (PostMeta.tsx). A theme may replace this file to redesign the card.
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import Card from '@theme/ui/Card';
import Img from '@theme/components/Img';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';

export default function PostCard({ post }: { post: PostView }) {
  return (
    <Card as="article" href={post.href} className="h-full overflow-hidden">
      {post.image && (
        <Img
          image={post.image}
          alt={post.imageAlt ?? ''}
          sizes={`(min-width: ${BREAKPOINTS.medium}px) 33vw, 100vw`}
          className="aspect-[4/3] w-full object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="type-title-medium">{post.title}</h3>
        <PostMeta post={post} className="mt-2" />
      </div>
    </Card>
  );
}
