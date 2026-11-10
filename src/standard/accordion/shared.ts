// The shared text of "Expandable list" ("Blocks"): the link under a row's text, with {topic} for the row's
// heading, to begin with in the site's language (siteT). Also on a site's own rows drawn with
// PageRow.tsx (this site's front page).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';
import { upgradeMore } from './topic.mjs';

/** The rows it is shown with where no page has it: its screen under "Blocks" and "Available
 * blocks" (index.tsx). In the site's language, like the drawing. */
export const example = { items: siteT.blocks.accordion.example.map((label) => ({ label, href: '' })) };

export default defineShared({
  fields: [{ name: 'more', label: t.blocks.accordion.more, type: 'string', required: true, max: 40, hint: t.blocks.accordion.moreHint }],
  values: { more: siteT.blocks.accordion.moreText },
  preview: { props: example },
  // A text saved with {emne} is shown with {topic} and saved so (topic.mjs); the site renders either. language-ok: the old placeholder
  upgradeValues: upgradeMore,
});
