// "Video" on the site (view.ts): as a video written in the text (facadeOf, ../../../lib/video.mjs); the block's own thumbnail,
// a local image with the sizes the site made of it (imageOf), is its still when it has one.
import { facadeOf } from '../../../lib/video.mjs';
import { videoOf } from '../../../lib/video-id.mjs';
import { imageOf } from '../load';
import type { Load } from '../view';
import { thumbnailOf } from './thumbnail.mjs';
import type { VideoView } from './view';

export const load: Load<VideoView> = async (props) => {
  const video = videoOf(String(props.url ?? ''));
  if (!video) return null;
  const view = facadeOf(video, props.title);
  const thumbnail = thumbnailOf(props);
  if (!thumbnail) return view;
  // A local image: the video's provider is still only contacted when the visitor presses play.
  const { src, srcset } = imageOf(thumbnail);
  return { ...view, still: { src, ...(srcset ? { srcset } : {}) } };
};
