// The Segmented list typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md): the rows are drawn as the site draws
// them, folded (the theme's rows that fold out, as in Accordion.tsx) or, for a list whose rows are always open (`show` 'all'), each on its own
// surface (the theme's segmented list), and each row's heading and text are typed where they stand. The active row is shown open, so its text can
// be typed; the others are closed, as on the site. A row's icon and its page and buttons are not typed: the active row has two slots, the icon (its
// picker) and the link (its sheet, which has the page and the buttons). The block's own settings (`Only one open`, `Rows`, `Max rows`, the text
// button) are in Edit. The parts, the keys and what is kept are InlineItems.tsx and src/inlineRows.mjs; the empty, faded row, `Add row` and the dotted
// line are as in the List. A Segmented list that reads a list ("Rows from") is drawn by RowsFromList (InlineList.tsx), not typed.
import { LinkSimple, Plus } from '@phosphor-icons/react';
import { Glyph, Svg } from './icon';
import { t } from './i18n';
import { SiteList, SiteListItem } from './themeUi';
import InlineItems, { InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';

export default function InlineSegmented({ items, props, active, focus, onChange, onSettings, onIcon }: InlineViewProps) {
  const all = props.show === 'all';
  const twoLines = active !== null || items.some((r) => r.text);
  const slots = (i: number, icon?: string) => (
    <>
      <InlineSlot label={t.blocks.segmented.icon} onClick={() => onIcon(i)}>
        {icon ? <Glyph icon={icon} size={24} /> : <Plus size={24} />}
      </InlineSlot>
      <InlineSlot label={t.blocks.segmented.link} onClick={() => onSettings(i)}>
        <LinkSimple size={24} />
      </InlineSlot>
    </>
  );
  return (
    <InlineItems
      items={items}
      active={active}
      focus={focus}
      fields={['title', 'text']}
      add={t.blocks.segmented.addRow}
      onChange={onChange}
      wrap={(rows) =>
        all ? (
          <SiteList kind="segmented" className="block-list inline-list">
            {rows}
          </SiteList>
        ) : (
          <div className="block-accordion inline-segmented">{rows}</div>
        )
      }
      renderItem={({ item, index: i, here, next, field }) => {
        const label = next ? t.blocks.segmented.newRow : t.blocks.segmented.rowOf(i + 1, items.length);
        const classes = ['inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next'].filter(Boolean).join(' ');
        const title = field('title', t.blocks.segmented.title, next ? t.blocks.segmented.newRow : t.blocks.segmented.title);
        const text = field('text', t.blocks.segmented.text, t.blocks.segmented.text);
        if (all)
          return (
            <SiteListItem
              key={i}
              data-row={i}
              aria-current={here ? 'true' : undefined}
              aria-label={label}
              className={classes}
              leading={here ? <span className="inline-segmented-slots">{slots(i, item.icon)}</span> : undefined}
              leadingIcon={here ? undefined : item.icon || undefined}
              headline={title}
              supporting={twoLines ? text : undefined}
              trailingIcon={here || !item.href ? undefined : 'caret-right'}
            />
          );
        // Open while it is the active row (a tap on the summary does not fold it: the heading is typed there).
        return (
          <details
            key={i}
            data-row={i}
            open={here}
            aria-current={here ? 'true' : undefined}
            aria-label={label}
            className={`block-accordion-row ${classes}`}
          >
            <summary className="block-accordion-label" onClick={(e) => e.preventDefault()}>
              {here ? (
                <span className="inline-segmented-slots">{slots(i, item.icon)}</span>
              ) : (
                item.icon && <Svg name={item.icon} size={24} className="block-accordion-lead" />
              )}
              <span className="block-accordion-title">{title}</span>
              <Svg name="caret-down" size={20} className="block-accordion-icon" />
            </summary>
            <div className="block-accordion-body">
              <div className="block-accordion-answer">{text}</div>
            </div>
          </details>
        );
      }}
    />
  );
}
