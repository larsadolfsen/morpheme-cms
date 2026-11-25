// A scroll field (m3.material.io/components/scroll-fields, .mo-scroll-field in ../styles/ui/scroll-field.css): a list of numbers or texts one under the other, the one in
// the middle the selected one, that is swiped, dragged, tapped or moved with the keys (scrollFieldControl.ts), or, in the input `mode`, a text field to type the value in.
// `items`, `value`, `size` (small, medium or large; else by the longest item), `looping` (no ends), `label` (its name, read by a screen reader), `disabled`; `name`: a
// hidden input a form sends the value in; `onChange` says the value picked (the value of the item); `invalidText` is what is shown under the input mode's text field
// when what is typed is none of the items. The field works here as in the editor's previews: ScrollFieldContainer.tsx draws it and scrollFieldControl.ts does the rest.
import { useEffect, useMemo, useRef, useState } from 'react';
import ScrollFieldContainer, { type ScrollFieldContainerProps } from '@theme/ui/ScrollFieldContainer';
import { isNumeric, itemOfTyped, scrollFieldItems } from '@theme/ui/scrollFieldValues';
import { placeScrollField, scrollFieldControl, scrollFieldsTo } from '@theme/ui/scrollFieldControl';

export type ScrollFieldProps = Omit<ScrollFieldContainerProps, 'error' | 'listProps' | 'value'> & {
  value?: string | number;
  name?: string;
  onChange?: (value: string) => void;
  invalidText?: string;
};

export default function ScrollField({ value, name, onChange, invalidText, items, mode = 'scroll', ...rest }: ScrollFieldProps) {
  const host = useRef<HTMLDivElement>(null);
  const told = useRef(onChange);
  told.current = onChange;
  const list = useMemo(() => scrollFieldItems(items), [items]);
  const [current, setCurrent] = useState(String(value ?? list[0]?.value ?? ''));
  const [invalid, setInvalid] = useState(false);
  // A value from outside (the editor's state changing) is shown.
  useEffect(() => {
    if (value !== undefined) setCurrent(String(value));
  }, [value]);
  useEffect(() => {
    const box = host.current;
    if (!box) return;
    const off = scrollFieldControl(box, {
      onChange: (_list, picked, settled) => {
        if (!settled) return;
        setCurrent(picked);
        told.current?.(picked);
      },
    });
    // Typed in the input mode: the item it names is picked, else the field says so.
    const typed = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches('[data-scroll-field-text] input, input[data-scroll-field-text]')) return;
      const item = itemOfTyped(list, input.value, !isNumeric(list));
      setInvalid(!item && input.value.trim() !== '');
      if (!item) return;
      setCurrent(item.value);
      told.current?.(item.value);
    };
    box.addEventListener('change', typed);
    return off;
  }, [list]);
  // Put at its value as soon as it has a size, and again when the value is set from outside.
  useEffect(() => {
    const box = host.current;
    if (!box) return;
    box.querySelectorAll<HTMLElement>('[data-scroll-field-count]').forEach(placeScrollField);
    scrollFieldsTo(box);
  }, [current, mode, list]);
  return (
    <div ref={host} className="mo-scroll-field__host" style={{ display: 'contents' }}>
      <ScrollFieldContainer items={items} value={current} mode={mode} error={invalid ? invalidText : undefined} {...rest} />
      {name && <input type="hidden" name={name} value={current} readOnly />}
    </div>
  );
}
