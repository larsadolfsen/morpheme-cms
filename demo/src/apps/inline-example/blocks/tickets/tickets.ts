// What "Tickets" shows: the rows that have a heading.
export type TicketsView = { items: { title: string; text?: string }[] };

export const ticketsOf = (props: Record<string, any>): TicketsView => ({
  items: ((props.items ?? []) as { title?: string; text?: string }[]).flatMap((r) =>
    r.title?.trim() ? [{ title: r.title, text: r.text }] : [],
  ),
});
