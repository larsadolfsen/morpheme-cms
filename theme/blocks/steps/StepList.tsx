// Numbered steps along a line, each with a heading and a text (.mo-block-steps in ../blocks.css): the standard block
// "Steps", and the site's own steps (this site's front page, home/Steps.astro). `className`: the site's own classes on
// it, e.g. a margin.
import type { Step } from '@morphemecms/cms/src/standard/steps/view';

export default function StepList({ items, className }: { items: Step[]; className?: string }) {
  return (
    <ol className={className ? `mo-block-steps ${className}` : 'mo-block-steps'}>
      {items.map((s, i) => (
        <li key={i} className="mo-block-steps__step">
          <span aria-hidden="true" className="mo-block-steps__step-number">
            {i + 1}
          </span>
          <div className="mo-block-steps__step-body">
            {s.title && <h3 className="mo-block-steps__step-title">{s.title}</h3>}
            {s.text && <p className="mo-block-steps__step-text">{s.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
