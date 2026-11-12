// The settings of a section in the sheet of BlockDialog.tsx: its colour ("None" and the theme's four, section-marker.mjs), and for an H2
// the picture behind it, the picture's description and its width (the whole window or the text's). Exposes the default SectionSettings and
// SectionValues; uses Option (ui.tsx), FieldList (fields.tsx), SECTION_COLORS.
import { ArrowsInLineHorizontal, ArrowsOutLineHorizontal } from '@phosphor-icons/react';
import { FieldList } from './fields';
import type { Field } from './schema';
import { Option } from './ui';
import { SECTION_COLORS } from '../lib/section-marker.mjs';
import { t } from './i18n';

/** A section's settings as the sheet holds them: color '' for none, picture '' for none, width 'full' or ''. */
export type SectionValues = { color: string; picture: string; alt: string; width: string };

const PICTURE: Field = { name: 'picture', label: t.text.sectionPicture, type: 'image' };
const ALT: Field = { name: 'alt', label: t.text.sectionPictureAlt, type: 'string', hint: t.text.sectionPictureAltHint };
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

/** picture: whether the section can have a picture and a width (any H1's or H2's). */
export default function SectionSettings({
  values,
  picture,
  onChange,
}: {
  values: SectionValues;
  picture: boolean;
  onChange: (values: SectionValues) => void;
}) {
  const { color } = values;
  return (
    <div className="space-y-5">
      <div role="group" aria-label={t.text.sectionColor}>
        <Option selected={!color} onClick={() => onChange({ ...values, color: '' })}>
          {t.text.sectionColors.none}
        </Option>
        {SECTION_COLORS.map((name) => (
          <Option key={name} selected={color === name} onClick={() => onChange({ ...values, color: name })}>
            {t.text.sectionColors[name as keyof typeof t.text.sectionColors]}
          </Option>
        ))}
      </div>
      {picture && (
        <FieldList
          fields={values.picture ? [PICTURE, ALT, WIDTH] : [PICTURE, WIDTH]}
          value={values}
          onChange={(next) => {
            const v = next as SectionValues;
            // Without a picture the description is gone too.
            onChange(v.picture ? v : { ...v, alt: '' });
          }}
        />
      )}
    </div>
  );
}
