// A person (.block-person in ../styles/blocks.css): their image, small, beside their name and their role, at the top of
// an app's box (@theme/blocks/Person). A theme draws it its own way with its own blocks/Person.tsx, with the same props.
// The image with the sizes the site made of it (imageOf, packages/editor/site/images.mjs); in the editor the image itself.
import type { Image } from '@morphemecms/cms/src/standard/view';

export default function Person({ image, name, role }: { image: Image; name: string; role?: string }) {
  return (
    <div className="block-person">
      <img
        src={image.src}
        srcSet={image.srcset}
        sizes={image.srcset ? '56px' : undefined}
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="block-person-picture"
      />
      <p>
        <span className="block-person-name">{name}</span>
        <span className="block-person-role">{role}</span>
      </p>
    </div>
  );
}
