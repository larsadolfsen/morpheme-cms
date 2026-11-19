// The Video block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, "Single blocks"): the video frame as the site draws it
// (the theme's Video: the still, the play button and the title); a tap on it selects the block; the title
// is typed under the frame. The link (and what is said when it is not a video's) stays in the sheet, which the bar's Change link opens. A block with
// no list: InlineSingle.tsx, not InlineItems.
import { t } from './i18n';
import InlineSingle from './InlineSingle';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/video/view';
import Video from '@theme/blocks/video/View';

export default function InlineVideo({ props, data, active, focus, onChange }: InlineViewProps) {
  const view = viewOf(props, data);
  return (
    <InlineSingle
      props={props}
      active={active}
      focus={focus}
      fields={['title']}
      onChange={onChange}
      render={({ here, field }) => (
        <div className={['mo-editor-inline-video', here && 'mo-editor-inline-list-row-active'].filter(Boolean).join(' ')}>
          {/* A tap on the frame selects the block: its Change link is on the bar (from expanded the sheet opens too). */}
          <div
            className="mo-editor-inline-video-frame"
            onClick={(e) => {
              // The frame's own link (the play button) goes nowhere in the editor.
              e.preventDefault();
              if (!here) onChange({ active: 0 });
            }}
          >
            {view && <Video view={view} />}
          </div>
          <p className="mo-editor-inline-video-title">{field('title', t.blocks.video.title, t.blocks.video.title)}</p>
        </div>
      )}
    />
  );
}
