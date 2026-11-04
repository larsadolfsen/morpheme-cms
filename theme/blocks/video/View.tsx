// "Video": the video before it is played, in the text's style, as a video written in the text
// (@morphemecms/cms/lib/video.mjs, .video-facade in ../blocks.css): a link to the video with its still, a play button and
// its title; a click puts the video in its place (Base.astro). A new link is a new video, with its own still. In the
// editor a still the site does not have yet is YouTube's or Vimeo's, else the plain box.
import { useState } from 'react';
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { Svg } from '@morphemecms/cms/src/icon';
import type { VideoView } from '@morphemecms/cms/src/standard/video/view';
import { InProse, Link, useOnSite } from '@morphemecms/cms/src/standard/view';

export default function Video({ view }: { view: VideoView }) {
  return <Facade key={view.href} view={view} />;
}

function Facade({ view }: { view: VideoView }) {
  const [still, setStill] = useState(view.still);
  const failed = () => {
    if (still === view.still && view.stillElsewhere) view.stillElsewhere().then((src) => setStill(src ? { src } : null));
    else setStill(null);
  };
  const classes = ['video-facade', !useOnSite() && 'my-0!', still && 'video-facade-still'];
  return (
    <InProse>
      <Link href={view.href} data-video={view.player} data-title={view.title} className={classes.filter(Boolean).join(' ')}>
        {still && (
          <img
            className="video-facade-image"
            src={still.src}
            srcSet={still.srcset}
            sizes={still.srcset && `(min-width: ${BREAKPOINTS.expanded}px) 720px, 100vw`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={failed}
          />
        )}
        <Svg name="play" weight="fill" size={48} />
        <span className="video-facade-title">{view.title}</span>
      </Link>
    </InProse>
  );
}
