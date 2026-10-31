import type { UnsplashImageView } from './view';

export default function UnsplashImageViewComponent({ view }: { view: UnsplashImageView }) {
  if (!view) return null;

  const aspectClass =
    view.aspect === '16/9'
      ? 'aspect-video'
      : view.aspect === '4/3'
        ? 'aspect-4/3'
        : view.aspect === '1/1'
          ? 'aspect-square'
          : view.aspect === '3/4'
            ? 'aspect-3/4'
            : '';

  return (
    <figure
      className={`my-8 overflow-hidden rounded-2xl border border-line bg-surface-container-low transition-shadow duration-(--motion-spatial-duration) hover:shadow-md ${
        view.fullWidth ? 'w-full max-w-none' : 'mx-auto max-w-4xl'
      }`}
    >
      <div className={`relative overflow-hidden bg-surface-container ${aspectClass}`}>
        <img
          src={view.src}
          alt={view.alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-(--motion-spatial-duration) ease-(--motion-ease)"
        />
      </div>

      {(view.caption || view.photographer) && (
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 px-4 py-2.5 text-xs text-muted">
          {view.caption ? <span className="font-medium text-on-surface">{view.caption}</span> : <span />}
          <span className="ml-auto inline-flex items-center gap-1 text-muted">
            <span>Photo by</span>
            {view.photographerUrl ? (
              <a
                href={view.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                {view.photographer || 'Unsplash'}
              </a>
            ) : (
              <span className="font-medium text-on-surface">{view.photographer || 'Unsplash'}</span>
            )}
            <span>on</span>
            <a
              href={view.unsplashUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Unsplash
            </a>
          </span>
        </figcaption>
      )}
    </figure>
  );
}
