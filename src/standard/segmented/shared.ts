// The shared text of "Segmented list" ("Blocks"): the text button under the rows that shows the rest of them (`Max rows`), to begin with
// in the site's language (siteT). The link text in an open row is the one of "Expandable list" (accordion/shared.ts).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

export default defineShared({
  fields: [{ name: 'showMore', label: t.blocks.segmented.showMore, type: 'string', required: true, max: 30 }],
  values: { showMore: siteT.blocks.segmented.showMoreText },
  // Five rows with a limit of three, so the button shows.
  preview: {
    props: {
      maxRows: 3,
      show: 'all',
      items: Array.from({ length: 5 }, (_, i) => ({
        title: `${siteT.blocks.segmented.exampleTitle} ${i + 1}`,
        text: siteT.blocks.segmented.exampleText,
      })),
    },
  },
});
