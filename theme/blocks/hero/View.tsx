// "Banner", beside its picture or over it (view.behind: the picture fills the block behind the text), or without one
// (block-hero-plain), across the whole width of the window or as wide as the text (view.full, block-hero-full: on the
// site it reaches out of the text to the window's edges with its content in the page's width; in the editor it is as
// wide as where it is drawn, blocks.css): its own heading (an H2; the page's H1 is the page's), the subtitle and the
// introduction (its text before the buttons: the first paragraph the subtitle), the buttons of its "Knapper" block and
// the text under them, with a quote written in it. Until the buttons scroll into view, a bar at the bottom of a phone's
// screen may show them (data-hero-cta, Base.astro).
import Buttons from '@theme/blocks/buttons/Buttons';
import type { HeroView } from '@morphemecms/cms/src/standard/hero/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Hero({ view }: { view: HeroView }) {
  const { image } = view;
  // The widths the picture is shown in: behind the text the whole block's, beside it a part of it.
  const sizes = view.behind ? (view.full ? '100vw' : '(min-width: 1152px) 1152px, 100vw') : '(min-width: 768px) 40vw, 100vw';
  return (
    <div
      className={useInText('block-hero', view.behind && 'block-hero-behind', !image && 'block-hero-plain', view.full && 'block-hero-full')}
    >
      <div className="block-hero-body">
        {view.heading && <h2 className="block-hero-title">{view.heading}</h2>}
        <div className="block-hero-text" dangerouslySetInnerHTML={{ __html: view.html }} />
        {view.buttons && (
          <div className="block-buttons" data-hero-cta="">
            <Buttons buttons={view.buttons} />
          </div>
        )}
        {view.note && <div className="block-hero-note" dangerouslySetInnerHTML={{ __html: view.note }} />}
      </div>
      {image && (
        <img
          src={image.src}
          srcSet={image.srcset}
          sizes={image.srcset ? sizes : undefined}
          width={image.width}
          height={image.height}
          alt={image.alt}
          fetchPriority="high"
          className="block-hero-picture"
        />
      )}
    </div>
  );
}
