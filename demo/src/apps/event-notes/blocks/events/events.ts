// What "Events" shows: the rows that have a title, and the layout the block picked.
export type EventsView = { layout: string; items: { title: string; date?: string; text?: string }[] };

export const eventsOf = (props: Record<string, any>): EventsView => ({
  layout: props.layout === 'cards' ? 'cards' : 'list',
  items: ((props.items ?? []) as { title?: string; date?: string; text?: string }[]).flatMap((r) =>
    r.title?.trim() ? [{ title: r.title, date: r.date, text: r.text }] : [],
  ),
});
