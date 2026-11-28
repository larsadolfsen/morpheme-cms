// "Video" on the site (view.ts): as a video written in the text (facadeOf, ../../../lib/video.mjs); the block's own thumbnail,
// a local image with the sizes the site made of it (imageOf), is its still when it has one.
import { facadeOf } from '../../../lib/video.mjs';
import { videoOf } from '../../../lib/video-id.mjs';
import { imageOf } from '../load';
import type { Load } from '../view';
import { thumbnailAlt, thumbnailOf } from './thumbnail.mjs';
import type { VideoView } from './view';

/** A video's view on the site, with the thumbnail of `props` (`thumbnail`, `alt`) as its still when it has one. The carousel's video items use it too. */
export function facadeWithThumbnail(video: NonNullable<ReturnType<typeof videoOf>>, props: Record<string, any>, title?: string): VideoView {
  const view = facadeOf(video, title);
  const thumbnail = thumbnailOf(props);
  if (!thumbnail) return view;
  // A local image: the video's provider is still only contacted when the visitor presses play.
  // `alt` is the Library's text ("" when it marks the image decorative) unless the block has its own.
  const { src, srcset, placeholder, alt: library } = imageOf(thumbnail);
  const alt = props.alt?.trim() ? thumbnailAlt(props) : (library ?? '');
  return { ...view, still: { src, ...(srcset ? { srcset } : {}), ...(placeholder ? { placeholder } : {}), alt } };
}

export const load: Load<VideoView> = async (props) => {
  const video = videoOf(String(props.url ?? ''));
  return video ? facadeWithThumbnail(video, props, props.title) : null;
};
