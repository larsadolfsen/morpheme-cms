// A choice group (.mo-choice-group in ../styles/ui/button-groups.css): one choice of a few, which takes its form by measuring, so it never
// squeezes. When every choice fits its label on one line at an equal share of the width, it is Material's connected button
// group (m3.material.io/components/button-groups: ButtonGroup kind="connected" with a filled, small toggle Button
// for each choice, aria-pressed; no check mark, the chosen one shows by its shape and colour); otherwise a list of radio
// buttons (m3.material.io/components/radio-button and /lists: the theme's List in a RadioGroup, a <fieldset> named by
// `label`, each choice a ListItem with its radio button leading and the whole row the tap target). The rule is
// fitsAsButtons (choiceGroupFit.mjs): the widest button × the count + the gaps against the width; more than five is always
// the list; the switch back from the list needs 8 px more. Both forms are in the DOM; .mo-choice-group__measure, hidden and
// inert, holds the buttons at their natural width, and data-form="buttons" | "list" on the group shows one form. The form
// is chosen in a layout effect, before the first paint, and again when the width, the fonts or the density change
// (ResizeObserver, document.fonts); without it (the server, before hydration) it is the list, which can never overlap.
// A choice (`choices`): its `value` and `label`, an `icon` (the button form shows it before the label), a `swatch` (a CSS
// colour: a filled circle, before the label in the button form, on the right in the list form), a `sample` (a small, inert
// drawing of the look, on the right of its row in the list form only) and `disabled`. `value` is the chosen one, and
// `onChange` is told the value chosen. `form` forces a form ('buttons' or 'list'; 'auto', the default, measures): for the
// theme's parts page and tests only. `dots`: the button form shows only the swatches, each named for screen readers.
// `labelHidden`: the list form's name (its legend) only for screen readers, where the form already shows the name over
// the group (a field's label). `name`: the radio buttons' shared name (one of its own by default). Keyboard: in the list form the browser's radio group
// (Tab to the chosen one, the arrow keys move and choose); in the button form Tab lands on the chosen button and leaves
// the group in one step, the arrow keys move between the buttons, Space or Enter chooses. When the form changes while a
// choice has focus, the same choice in the other form gets it. Other attributes (data-…) go on the group, `className`
// after its own class.
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { IconRef } from '@morphemecms/cms/src/icon';
import Button from '@theme/ui/Button';
import ButtonGroup from '@theme/ui/ButtonGroup';
import List, { ListItem } from '@theme/ui/List';
import { RadioGroup } from '@theme/ui/RadioButton';
import { fitsAsButtons } from '@theme/ui/choiceGroupFit.mjs';

export type Choice = {
  value: string;
  label: string;
  icon?: IconRef;
  swatch?: string;
  sample?: ReactNode;
  disabled?: boolean;
};

export type ChoiceGroupForm = 'auto' | 'buttons' | 'list';

/** A choice group's class. */
export const choiceGroupClass = 'mo-choice-group';

// A layout effect where there is a DOM (it runs before the browser paints), nothing on the server.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function ChoiceGroup({
  label,
  name,
  choices,
  value,
  onChange,
  form = 'auto',
  dots,
  disabled,
  labelHidden,
  className,
  ...rest
}: {
  label: string;
  name?: string;
  choices: Choice[];
  value?: string;
  onChange?: (value: string) => void;
  form?: ChoiceGroupForm;
  dots?: boolean;
  disabled?: boolean;
  labelHidden?: boolean;
  className?: string;
} & Record<string, unknown>) {
  const own = useId();
  const group = name ?? own;
  const root = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<'buttons' | 'list'>('list');
  const shown = form === 'auto' ? measured : form;
  const showing = useRef(shown);

  // Measure: the hidden row's buttons at their natural width against the width the group gets (the row's own, which has
  // the button form's maximum width).
  useBeforePaint(() => {
    if (form !== 'auto') return;
    const el = root.current;
    const row = el?.querySelector<HTMLElement>(':scope > .mo-choice-group__measure');
    if (!el || !row) return;
    const measure = () => {
      const buttons = [...row.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const fits = fitsAsButtons(
        buttons.map((b) => b.getBoundingClientRect().width),
        row.getBoundingClientRect().width,
        gap,
        showing.current === 'buttons',
      );
      setMeasured(fits ? 'buttons' : 'list');
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (const b of row.children) observer.observe(b);
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    let live = true;
    fonts?.ready.then(() => live && measure());
    fonts?.addEventListener('loadingdone', measure);
    return () => {
      live = false;
      observer.disconnect();
      fonts?.removeEventListener('loadingdone', measure);
    };
  }, [form, choices.length, choices.map((c) => `${c.label}|${c.icon ? 1 : 0}|${c.swatch ?? ''}`).join('\n'), dots]);

  // The list's radio buttons follow `value` (they are the browser's own, set from the start), and focus follows the choice
  // into the other form when the form changes.
  useBeforePaint(() => {
    const el = root.current;
    if (!el) return;
    for (const input of el.querySelectorAll<HTMLInputElement>(':scope > .mo-choice-group__list input[type="radio"]'))
      input.checked = input.value === value;
    if (showing.current !== shown) {
      const was = showing.current;
      showing.current = shown;
      const active = document.activeElement as HTMLElement | null;
      const from = was === 'buttons' ? '.mo-choice-group__buttons' : '.mo-choice-group__list';
      if (active && active.closest(`.mo-choice-group > ${from}`)?.parentElement === el) {
        const v = active.dataset.value ?? (active as HTMLInputElement).value;
        const to =
          shown === 'buttons'
            ? [...el.querySelectorAll<HTMLElement>(':scope > .mo-choice-group__buttons > button')].find((b) => b.dataset.value === v)
            : [...el.querySelectorAll<HTMLInputElement>(':scope > .mo-choice-group__list input[type="radio"]')].find((i) => i.value === v);
        to?.focus();
      }
    }
  });

  const choose = (v: string) => {
    if (v !== value) onChange?.(v);
  };
  const tabbable = choices.find((c) => c.value === value && !c.disabled && !disabled)?.value ?? choices.find((c) => !c.disabled)?.value;

  // The button form's arrow keys: to the next or the previous button that can be chosen, wrapping (the inline direction's).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>(':scope > button:not(:disabled)')];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0 || !buttons.length) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const step = (keys[e.key] ?? 0) * (rtl && /Left|Right/.test(e.key) ? -1 : 1);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (at + step + buttons.length) % buttons.length;
    for (const b of buttons) b.tabIndex = -1;
    buttons[next].tabIndex = 0;
    buttons[next].focus();
  };

  const swatchOf = (c: Choice) =>
    c.swatch ? <span className="mo-choice-group__swatch" style={{ background: c.swatch }} aria-hidden="true" /> : null;
  const buttonContent = (c: Choice) => (
    <>
      {swatchOf(c)}
      <span className={dots && c.swatch ? 'mo-choice-group__label mo-choice-group__label-hidden' : 'mo-choice-group__label'}>
        {c.label}
      </span>
    </>
  );

  return (
    <div
      ref={root}
      className={[choiceGroupClass, className].filter(Boolean).join(' ')}
      data-form={shown}
      data-forced={form === 'auto' ? undefined : ''}
      data-label-hidden={labelHidden ? '' : undefined}
      {...rest}
    >
      {form === 'auto' && (
        <div className="mo-button-group mo-button-group__connected mo-choice-group__measure" aria-hidden="true" inert>
          {choices.map((c) => (
            <Button key={c.value} kind="filled" size="small" selected={false} icon={c.icon} tabIndex={-1}>
              {buttonContent(c)}
            </Button>
          ))}
        </div>
      )}
      <ButtonGroup kind="connected" label={label} className="mo-choice-group__buttons" onKeyDown={onKeyDown}>
        {choices.map((c) => (
          <Button
            key={c.value}
            kind="filled"
            size="small"
            selected={c.value === value}
            icon={c.icon}
            disabled={disabled || c.disabled}
            data-value={c.value}
            aria-label={dots && c.swatch ? c.label : undefined}
            tabIndex={c.value === tabbable ? 0 : -1}
            onClick={() => choose(c.value)}
          >
            {buttonContent(c)}
          </Button>
        ))}
      </ButtonGroup>
      <RadioGroup
        label={label}
        className="mo-choice-group__list"
        onChange={(e: { target: EventTarget }) => {
          const input = e.target as HTMLInputElement;
          if (input.type === 'radio' && input.checked) choose(input.value);
        }}
      >
        <List dividers="none">
          {choices.map((c) => {
            const trailing = c.sample ?? swatchOf(c);
            return (
              <ListItem
                key={c.value}
                headline={c.label}
                disabled={disabled || c.disabled}
                control={{ type: 'radio-button', at: 'leading', name: group, value: c.value, checked: c.value === value }}
                trailing={
                  trailing != null ? (
                    <span className="mo-choice-group__sample" aria-hidden="true" inert>
                      {trailing}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </List>
      </RadioGroup>
    </div>
  );
}
