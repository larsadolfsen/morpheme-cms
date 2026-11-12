// Numbered steps along a line, each with a heading and a text (.block-steps in ../blocks.css): the standard block
// "Steps", and the site's own steps (this site's front page, home/Steps.astro). `className`: the site's own classes on
// it, e.g. a margin.
import type { Step } from '@morphemecms/cms/src/standard/steps/view';

export default function StepList({ items, className }: { items: Step[]; className?: string }) {
  return (
    <ol className={className ? `block-steps ${className}` : 'block-steps'}>
      <span className="block-steps-line" aria-hidden="true"></span>
      {items.map((s, i) => (
        <li key={i} className="block-step">
          <span aria-hidden="true" className="block-step-number">
            {i + 1}
          </span>
          <div className="block-step-body">
            {s.title && <h3 className="block-step-title">{s.title}</h3>}
            {s.text && <p className="block-step-text">{s.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
