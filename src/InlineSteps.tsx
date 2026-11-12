// The Steps block typed in place (docs/superpowers/plans/2026-11-12-inline-steps.md): the steps are drawn as the site draws them (the theme's
// StepList markup: ol.block-steps, li.block-step with its number, and the line) and each step's heading and text are typed where they
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
        wrap={(steps) => (
          <ol className="block-steps inline-steps">
            <span className="block-steps-line" aria-hidden="true"></span>
            {steps}
          </ol>
        )}
        renderItem={({ index: i, here, next, field }) => (
          <li
            key={i}
            data-row={i}
            aria-current={here ? 'step' : undefined}
            aria-label={next ? t.blocks.steps.newStep : t.blocks.steps.stepOf(i + 1, items.length)}
            className={['block-step', 'inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next']
              .filter(Boolean)
              .join(' ')}
          >
            <span aria-hidden="true" className="block-step-number">
              {i + 1}
            </span>
            <div className="block-step-body">
              <h3 className="block-step-title">
                {field('title', t.blocks.steps.title, next ? t.blocks.steps.newStep : t.blocks.steps.title)}
              </h3>
              <p className="block-step-text">{field('text', t.blocks.steps.text, t.blocks.steps.text)}</p>
            </div>
          </li>
        )}
      />
    </>
  );
}
