// "Video" on the site (view.ts): as a video written in the text (facadeOf, ../../../lib/video.mjs).
import { facadeOf } from '../../../lib/video.mjs';
import { videoOf } from '../../../lib/video-id.mjs';
import type { Load } from '../view';
import type { VideoView } from './view';

export const load: Load<VideoView> = async (props) => {
  const video = videoOf(String(props.url ?? ''));
  return video && facadeOf(video, props.title);
};
