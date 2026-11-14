// The shared texts of "Image grid" ("Blocks"): the filter's clear button, the line for a grid with no image left, the filter's name for screen
// readers and the count that is announced, to begin with in the site's language (siteT).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

export default defineShared({
  fields: [
    { name: 'clear', label: t.blocks.imageGrid.clear, type: 'string', required: true, max: 30 },
    { name: 'empty', label: t.blocks.imageGrid.empty, type: 'string', required: true, max: 80 },
    { name: 'filter', label: t.blocks.imageGrid.filterLabel, type: 'string', required: true, max: 40 },
    { name: 'count', label: t.blocks.imageGrid.count, type: 'string', required: true, max: 40, hint: t.blocks.imageGrid.countHint },
  ],
  values: {
    clear: siteT.blocks.imageGrid.clearText,
    empty: siteT.blocks.imageGrid.emptyText,
    filter: siteT.blocks.imageGrid.filterText,
    count: siteT.blocks.imageGrid.countText,
  },
});
