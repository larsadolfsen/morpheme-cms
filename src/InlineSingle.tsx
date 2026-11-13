// The host of a block that has no list (Notice, Video) typed in place: the block's own props are its one item. It has what InlineItems.tsx
// has for items (the cursor put in a field once, Enter going to the next typed field) without what only repeating items need (the empty
// faded item, `Add …`, Enter adding one, Backspace dropping one). The block draws its markup with `InlineField` (`field`) where a text
// stands and `InlineSlot` where something is picked; what is typed is told to `onChange` as the one item (`items: [props]`), which
// the node view in MarkdownEditor.tsx (blockCard) puts in the props.
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { InlineField, type Change, type Focus } from './InlineItems';

const fits = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');

export default function InlineSingle({
  props,
  active,
  focus,
  fields,
  onChange,
  render,
}: {
  props: Record<string, any>;
  /** 0 while the block is being typed in, else null. */
  active: number | null;
  focus: Focus | null;
  /** The typed fields, in the order the cursor goes through them. */
  fields: string[];
  onChange: (change: Change) => void;
  render: (c: { here: boolean; field: (name: string, label: string, placeholder: string) => ReactNode }) => ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    const field = root.current?.querySelector<HTMLTextAreaElement>(`[data-field="${focus.field}"]`);
    field?.focus({ preventScroll: false });
    field?.setSelectionRange(field.value.length, field.value.length);
  }, [focus]);
  useLayoutEffect(() => {
    if (fits) return;
    for (const f of root.current?.querySelectorAll<HTMLTextAreaElement>('textarea') ?? []) {
      f.style.height = '0';
      f.style.height = `${f.scrollHeight}px`;
    }
  });
  return (
    <div ref={root} className="inline-list-host">
      {render({
        here: active === 0,
        field: (name, label, placeholder) => (
          <InlineField
            name={name}
            value={String(props[name] ?? '')}
            label={label}
            placeholder={placeholder}
            onType={(v) => onChange({ items: [{ ...props, [name]: v }], active: 0 })}
            onFocus={() => active !== 0 && onChange({ active: 0 })}
            onKeys={(e) => {
              if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
              // One line of text: Enter goes to the next typed field, and in the last one does nothing.
              e.preventDefault();
              const next = fields[fields.indexOf(name) + 1];
              if (next) onChange({ active: 0, focus: { row: 0, field: next } });
            }}
          />
        ),
      })}
    </div>
  );
}
