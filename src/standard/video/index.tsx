// "Video", a standard block: the link to a video from YouTube or Vimeo, a title and an optional thumbnail (an image of the
// site, with the image field's own crop tools). On the site the title and the play button over the thumbnail, else a still from the video, which is only loaded when it is played (packages/editor/lib/video.mjs). How it
// looks is the theme's (packages/editor/theme/blocks/video/View.tsx; what it shows: view.ts, and load.ts on the site).
import { VideoCamera } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';

export default defineBlock({
  group: 'media',
  label: t.blocks.video.label,
  icon: VideoCamera,
  hint: t.blocks.video.hint,
  // Typed in place (InlineVideo.tsx): the title under the frame; the link is in the sheet, opened by the bar's Change link (a tap on the frame selects the block).
  inline: {
    item: '',
    single: true,
    fields: ['title'],
    settings: ['url', 'thumbnail'],
    blockSettings: true,
    texts: { addAbove: '', addBelow: '', row: t.blocks.video.label, settings: t.blocks.video.url, changeLink: t.blocks.video.changeUrl },
  },
  fields: [
    {
      name: 'url',
      label: t.blocks.video.url,
      type: 'string',
      required: true,
      pattern: ['(youtube(-nocookie)?\\.com|youtu\\.be|vimeo\\.com)/', t.blocks.video.urlProblem],
    },
    { name: 'title', label: t.blocks.video.title, type: 'string' },
    // The poster: an image of the site's own, drawn before the video is played. Without it: the still from the video link. It is
    // decorative (the title names the link), so it has no alt text.
    { name: 'thumbnail', label: t.blocks.video.thumbnail, type: 'image', hint: t.blocks.video.thumbnailHint },
  ],
  detail: (p) => [String(p.title || t.blocks.video.video), String(p.url ?? '')],
});
