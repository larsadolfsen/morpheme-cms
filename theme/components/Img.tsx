// An image with the sizes the site made of it (imageOf, packages/editor/site/images.mjs), so the browser downloads one that fits
// the screen; in the editor the image itself. `sizes` is the width it is shown in; an image fetched first
// (`fetchPriority` 'high') is not lazy.
import type { Image } from '@morphemecms/cms/src/standard/view';

export default function Img({
  image,
  alt,
  sizes,
  className,
  fetchPriority,
}: {
  image: Image;
  alt: string;
  sizes: string;
  className?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  return (
    <img
      src={image.src}
      srcSet={image.srcset}
      sizes={image.srcset ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={fetchPriority === 'high' ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
    />
  );
}
