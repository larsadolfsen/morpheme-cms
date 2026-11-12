// How "Tickets" looks, on the site and in the editor: each row's heading and text, under each other.
import type { TicketsView } from './tickets';

export default function View({ view }: { view: TicketsView }) {
  return (
    <ul className="block-list">
      {view.items.map((r, i) => (
        <li key={i} className="block-tickets-row">
          <strong>{r.title}</strong>
          {r.text ? <p>{r.text}</p> : null}
        </li>
      ))}
    </ul>
  );
}
