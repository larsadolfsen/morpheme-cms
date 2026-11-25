// The settings of a section in the sheet of BlockDialog.tsx: its colour ("None" and the theme's four, section-marker.mjs), for an H2
// the image behind it and the image's description, and for an H1 or H2 its width (the whole window or the text's). A page's H1 has no
// image (owner, 14 Nov 2026). Exposes the default SectionSettings and
// SectionValues; uses Option (ui.tsx), FieldList (fields.tsx), SECTION_COLORS.
import { FieldList } from './fields';
import type { Field } from './schema';
import { Option } from './ui';
import { SECTION_COLORS } from '../lib/section-marker.mjs';
import { t } from './i18n';
import { materialIcon } from './icon';

/** A section's settings as the sheet holds them: color '' for none, image '' for none, width 'full' or ''. */
export type SectionValues = { color: string; image: string; alt: string; width: string };

const IMAGE: Field = { name: 'image', label: t.text.sectionImage, type: 'image' };
const ALT: Field = { name: 'alt', label: t.text.sectionImageAlt, type: 'string', hint: t.text.sectionImageAltHint, libraryText: 'image' };
const WIDTH: Field = {
  name: 'width',
  label: t.text.sectionWidth,
  type: 'select',
  segments: true,
  options: [
    { label: t.text.sectionWidthText, value: '', icon: materialIcon('compress') },
    { label: t.text.sectionWidthFull, value: 'full', icon: materialIcon('expand') },
  ],
};

/** image: whether the section can have an image and its description (an H2's); width: whether it can have a width (an H1's or H2's). */
export default function SectionSettings({
  values,
  image,
  width,
  onChange,
}: {
  values: SectionValues;
  image: boolean;
  width: boolean;
  onChange: (values: SectionValues) => void;
}) {
  const fields = [...(image ? (values.image ? [IMAGE, ALT] : [IMAGE]) : []), ...(width ? [WIDTH] : [])];
  const { color } = values;
  return (
    <div className="mo-editor-stack-250">
      <ul role="group" aria-label={t.text.sectionColor}>
        <Option selected={!color} onClick={() => onChange({ ...values, color: '' })}>
          {t.text.sectionColors.none}
        </Option>
        {SECTION_COLORS.map((name) => (
          <Option key={name} selected={color === name} onClick={() => onChange({ ...values, color: name })}>
            {t.text.sectionColors[name as keyof typeof t.text.sectionColors]}
          </Option>
        ))}
      </ul>
      {fields.length > 0 && (
        <FieldList
          fields={fields}
          value={values}
          onChange={(next) => {
            const v = next as SectionValues;
            // Without an image the description is gone too.
            onChange(v.image ? v : { ...v, alt: '' });
          }}
        />
      )}
    </div>
  );
}
