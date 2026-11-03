// A segmented button (m3.material.io/components/segmented-buttons, .segmented-button in ../styles/ui.css): a few
// choices side by side in one frame (`segments`), each a button with its label and evt. an icon, the chosen ones with
// aria-pressed="true" and a check before the label (in the icon's place when it has one; the theme shows it or not).
// Single-select (one chosen) or multi-select (`multiple`: any of them, data-multiple); the group has its name (`label`,
// read by screen readers). Which one is chosen, and what that does, is the script of the block that shows it (by a
// segment's `value`, data-value), or, in the editor, the segment's own attributes (onClick), which go on its button.
// Other attributes (data-…) go on the group, and `className` after its own class. An
// Astro component gives its elements the same classes with segmentedButtonClass and segmentedButtonSegmentClass.
import { Glyph, Svg, type IconRef } from '@morpheme/cms/src/icon';

export type Segment = { label: string; icon?: IconRef; value?: string; selected?: boolean; disabled?: boolean } & Record<string, unknown>;

/** A segmented button's class, and its segments'. */
export const segmentedButtonClass = 'segmented-button';
export const segmentedButtonSegmentClass = 'segmented-button-segment';

export default function SegmentedButton({
  label,
  segments,
  multiple,
  className,
  ...rest
}: { label: string; segments: Segment[]; multiple?: boolean; className?: string } & Record<string, unknown>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={[segmentedButtonClass, className].filter(Boolean).join(' ')}
      data-multiple={multiple || undefined}
      {...rest}
    >
      {segments.map(({ label: name, icon, value, selected, disabled, ...own }) => (
        <button
          key={value ?? name}
          type="button"
          className={segmentedButtonSegmentClass}
          aria-pressed={Boolean(selected)}
          disabled={disabled}
          data-value={value}
          {...own}
        >
          <Svg name="check" size={18} className="segmented-button-check" />
          {icon && <Glyph icon={icon} size={18} className="segmented-button-icon" />}
          <span className="segmented-button-label">{name}</span>
        </button>
      ))}
    </div>
  );
}
