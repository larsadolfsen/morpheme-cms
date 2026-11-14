// The small samples of a look beside each choice of a choice group's list (ChoiceGroup in ui.tsx, Field.sample in
// schema.ts): drawn with the theme's own part in each choice's look, so they follow the theme, the density and light or
// dark, never an image. `button`: the theme's Button in the choice's kind, extra small, with the button's own text cut to
// 8 characters (the editor's "Button" while it has none).
import type { ReactNode } from 'react';
import { SiteButton } from './themeUi';
import { buttonKinds, type ButtonKind } from './standard/view';
import { t } from './i18n';
import { textOf, type Button } from './standard/buttons/fields';
import type { BlockData } from './blocks';

/** The looks a select field can show a sample of (Field.sample). */
export type ChoiceSampleKind = 'button';

/** A text cut to `max` characters, with … when it was longer. */
export const cutText = (text: string, max = 8) => {
  const chars = [...text.trim()];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('');
};

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
  if (kind === 'button' && (buttonKinds as readonly string[]).includes(value))
    return (
      <SiteButton kind={value as ButtonKind} size="xsmall" tabIndex={-1}>
        {cutText(label || t.blocks.buttons.sample)}
      </SiteButton>
    );
  return null;
}
