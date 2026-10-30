// Videos from YouTube and Vimeo in the text, without contacting them before the visitor asks for the
// video (docs/tracking.md: nothing from Google is loaded before consent, and nothing from Vimeo either).
// Each <iframe> with a video becomes a link to the video with its title; a click puts the video in its
// place, from youtube-nocookie.com or from Vimeo's player with dnt=1 (no tracking) (Base.astro). Without
// JavaScript the link opens the video on YouTube or Vimeo. The iframe is an element here (rehype-raw runs
// first, packages/editor/astro.mjs); one still in raw HTML (a Markdown pipeline without it) is handled too.
// The video block (facadeOf, src/standard/video/) gives the same link. Behind it is a still
// from the video, from the site itself (packages/editor/scripts/video-thumbnails.mjs), when it could be fetched.
import fs from 'node:fs';
import path from 'node:path';
import { svgHtml } from './svg.mjs';
import { player, stillName, videoOf, videoPage } from './video-id.mjs';

const IFRAME = /<iframe\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/iframe>/gi;

// The play button, as the video block draws it (<Svg name="play" weight="fill" size={48}>): the theme's icon
// (rehypeVideo's `play`), else Phosphor's.
const playButton = (file) =>
  svgHtml(file ?? fs.readFileSync(path.resolve('node_modules/@phosphor-icons/core/assets/fill/play-fill.svg'), 'utf8'), 48);

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const unescapeHtml = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);

/** The link that stands in for a video (videoOf), with its title; `frame`: the address of the iframe it
 * replaces, if any. */
function facade(video, title, frame, play) {
  const { href, player, title: name, still } = facadeOf(video, title, frame);
  const image = still
    ? `<img class="video-facade-image" src="${still.src}" srcset="${still.srcset}" sizes="(min-width: 768px) 720px, 100vw" alt="" loading="lazy" decoding="async">`
    : '';
  return (
    `<a class="video-facade${image ? ' video-facade-still' : ''}" href="${escapeHtml(href)}" data-video="${escapeHtml(player)}" data-title="${escapeHtml(name)}">` +
    image +
    play +
    `<span class="video-facade-title">${escapeHtml(name)}</span></a>`
  );
}

/** What stands in for a video (videoOf) on the site: its page, the address that plays it (`frame`: the address of the
 * iframe it replaces, if any), its title, and its still from the site, when it could be fetched. The video block's
 * view too (src/standard/video/load.ts). */
export function facadeOf(video, title, frame) {
  const still = `/images/_video/${stillName(video)}`;
  return {
    href: videoPage(video),
    player: player(video, frame),
    title: title || 'Video',
    still: fs.existsSync(path.resolve(`public${still}-960.webp`))
      ? { src: `${still}-960.webp`, srcset: `${still}-480.webp 480w, ${still}-960.webp 960w` }
      : null,
  };
}

/** The link for the video in an iframe's address, or null for one that is not a video. */
function frameFacade(src, title, play) {
  const video = videoOf(src);
  return video && facade(video, title, src, play);
}

const isFrame = (node) => node.type === 'element' && node.tagName === 'iframe' && typeof node.properties?.src === 'string';

/** Rehype plugin: iframes with a video from YouTube or Vimeo become links that load the video on a
 * click. Vimeo's code puts its iframe in a box of its own, which goes with it, and loads Vimeo's
 * script, which is left out. `play`: the theme's play button (its icons/play-fill.svg, else the standard theme's: themeIcon in
 * packages/editor/site/theme.mjs), else Phosphor's.
 * @param {{ play?: string | null }} [options] */
export function rehypeVideo({ play: file } = {}) {
  const play = playButton(file);
  return (tree) => {
    const visit = (node) => {
      node.children?.forEach((child, i) => {
        const inner =
          child.type === 'element' && child.tagName === 'div' ? child.children.filter((c) => c.type !== 'text' || c.value.trim()) : [];
        const frame = isFrame(child) ? child : inner.length === 1 && isFrame(inner[0]) ? inner[0] : null;
        if (child.type === 'element' && child.tagName === 'script' && /player\.vimeo\.com\//.test(String(child.properties?.src))) {
          node.children[i] = { type: 'raw', value: '' };
        } else if (child.type === 'raw') {
          child.value = child.value.replace(IFRAME, (tag, src) => {
            const title = tag.match(/\btitle="([^"]*)"/)?.[1];
            return frameFacade(unescapeHtml(src), title && unescapeHtml(title), play) ?? tag;
          });
        } else if (frame) {
          const html = frameFacade(frame.properties.src, frame.properties.title, play);
          if (html) node.children[i] = { type: 'raw', value: html };
          else visit(child);
        } else visit(child);
      });
    };
    visit(tree);
  };
}
