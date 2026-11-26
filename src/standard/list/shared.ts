// The shared text of "List" and "Expandable list" ("Blocks" › "List"): the text button under the rows that shows the rest of them (`Max rows`), to
// begin with in the site's language (siteT). It was "Segmented list"'s (site/site.ts keeps a text a site saved there). The link text in an open
// row of "Expandable list" is the one of the old "Accordion".
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

export default defineShared({
  fields: [{ name: 'showMore', label: t.blocks.list.showMore, type: 'string', required: true, max: 30 }],
  values: { showMore: siteT.blocks.list.showMoreText },
  // Five rows with a limit of three, so the button shows.
  preview: {
    props: {
      maxRows: 3,
      design: 'segmented',
      items: Array.from({ length: 5 }, (_, i) => ({
        title: `${siteT.blocks.list.exampleTitle} ${i + 1}`,
        text: siteT.blocks.list.exampleText,
      })),
    },
  },
});
