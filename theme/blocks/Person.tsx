// A person (.block-person in ../styles/blocks.css): their picture, small, beside their name and their role, at the top of
// an app's box (@theme/blocks/Person). A theme draws it its own way with its own blocks/Person.tsx, with the same props.
// The picture with the sizes the site made of it (pictureOf, packages/editor/site/images.mjs); in the editor the picture itself.
import type { Picture } from '@morphemecms/cms/src/standard/view';

export default function Person({ picture, name, role }: { picture: Picture; name: string; role?: string }) {
  return (
    <div className="block-person">
      <img
        src={picture.src}
        srcSet={picture.srcset}
        sizes={picture.srcset ? '56px' : undefined}
        width={picture.width}
        height={picture.height}
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
