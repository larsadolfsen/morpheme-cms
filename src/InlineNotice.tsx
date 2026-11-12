// The Notice block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, "Single blocks"): the notice is drawn as the site
// draws it (the theme's Notice) and its text is typed in it, as markdown (bold, italic and links as written). While it is typed in, the
// notice shows its text as written; otherwise as the site draws it, and a tap puts the cursor in it. `Show until` stays in the sheet (the
// settings of the block's toolbar, and the side panel from expanded). A block with no list: InlineSingle.tsx, not InlineItems.
import { t } from './i18n';
import InlineSingle from './InlineSingle';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/notice/view';
import Notice from '@theme/blocks/notice/View';

export default function InlineNotice({ props, data, active, focus, onChange }: InlineViewProps) {
  const text = String(props.text ?? '');
  return (
    <InlineSingle
      props={props}
      active={active}
      focus={focus}
      fields={['text']}
      onChange={onChange}
      render={({ here, field }) => {
        const view = viewOf(props, data);
        if (!here && text && view)
          return (
            <div
              role="button"
              tabIndex={0}
              aria-label={t.blocks.notice.text}
              className="inline-notice"
              onClick={(e) => {
                e.preventDefault();
                onChange({ active: 0, focus: { row: 0, field: 'text' } });
              }}
              onFocus={() => onChange({ active: 0, focus: { row: 0, field: 'text' } })}
            >
              <Notice view={view} />
            </div>
          );
        return (
          <aside className={['block-notice', 'inline-notice', here ? 'inline-list-row-active' : 'inline-list-row-next'].join(' ')}>
            <p>{field('text', t.blocks.notice.text, t.blocks.notice.placeholder)}</p>
          </aside>
        );
      }}
    />
  );
}
