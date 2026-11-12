// "Video", a standard block: the link to a video from YouTube or Vimeo and a title. On the site the title and the play
// button over a still from the video, which is only loaded when it is played (packages/editor/lib/video.mjs). How it
// looks is the theme's (packages/editor/theme/blocks/video/View.tsx; what it shows: view.ts, and load.ts on the site).
import { VideoCamera } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';

export default defineBlock({
  group: 'banner',
  label: t.blocks.video.label,
  icon: VideoCamera,
  hint: t.blocks.video.hint,
  fields: [
    {
      name: 'url',
      label: t.blocks.video.url,
      type: 'string',
      required: true,
      pattern: ['(youtube(-nocookie)?\\.com|youtu\\.be|vimeo\\.com)/', t.blocks.video.urlProblem],
    },
    { name: 'title', label: t.blocks.video.title, type: 'string' },
  ],
  detail: (p) => [String(p.title || t.blocks.video.video), String(p.url ?? '')],
});
