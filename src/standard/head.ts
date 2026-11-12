// A block's head, for the standard blocks that start a section ("Cards", "Points with icon", "Steps", "Testimonials",
// "Questions and answers", "Blog posts", "Expandable list", "Price cards", "Checklist"): the heading, and a subheading under it
// ("Subheading", `intro`: the key "Expandable list" had it by before), both optional. (The label above the heading the block had
// is the text's own label line before it now, lib/remark-block-label.mjs.) Its fields, one definition for all of them (headFields, around where
// the heading is in a block's fields), and what it shows (headOf, the same in the editor and on the site); drawn by the theme's blocks/BlockHead.tsx.
import { t } from '../i18n';
import type { Field } from '../schema';

export const headFields: Field[] = [
  { name: 'heading', label: t.blocks.heading, type: 'string', hint: t.blocks.headingHint },
  { name: 'intro', label: t.blocks.subheading, type: 'text', hint: t.blocks.subheadingHint },
];

/** What a block's head shows: the heading and the subheading under it. */
export type HeadView = { heading?: string; subheading?: string };

/** A block's head, from its fields. */
export const headOf = (props: Record<string, any>): HeadView => ({
  heading: props.heading || undefined,
  subheading: props.intro?.trim() || undefined,
});
