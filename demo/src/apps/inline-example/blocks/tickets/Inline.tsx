// "Tickets" typed in place: the same rows as View.tsx, with the heading and the text typed where they stand. Built on the shared parts an
// app imports from `@morphemecms/cms/src/inline`.
import { InlineItems, type InlineViewProps } from '@morphemecms/cms/src/inline';

export default function Inline({ items, active, focus, onChange }: InlineViewProps) {
  return (
    <InlineItems
      items={items}
      active={active}
      focus={focus}
      fields={['title', 'text']}
      add="Add ticket"
      onChange={onChange}
      wrap={(rows) => <ul className="block-list inline-list">{rows}</ul>}
      renderItem={({ index: i, here, next, field }) => (
        <li
          key={i}
          data-row={i}
          aria-current={here ? 'true' : undefined}
          aria-label={next ? 'New ticket' : `Ticket ${i + 1} of ${items.length}`}
          className={['block-tickets-row', 'inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next']
            .filter(Boolean)
            .join(' ')}
        >
          <strong>{field('title', 'Heading', next ? 'New ticket' : 'Heading')}</strong>
          {here || items[i]?.text ? <p>{field('text', 'Text', 'Text')}</p> : null}
        </li>
      )}
    />
  );
}
