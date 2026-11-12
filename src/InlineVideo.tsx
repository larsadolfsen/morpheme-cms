// The Video block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, "Single blocks"): the video frame as the site draws it
// (the theme's Video: the still, the play button and the title) with a slot for the link over it while the block is active; the title
// is typed under the frame. The link (and what is said when it is not a video's) stays in the sheet, which the slot opens. A block with
// no list: InlineSingle.tsx, not InlineItems.
import { VideoCamera } from '@phosphor-icons/react';
import { t } from './i18n';
import { InlineSlot } from './InlineItems';
import InlineSingle from './InlineSingle';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/video/view';
import Video from '@theme/blocks/video/View';

export default function InlineVideo({ props, data, active, focus, onChange, onSettings }: InlineViewProps) {
  const view = viewOf(props, data);
  return (
    <InlineSingle
      props={props}
      active={active}
      focus={focus}
      fields={['title']}
      onChange={onChange}
      render={({ here, field }) => (
        <div className={['inline-video', here && 'inline-list-row-active'].filter(Boolean).join(' ')}>
          {here && (
            <span className="inline-card-slots">
              <InlineSlot label={t.blocks.video.url} onClick={() => onSettings(0)}>
                <VideoCamera size={24} />
              </InlineSlot>
            </span>
          )}
          {view && <Video view={view} />}
          <p className="inline-video-title">{field('title', t.blocks.video.title, t.blocks.video.title)}</p>
        </div>
      )}
    />
  );
}
