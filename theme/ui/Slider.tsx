// A slider (m3.material.io/components/sliders, .slider in ../styles/ui.css): a value chosen between `min` and `max`
// (`value`; the standard slider, its active track from the start), in steps of `step` with a stop at each (`stops`),
// from the middle (`centered`: the active track from the middle to the handle, for a value below and above a middle
// one), or a range (`range`, its start and end, with two handles that cannot pass each other; `handleLabels` says what
// each is to a screen reader). Its size (`size`: xsmall, the default, small, medium, large or xlarge, as M3 Expressive
// names them: how thick the track is) and its direction (`orientation`: horizontal, the default, or vertical, from
// the bottom up) are Material's names; how they look is the theme's. A standard slider of size medium or larger can
// have an icon in its track (`icon`, the theme's icon by its name: in the active track at its start, after the
// handle while there is no room for it there). Its name (`label`) stands over it (`hideLabel`: only screen readers say
// it), and a label with the value over a handle while it is moved or has the focus (`valueLabel`; 'always': all the
// time). The handles are native range inputs, so the keyboard moves them (the arrow keys, Home, End, Page Up and Page
// Down) and screen readers say the value; the active track, the stops and the value labels follow them on the site
// with slider.script.ts and in the editor here (both with updateSlider in sliderUpdate.ts). `onChange` (the editor): the value is the editor's, and a
// handle moved gives its new value (and which handle, 0 or 1); else the value is the one it starts with. `disabled`: it
// cannot be moved; `name` is the input's (a range's: one for each); `className` goes after its own classes. An Astro component
// gives an element the same classes with sliderClass.
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import { Svg } from '@interstellarcms/cms/src/icon';
import { sliderPlace, stopState, updateSlider } from './sliderUpdate';

/** A slider's sizes, as M3 Expressive names them. */
export type SliderSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type SliderOrientation = 'horizontal' | 'vertical';

/** A slider's classes: a range, `slider-range`; centered, `slider-centered`; its size but the default; vertical. */
export const sliderClass = (range = false, size: SliderSize = 'xsmall', centered = false, orientation: SliderOrientation = 'horizontal') =>
  [
    'slider',
    range && 'slider-range',
    centered && !range && 'slider-centered',
    size !== 'xsmall' && `slider-${size}`,
    orientation === 'vertical' && 'slider-vertical',
  ]
    .filter(Boolean)
    .join(' ');

export default function Slider({
  label,
  hideLabel,
  min = 0,
  max = 100,
  step = 1,
  value,
  range,
  centered,
  handleLabels,
  stops,
  size = 'xsmall',
  orientation = 'horizontal',
  icon,
  valueLabel,
  disabled,
  name,
  onChange,
  className,
}: {
  label: string;
  hideLabel?: boolean;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  range?: [number, number];
  centered?: boolean;
  handleLabels?: [string, string];
  stops?: boolean;
  size?: SliderSize;
  orientation?: SliderOrientation;
  icon?: string;
  valueLabel?: boolean | 'always';
  disabled?: boolean;
  name?: string | [string, string];
  onChange?: (value: number, handle: number) => void;
  className?: string;
}) {
  const middle = centered && !range;
  const values = range ?? [value ?? (middle ? (min + max) / 2 : min)];
  const { start, end } = sliderPlace(values, min, max, middle);
  const count = Math.round((max - min) / step);
  // A stop at each step, when there are not so many that they run together.
  const stopValues = stops && count > 0 && count <= 50 ? Array.from({ length: count + 1 }, (_, i) => min + i * step) : [];
  // The icon only in a standard slider's track, and only where the track is thick enough to hold it.
  const inset = icon && !range && !middle && ['medium', 'large', 'xlarge'].includes(size) ? icon : undefined;
  const vertical = orientation === 'vertical';
  const place = { '--slider-start': start, '--slider-end': end } as CSSProperties;
  return (
    <div
      className={[sliderClass(Boolean(range), size, middle, orientation), className].filter(Boolean).join(' ')}
      style={place}
      role={range ? 'group' : undefined}
      aria-label={range ? label : undefined}
      data-slider=""
      data-start-on-top={range && start > 0.5 ? '' : undefined}
      data-below-center={middle && values[0] < (min + max) / 2 ? '' : undefined}
      onInput={(e: FormEvent<HTMLDivElement>) => updateSlider(e.currentTarget, e.target)}
    >
      {!hideLabel && (
        <span className="slider-label" aria-hidden="true">
          {label}
        </span>
      )}
      <div className="slider-control">
        <span className="slider-track" aria-hidden="true">
          {(range || middle) && <span className="slider-inactive-track slider-inactive-track-start" />}
          <span className="slider-active-track">
            {inset && <Svg name={inset} size={24} className="slider-icon" />}
            {inset && <Svg name={inset} size={24} className="slider-icon slider-icon-inactive" />}
          </span>
          <span className="slider-inactive-track slider-inactive-track-end" />
          {stopValues.map((v) => {
            const { active, under } = stopState(v, values, min, max, middle);
            return (
              <span
                key={v}
                className="slider-stop"
                style={{ '--slider-stop': (v - min) / (max - min) } as CSSProperties}
                data-slider-stop={v}
                data-active={active ? '' : undefined}
                data-under={under ? '' : undefined}
              />
            );
          })}
        </span>
        {values.map((v, i) => [
          <input
            key={`input-${i}`}
            type="range"
            className="slider-input"
            min={min}
            max={max}
            step={step}
            {...(onChange
              ? { value: v, onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value), i) }
              : { defaultValue: v })}
            disabled={disabled}
            name={Array.isArray(name) ? name[i] : name}
            aria-label={range ? (handleLabels?.[i] ?? label) : label}
            aria-orientation={vertical ? 'vertical' : undefined}
            data-slider-input=""
          />,
          valueLabel && (
            <output
              key={`value-${i}`}
              className={valueLabel === 'always' ? 'slider-value slider-value-always' : 'slider-value'}
              aria-hidden="true"
              data-slider-value=""
            >
              {v}
            </output>
          ),
        ])}
      </div>
    </div>
  );
}
