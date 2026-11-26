// How "Events" looks, on the site and in the editor: each event's title, date and text under each other.
import type { EventsView } from './events';

export default function View({ view }: { view: EventsView }) {
  return (
    <ul className="mo-block-list" data-layout={view.layout}>
      {view.items.map((r, i) => (
        <li key={i} className="row">
          <strong>{r.title}</strong>
          {r.date ? <time dateTime={r.date}>{r.date}</time> : null}
          {r.text ? <p>{r.text}</p> : null}
        </li>
      ))}
    </ul>
  );
}
