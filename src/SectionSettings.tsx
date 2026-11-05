// The settings of a section in the sheet of BlockDialog.tsx: its colour, "None" and the theme's three (section-marker.mjs),
// the one it has marked. Exposes the default SectionSettings; uses Option (ui.tsx), SECTION_COLORS.
import { Option } from './ui';
import { SECTION_COLORS } from '../lib/section-marker.mjs';
import { t } from './i18n';

/** color: the section's colour, '' for none. */
export default function SectionSettings({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  return (
    <div role="group" aria-label={t.text.sectionColor}>
      <Option selected={!color} onClick={() => onChange('')}>
        {t.text.sectionColors.none}
      </Option>
      {SECTION_COLORS.map((name) => (
        <Option key={name} selected={color === name} onClick={() => onChange(name)}>
          {t.text.sectionColors[name as keyof typeof t.text.sectionColors]}
        </Option>
      ))}
    </div>
  );
}
