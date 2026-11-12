// The settings of a section in the sheet of BlockDialog.tsx: its colour ("None" and the theme's four, section-marker.mjs), and for an H2
// the image behind it, the image's description and its width (the whole window or the text's). Exposes the default SectionSettings and
// SectionValues; uses Option (ui.tsx), FieldList (fields.tsx), SECTION_COLORS.
import { ArrowsInLineHorizontal, ArrowsOutLineHorizontal } from '@phosphor-icons/react';
import { FieldList } from './fields';
import type { Field } from './schema';
import { Option } from './ui';
import { SECTION_COLORS } from '../lib/section-marker.mjs';
import { t } from './i18n';

/** A section's settings as the sheet holds them: color '' for none, image '' for none, width 'full' or ''. */
export type SectionValues = { color: string; image: string; alt: string; width: string };

const IMAGE: Field = { name: 'image', label: t.text.sectionImage, type: 'image' };
const ALT: Field = { name: 'alt', label: t.text.sectionImageAlt, type: 'string', hint: t.text.sectionImageAltHint };
const WIDTH: Field = {
  name: 'width',
  label: t.text.sectionWidth,
  type: 'select',
  segments: true,
  options: [
    { label: t.text.sectionWidthText, value: '', icon: ArrowsInLineHorizontal },
    { label: t.text.sectionWidthFull, value: 'full', icon: ArrowsOutLineHorizontal },
  ],
};

/** image: whether the section can have an image and a width (any H1's or H2's). */
export default function SectionSettings({
  values,
  image,
  onChange,
}: {
  values: SectionValues;
  image: boolean;
  onChange: (values: SectionValues) => void;
}) {
  const { color } = values;
  return (
    <div className="space-y-5">
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
      {image && (
        <FieldList
          fields={values.image ? [IMAGE, ALT, WIDTH] : [IMAGE, WIDTH]}
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
