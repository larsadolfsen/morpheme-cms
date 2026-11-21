// The Notice block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, "Single blocks"): the notice is drawn as the site
// draws it (the theme's Notice) and its text is typed in it, as markdown (bold, italic and links as written). While it is typed in, the
// notice shows its text as written; otherwise as the site draws it, and a tap puts the cursor in it. `Show until` stays in the sheet (the
// settings of the block's toolbar, and the side panel from expanded). A block with no list: InlineSingle.tsx, not InlineItems.
import { t } from './i18n';
import InlineSingle from './InlineSingle';
import type { InlineViewProps } from './inlineViews';
import { viewOf } from './standard/notice/view';
import Notice from '@theme/blocks/notice/View';
import { cardClass } from '@theme/ui/Card';

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
              // Named by the notice's text (what is shown, WCAG 2.5.3); the field's name is its description. Written out because the
              // notice's own `aside` inside a button gives a reader no name from its content.
              aria-label={new DOMParser().parseFromString(view.html, 'text/html').body.textContent?.trim() || t.blocks.notice.text}
              aria-description={t.blocks.notice.text}
              className="mo-editor-inline-notice"
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
          <aside
            className={[
              cardClass('filled'),
              'mo-block-notice',
              'mo-editor-inline-notice',
              here ? 'mo-editor-inline-list-row-active' : 'mo-editor-inline-list-row-next',
            ].join(' ')}
          >
            <p>{field('text', t.blocks.notice.text, t.blocks.notice.placeholder)}</p>
          </aside>
        );
      }}
    />
  );
}
