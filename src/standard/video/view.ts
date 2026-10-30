// What "Video" shows (its view, drawn by the theme's View.tsx): the link that stands in for the video until it is
// played (../../../lib/video.mjs): the video's page, the address that plays it, its title, and its still from the site
// (packages/editor/scripts/video-thumbnails.mjs). In the editor (viewOf) the still is the one the site would have, and, when the site
// does not have it yet (a video it has not been built with), YouTube's or Vimeo's (`stillElsewhere`); on the site
// (load.ts) the site's, when it could be fetched. On the site nothing for an address that is not a video; in the
// editor the plain box.
import { player, stillName, videoOf, videoPage, vimeoInfo } from '../../../lib/video-id.mjs';
import type { ViewOf } from '../view';

export type VideoView = {
  href: string;
  player: string;
  title: string;
  still: { src: string; srcset?: string } | null;
  /** In the editor: YouTube's or Vimeo's still, for when the site has none. */
  stillElsewhere?: () => Promise<string | null>;
};

/** The still YouTube or Vimeo has of a video, or null. */
async function theirStill(video: NonNullable<ReturnType<typeof videoOf>>): Promise<string | null> {
  if (video.site === 'youtube') return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  try {
    const res = await fetch(vimeoInfo(video, 960));
    return res.ok ? ((await res.json()).thumbnail_url ?? null) : null;
  } catch {
    return null;
  }
}

export const viewOf: ViewOf<VideoView> = (props) => {
  const video = videoOf(String(props.url ?? ''));
  const title = String(props.title || 'Video');
  // While its link is not (yet) a video's: the plain box.
  if (!video) return { href: '', player: '', title, still: null };
  return {
    href: videoPage(video),
    player: player(video),
    title,
    still: { src: `/images/_video/${stillName(video)}-960.webp` },
    stillElsewhere: () => theirStill(video),
  };
};
