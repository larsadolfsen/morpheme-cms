// The FAQ list typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md): the rows are drawn as the site draws them (the
// theme's Accordion: the same markup as blocks/faq/Accordion.tsx). The question is typed in the summary line and the answer in the open panel;
// the active question is shown open and the others closed, whatever `Only one open` says (that is a setting of the block, in Edit). The answer
// is plain text here: what is typed is saved as it is, so an answer written with markdown keeps it (Shift+Enter makes a new line; Enter in the
// answer adds the next question). The parts, the keys and what is kept are InlineItems.tsx and src/inlineRows.mjs. The head is drawn as the site draws it when it is filled in and is set in Edit. The text button under the list is typed in a
// field under `Add question` while the block is active (empty: none) and its page is picked in the link slot (Edit).
import { LinkSimple } from '@phosphor-icons/react';
import { t } from './i18n';
import InlineItems, { InlineField, InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { faqSettings } from './standard/faq/view';
import { headOf } from './standard/head';
import BlockHead from '@theme/blocks/BlockHead';
import ListButton from '@theme/blocks/ListButton';
import List, { ListItem } from '@theme/ui/List';

export default function InlineFaq({ items, props, active, focus, onChange, onProps, onEdit }: InlineViewProps) {
  const head = headOf(props);
  const button = faqSettings(props).button;
  return (
    <>
      <BlockHead view={head} />
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['question', 'answer']}
        add={t.blocks.faq.addQuestion}
        onChange={onChange}
        wrap={(rows) => (
          <List expand className="block-accordion">
            {rows}
          </List>
        )}
        renderItem={({ index: i, here, next, field }) => (
          // The question is typed, so the summary does not fold: the active question is the open one.
          <ListItem
            key={i}
            expand
            expandOpen={here}
            expandProps={{
              'data-row': i,
              'aria-current': here ? 'true' : undefined,
              'aria-label': next ? t.blocks.faq.newQuestion : t.blocks.faq.questionOf(i + 1, items.length),
              className: ['inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next'].filter(Boolean).join(' '),
            }}
            onClick={(e) => e.preventDefault()}
            headline={field('question', t.blocks.faq.question, next ? t.blocks.faq.newQuestion : t.blocks.faq.question)}
          >
            {here && <div className="block-accordion-answer">{field('answer', t.blocks.faq.answer, t.blocks.faq.answer)}</div>}
          </ListItem>
        )}
      />
      {/* While the block is active the button under the list is typed where it stands (empty: no button) and its page is picked in a slot
          (Edit); else it is drawn as the site draws it. */}
      {active !== null && items.length > 0 ? (
        <div className="block-list-button inline-faq-button">
          <InlineField
            name="button"
            value={typeof props.button === 'string' ? props.button : ''}
            label={t.blocks.faq.button}
            placeholder={t.blocks.faq.buttonPlaceholder}
            onType={(v) => onProps({ button: v.replace(/\n/g, ' ').slice(0, 30) })}
            onFocus={() => {}}
            onKeys={(e) => e.key === 'Enter' && e.preventDefault()}
          />
          {onEdit && (
            <InlineSlot label={t.blocks.faq.buttonHref} onClick={onEdit}>
              <LinkSimple size={24} />
            </InlineSlot>
          )}
        </div>
      ) : (
        <ListButton button={button} />
      )}
    </>
  );
}
