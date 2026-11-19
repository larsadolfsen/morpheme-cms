// The Steps block typed in place (docs/superpowers/plans/2026-11-12-inline-steps.md): the steps are drawn as the site draws them (the theme's
// StepList markup: ol.mo-block-steps, li.mo-block-steps__step with its number, and the line) and each step's heading and text are typed where they
// stand. A step has nothing else to pick, so there is no slot and no sheet; the numbers are the steps' places (the first is 1). An old
// Steps with a heading or subheading over it keeps showing them (the site does). The parts, the keys and what is kept are InlineItems.tsx
// and src/inlineRows.mjs; the empty, faded step, `Add step` and the dotted line are as in the List.
import { t } from './i18n';
import InlineItems from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { headOf } from './standard/head';
import BlockHead from '@theme/blocks/BlockHead';

export default function InlineSteps({ items, props, active, focus, onChange }: InlineViewProps) {
  return (
    <>
      <BlockHead view={headOf(props)} />
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['title', 'text']}
        add={t.blocks.steps.addStep}
        onChange={onChange}
        paste
        wrap={(steps) => <ol className="mo-block-steps mo-editor-inline-steps">{steps}</ol>}
        renderItem={({ index: i, here, next, field }) => (
          <li
            key={i}
            data-row={i}
            aria-current={here ? 'step' : undefined}
            aria-label={next ? t.blocks.steps.newStep : t.blocks.steps.stepOf(i + 1, items.length)}
            className={[
              'mo-block-steps__step',
              'mo-editor-inline-list-row',
              here && 'mo-editor-inline-list-row-active',
              next && 'mo-editor-inline-list-row-next',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span aria-hidden="true" className="mo-block-steps__step-number">
              {i + 1}
            </span>
            <div className="mo-block-steps__step-body">
              <h3 className="mo-block-steps__step-title">
                {field('title', t.blocks.steps.title, next ? t.blocks.steps.newStep : t.blocks.steps.title)}
              </h3>
              <p className="mo-block-steps__step-text">{field('text', t.blocks.steps.text, t.blocks.steps.text)}</p>
            </div>
          </li>
        )}
      />
    </>
  );
}
