// A person (.mo-block-person in ../styles/blocks.css): their image, small, beside their name and their role, at the top of
// an app's box (@theme/blocks/Person). A theme draws it its own way with its own blocks/Person.tsx, with the same props.
// The image with the sizes the site made of it (imageOf, packages/editor/site/images.mjs); in the editor the image itself.
import type { Image } from '@morphemecms/cms/src/standard/view';

export default function Person({ image, name, role }: { image: Image; name: string; role?: string }) {
  return (
    <div className="mo-block-person">
      <img
        src={image.src}
        srcSet={image.srcset}
        sizes={image.srcset ? '56px' : undefined}
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="mo-block-person__picture"
      />
      <p>
        <span className="mo-block-person__name">{name}</span>
        <span className="mo-block-person__role">{role}</span>
      </p>
    </div>
  );
}
