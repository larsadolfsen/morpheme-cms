// A button group (m3.material.io/components/button-groups, .mo-button-group in ../styles/ui/button-groups.css): buttons or icon buttons
// that belong together side by side (`children`: the theme's Button and IconButton), in a group with its name (`label`,
// read by screen readers). Its kind (`kind`) is Material's name; how it looks is the theme's: standard (the default,
// with a gap between them; the one pressed a little wider and its neighbours a little narrower) or connected (joined,
// the corners between them small, larger with the size, the outer ones the buttons'). The buttons in it have one size
// and one shape (`size`, `shape` on each: Button's and IconButton's), and the group follows them. A toggle button in it
// is a Button or an IconButton with `selected` (aria-pressed): the theme gives it its look on and off (the Button's and
// the IconButton's), in a standard group with the group's corners while it is on, in a connected one fully round. What
// turns it on and off is the script of the block that shows it, or the group itself with `selection` (Material's selection
// modes, md.comp.button-group "Configurations": `single` selects one or none, `multiple` any number, `required` exactly one that
// cannot be turned off). The buttons in it then each have a `value`; the group sets their `selected` and clicks, keeps one
// of them in the tab order and moves between them with the arrow keys, Home and End (Material's Accessibility: Tab to the group,
// arrow keys between its items, Space or Enter to select). `value` (the selected values, controlled) or `defaultValue` and
// `onChange` give the choice. Other attributes (data-…) go on the group, and `className` after its own classes. An Astro component gives
// an element the same classes with buttonGroupClass.
import { Children, cloneElement, isValidElement, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';

export const buttonGroupKinds = ['standard', 'connected'] as const;
export type ButtonGroupKind = (typeof buttonGroupKinds)[number];

/** A button group's classes: its kind's. */
export const buttonGroupClass = (kind: ButtonGroupKind = 'standard') => `mo-button-group mo-is-${kind}`;

export const buttonGroupSelections = ['single', 'multiple', 'required'] as const;
export type ButtonGroupSelection = (typeof buttonGroupSelections)[number];

/** The values selected after `value` is pressed, by the mode: `single` selects it or, when it is on, nothing; `multiple` toggles it; `required` selects it and never turns the last one off. */
export function nextSelection(selection: ButtonGroupSelection, selected: string[], value: string): string[] {
  const on = selected.includes(value);
  if (selection === 'multiple') return on ? selected.filter((v) => v !== value) : [...selected, value];
  if (selection === 'required') return [value];
  return on ? [] : [value];
}

const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export default function ButtonGroup({
  kind,
  label,
  selection,
  value,
  defaultValue,
  onChange,
  className,
  children,
  onKeyDown,
  ...rest
}: {
  kind?: ButtonGroupKind;
  label: string;
  selection?: ButtonGroupSelection;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  children: ReactNode;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
} & Record<string, unknown>) {
  const [own, setOwn] = useState<string[]>(defaultValue ?? []);
  const selected = value ?? own;
  const classes = [buttonGroupClass(kind), className].filter(Boolean).join(' ');
  if (!selection) {
    return (
      <div role="group" aria-label={label} className={classes} onKeyDown={onKeyDown} {...rest}>
        {children}
      </div>
    );
  }
  const items = Children.toArray(children).filter((c): c is ReactElement<Record<string, unknown>> => isValidElement(c));
  const enabled = items.filter((c) => !c.props.disabled);
  const tabbable = (enabled.find((c) => selected.includes(String(c.props.value))) ?? enabled[0])?.props.value;
  const choose = (v: string) => {
    const next = nextSelection(selection, selected, v);
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  // The arrow keys go to the next or the previous button that is on, wrapping (the inline direction's).
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !(e.key in keys || e.key === 'Home' || e.key === 'End')) return;
    const buttons = [...e.currentTarget.querySelectorAll<HTMLElement>(':scope > :is(button, a):not(:disabled)')];
    const at = buttons.indexOf(document.activeElement as HTMLElement);
    if (at < 0 || !buttons.length) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const step = (keys[e.key] ?? 0) * (rtl && /Left|Right/.test(e.key) ? -1 : 1);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (at + step + buttons.length) % buttons.length;
    for (const b of buttons) b.tabIndex = -1;
    buttons[next].tabIndex = 0;
    buttons[next].focus();
  };
  return (
    <div role="group" aria-label={label} className={classes} data-selection={selection} onKeyDown={move} {...rest}>
      {Children.map(children, (child) => {
        if (!isValidElement<Record<string, unknown>>(child) || typeof child.props.value !== 'string') return child;
        const v = child.props.value;
        const click = child.props.onClick as ((e: unknown) => void) | undefined;
        return cloneElement(child, {
          selected: selected.includes(v),
          tabIndex: v === tabbable ? 0 : -1,
          onClick: (e: unknown) => {
            click?.(e);
            choose(v);
          },
        });
      })}
    </div>
  );
}
