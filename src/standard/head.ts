// A block's head, for the standard blocks that start a section ("Cards", "Points with icon", "Steps", "Testimonials",
// "Questions and answers", "Blog posts", "Expandable list", "Price cards", "Checklist"): a label above the
// heading ("Label", `eyebrow`), the heading, and a subheading under it ("Subheading", `intro`: the key
// "Expandable list" had it by before), all optional. Its fields, one definition for all of them (headFields, around where
// the heading is in a block's fields), and what it shows (headOf, the same in the editor and on the site); drawn by the theme's blocks/BlockHead.tsx.
import { t } from '../i18n';
import type { Field } from '../schema';

export const headFields: Field[] = [
  { name: 'eyebrow', label: t.blocks.eyebrow, type: 'string', max: 30, hint: t.blocks.eyebrowHint },
  { name: 'heading', label: t.blocks.heading, type: 'string', hint: t.blocks.headingHint },
  { name: 'intro', label: t.blocks.subheading, type: 'text', hint: t.blocks.subheadingHint },
];

/** What a block's head shows: the label above the heading, the heading and the subheading under it. */
export type HeadView = { eyebrow?: string; heading?: string; subheading?: string };

/** A block's head, from its fields. */
export const headOf = (props: Record<string, any>): HeadView => ({
  eyebrow: props.eyebrow?.trim() || undefined,
  heading: props.heading || undefined,
  subheading: props.intro?.trim() || undefined,
});
