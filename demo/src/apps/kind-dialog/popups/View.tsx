// A promotion kind of the demo's app "kind-dialog": plain class names, scoped to the app (contract 8).
import './kind.css';

export default function View({ view, button }: { view: { note: string }; button: unknown }) {
  return (
    // The outer element carries the app's scope (data-mo-app), so the app's rules style what is inside it.
    <section>
      <div className="kind-box">
        <p className="kind-note">{view.note}</p>
      </div>
      {button as never}
    </section>
  );
}
