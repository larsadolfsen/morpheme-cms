// The video in what is pasted for it, from YouTube or Vimeo: a link to it, in any form they give it, or
// their code to embed it; null when it is not a video. Used by the video block on the site (video.mjs),
// in the editor (src/standard/video/) and when the stills are fetched (packages/editor/scripts/video-thumbnails.mjs), so
// all read it the same.
//   { site: 'youtube', id }: youtube.com/watch?v=…, youtu.be/…, /shorts/…, /live/…, /embed/…
//   { site: 'vimeo', id, hash }: vimeo.com/<id>, with the hash of an unlisted video after it
//     (vimeo.com/<id>/<hash>), /channels/<name>/<id>, /showcase/…/video/<id>, /groups/…/videos/<id>,
//     /manage/videos/<id> and player.vimeo.com/video/<id>?h=<hash>; hash is null when there is none.
const YOUTUBE_ID = /^[\w-]{11}$/;
const NUMBER = /^\d+$/;
const HASH = /^[\da-f]+$/i;

export function videoOf(text) {
  const src = /\bsrc="([^"]+)"/.exec(text ?? '')?.[1]?.replaceAll('&amp;', '&') ?? String(text ?? '').trim();
  let url;
  try {
    url = new URL(src.replace(/^\/\//, 'https://').replace(/^(?!https?:)(?=(www\.|m\.|player\.)?(youtu|vimeo))/i, 'https://'));
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, '');
  const part = (prefix) => (url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length).split('/')[0] : null);
  if (host === 'youtu.be' || /^youtube(-nocookie)?\.com$/.test(host)) {
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1).split('/')[0]
        : (url.searchParams.get('v') ?? part('/embed/') ?? part('/shorts/') ?? part('/live/'));
    return id && YOUTUBE_ID.test(id) ? { site: 'youtube', id } : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    // The id is first, the third in a channel, and after "video" or "videos" everywhere else.
    const at = NUMBER.test(parts[0] ?? '')
      ? 0
      : parts[0] === 'channels'
        ? 2
        : parts.findIndex((_, i) => /^videos?$/.test(parts[i - 1] ?? ''));
    const id = parts[at];
    if (!id || !NUMBER.test(id)) return null;
    const hash = [parts[at + 1], url.searchParams.get('h')].find((h) => h && HASH.test(h)) ?? null;
    return { site: 'vimeo', id, hash };
  }
  return null;
}

/** The address that plays the video, with the settings in the address of the iframe it came from.
 * @param {any} video
 * @param {string | null} [frame]
 * @returns {string}
 */
export function player(video, frame) {
  let params;
  try {
    params = new URL(frame).searchParams;
  } catch {
    params = new URLSearchParams();
  }
  params.delete('feature');
  params.set('autoplay', '1');
  if (video.site === 'youtube') return `https://www.youtube-nocookie.com/embed/${video.id}?${params}`;
  if (video.hash) params.set('h', video.hash);
  params.set('dnt', '1');
  return `https://player.vimeo.com/video/${video.id}?${params}`;
}

/** The video's own page on YouTube or Vimeo. */
export const videoPage = (video) =>
  video.site === 'youtube'
    ? `https://www.youtube.com/watch?v=${video.id}`
    : `https://vimeo.com/${video.id}${video.hash ? `/${video.hash}` : ''}`;

/** The name of the video's still on the site: /images/_video/<name>-480.webp and -960.webp. */
export const stillName = (video) => `${video.site}-${video.id}`;

/** Where Vimeo says what the video's still is (its thumbnail_url), at about `width` pixels wide. */
export const vimeoInfo = (video, width) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoPage(video))}&width=${width}`;
