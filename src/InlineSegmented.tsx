// The Segmented list typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md): the rows are drawn as the site draws
// them, folded (the theme's rows that fold out, as in Accordion.tsx) or, for a list whose rows are always open (`show` 'all'), each on its own
// surface (the theme's segmented list), and each row's heading and text are typed where they stand. The active row is shown open, so its text can
// be typed; the others are closed, as on the site. A row's icon and its page and buttons are not typed: the active row has two slots, the icon (its
// picker); the row's page and its one button are at the bottom of the active row, where the site draws them (`Link` opens the row's sheet, the button's text is typed). The block's own settings (`Only one open`, `Rows`, `Max rows`, the text
// button) are in Edit. The parts, the keys and what is kept are InlineItems.tsx and src/inlineRows.mjs; the empty, faded row, `Add row` and the dotted
// line are as in the List. A Segmented list that reads a list ("Rows from") is drawn by RowsFromList (InlineList.tsx), not typed.
import { Svg } from './icon';
import { iconColorOf } from './iconColor';
import { t } from './i18n';
import { SiteList, SiteListItem } from './themeUi';
import InlineItems, { InlineField, InlineIcon, InlineSlot, type Item } from './InlineItems';
import { SiteButton } from './themeUi';
import type { InlineViewProps } from './inlineViews';

/** A row has at most one text button (its `buttons` field, `maxItems`); extra ones from before show and can be deleted. */
export const maxButtons = 1;

export default function InlineSegmented({ items, props, active, focus, onChange, onSettings, onIcon }: InlineViewProps) {
  const all = props.show === 'all';
  const twoLines = active !== null || items.some((r) => r.text);
  const slots = (i: number, icon?: string) => (
    <>
      <InlineIcon label={t.blocks.segmented.icon} icon={icon} here onClick={() => onIcon(i)} />
    </>
  );
  // The active row's buttons at the bottom of its text: each button's text is typed where it stands (its page is in the row's sheet, the link
  // slot); `Add button` adds one, Backspace in an empty one drops it.
  const buttonsOf = (i: number, row: Item) => {
    const list = (Array.isArray(row.buttons) ? row.buttons : []) as { label?: string; href?: string }[];
    const set = (buttons: typeof list, focus?: number) =>
      onChange({
        items: items.map((r, j) => (j === i ? (buttons.length ? { ...r, buttons } : (({ buttons: _, ...rest }) => rest)(r)) : r)),
        active: i,
        focus: focus === undefined ? null : { row: i, field: `button-${focus}` },
      });
    return (
      <div className="block-row-links inline-segmented-buttons">
        <SiteButton kind="text" data-row-link="" aria-label={t.blocks.segmented.link} onClick={() => onSettings(i)}>
          {t.blocks.segmented.link}
        </SiteButton>
        {list.map((b, n) => (
          <span key={n} className="inline-segmented-button">
            <InlineField
              name={`button-${n}`}
              value={b.label ?? ''}
              label={t.blocks.segmented.buttonText}
              placeholder={t.blocks.segmented.buttonText}
              onType={(v) => set(list.map((x, m) => (m === n ? { ...x, label: v } : x)))}
              onFocus={() => {}}
              onKeys={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (b.label?.trim() && list.length < maxButtons)
                    set([...list.slice(0, n + 1), { label: '', href: '' }, ...list.slice(n + 1)], n + 1);
                }
                if (e.key === 'Backspace' && !b.label) {
                  e.preventDefault();
                  set(
                    list.filter((_, m) => m !== n),
                    Math.max(0, n - 1),
                  );
                }
              }}
            />
          </span>
        ))}
        {list.length < maxButtons && (
          <SiteButton kind="text" data-add-button="" onClick={() => set([...list, { label: '', href: '' }], list.length)}>
            {t.blocks.segmented.addButton}
          </SiteButton>
        )}
      </div>
    );
  };
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
              leading={
                here ? (
                  <span className="inline-segmented-slots">{slots(i, item.icon)}</span>
                ) : (
                  <InlineIcon
                    label={t.blocks.segmented.icon}
                    icon={item.icon}
                    here={false}
                    iconColor={item.icon ? iconColorOf(item.iconColor) : undefined}
                    onClick={() => onIcon(i)}
                  />
                )
              }
              data-icon-color={item.icon ? iconColorOf(item.iconColor) : undefined}
              headline={title}
              supporting={
                twoLines ? (
                  here ? (
                    <>
                      {text}
                      {buttonsOf(i, item)}
                    </>
                  ) : (
                    text
                  )
                ) : undefined
              }
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
                <InlineIcon
                  label={t.blocks.segmented.icon}
                  icon={item.icon}
                  here={false}
                  iconColor={item.icon ? iconColorOf(item.iconColor) : undefined}
                  onClick={() => onIcon(i)}
                />
              )}
              <span className="block-accordion-title">{title}</span>
              <Svg name="caret-down" size={20} className="block-accordion-icon" />
            </summary>
            <div className="block-accordion-body">
              <div className="block-accordion-answer">{text}</div>
              {here && buttonsOf(i, item)}
            </div>
          </details>
        );
      }}
    />
  );
}
