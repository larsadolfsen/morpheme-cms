// The small samples of a look beside each choice of a choice group's list (ChoiceGroup in ui.tsx, Field.sample in
// schema.ts): drawn with the theme's own part in each choice's look, so they follow the theme, the density and light or
// dark, never an image. `button`: the theme's Button in the choice's kind, extra small, with the button's own text when it
// fits the sample's width, else the editor's "Button" (a sample is never cut off); the editor's "Button" too while the button
// has no text.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { SiteButton } from './themeUi';
import { blockButtonKinds, type ButtonKind } from './standard/view';
import { t } from './i18n';
import { textOf, type Button } from './standard/buttons/fields';
import type { BlockData } from './blocks';

/** The looks a select field can show a sample of (Field.sample). */
export type ChoiceSampleKind = 'button';

/** A button sample: the theme's Button in its kind with `label`, or the editor's "Button" when the label is empty or does not
 * fit the room the sample has (its slot's maximum width, --mo-comp-choice-group-sample-max-width). The label's width is measured on an
 * unseen button with the full text, so a sample is never cut off, and again when its size changes (a font loads, the list is
 * shown after the buttons). */
function ButtonSample({ kind, label }: { kind: ButtonKind; label?: string }) {
  const fallback = t.blocks.buttons.sample;
  const own = label?.trim() || '';
  const probe = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const unseen = probe.current;
    const slot = unseen?.closest<HTMLElement>('.mo-choice-group__sample');
    if (!own || !unseen || !slot) return;
    const measure = () => {
      const width = unseen.getBoundingClientRect().width;
      const room = parseFloat(getComputedStyle(slot).maxWidth);
      // Hidden (the buttons are shown, not the list): nothing to measure yet.
      if (width > 0 && room > 0) setFits(width <= room + 0.5);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(unseen);
    return () => observer.disconnect();
  }, [own]);
  return (
    <>
      {own && (
        <span ref={probe} aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', width: 'max-content' }}>
          <SiteButton kind={kind} size="xsmall" tabIndex={-1}>
            {own}
          </SiteButton>
        </span>
      )}
      <SiteButton kind={kind} size="xsmall" tabIndex={-1}>
        {own && fits ? own : fallback}
      </SiteButton>
    </>
  );
}

/** The entry's text a sample shows (`entry`: the object the field is in; `data`: the site's, for a button's target):
 * a button's own text, or its target's or its page's name (textOf). Empty when there is none. */
export function sampleTextOf(
  kind: ChoiceSampleKind,
  entry: Record<string, unknown> | undefined,
  data: Pick<BlockData, 'relations'> & { site: object },
) {
  if (kind !== 'button' || !entry) return '';
  try {
    return textOf(entry as Button, data as BlockData).trim();
  } catch {
    return typeof entry.label === 'string' ? entry.label.trim() : '';
  }
}

/** The sample of the look `value` of a `kind` field; `label`: the entry's own text, where the sample shows it. */
export function choiceSample(kind: ChoiceSampleKind, value: string, { label }: { label?: string } = {}): ReactNode {
  if (kind === 'button' && (blockButtonKinds as readonly string[]).includes(value))
    return <ButtonSample kind={value as ButtonKind} label={label} />;
  return null;
}
