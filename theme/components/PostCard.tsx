// One related post under a blog post (RelatedPosts.astro): a Material card (ui/Card.tsx) on its props: the post's image (`media`), its
// title (`headline`), and its date and reading time (`subhead`, PostMeta.tsx). A theme may replace this file to redesign the card.
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import Card, { CardMedia } from '@theme/ui/Card';
import Img from '@theme/components/Img';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';

export default function PostCard({ post }: { post: PostView }) {
  return (
    <Card
      as="article"
      href={post.href}
      className="mo-post-card"
      media={
        post.image ? (
          <CardMedia ratio={4 / 3}>
            <Img image={post.image} alt={post.imageAlt ?? ''} sizes={`(min-width: ${BREAKPOINTS.medium}px) 33vw, 100vw`} />
          </CardMedia>
        ) : undefined
      }
      headline={post.title}
      headingLevel={3}
      subhead={<PostMeta post={post} as="span" />}
    />
  );
}
