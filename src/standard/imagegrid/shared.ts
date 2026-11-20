// The shared texts of "Image grid" ("Blocks"): the filter's clear button, the line for a grid with no image left, the filter's name for screen
// readers and the count that is announced and the texts of the image viewer, to begin with in the site's language (siteT).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

export default defineShared({
  fields: [
    { name: 'clear', label: t.blocks.imageGrid.clear, type: 'string', required: true, max: 30 },
    { name: 'empty', label: t.blocks.imageGrid.empty, type: 'string', required: true, max: 80 },
    { name: 'filter', label: t.blocks.imageGrid.filterLabel, type: 'string', required: true, max: 40 },
    { name: 'count', label: t.blocks.imageGrid.count, type: 'string', required: true, max: 40, hint: t.blocks.imageGrid.countHint },
    { name: 'viewer', label: t.blocks.imageGrid.viewer, type: 'string', required: true, max: 40 },
    { name: 'close', label: t.blocks.imageGrid.close, type: 'string', required: true, max: 30 },
    { name: 'previous', label: t.blocks.imageGrid.previous, type: 'string', required: true, max: 40 },
    { name: 'next', label: t.blocks.imageGrid.next, type: 'string', required: true, max: 40 },
    {
      name: 'position',
      label: t.blocks.imageGrid.position,
      type: 'string',
      required: true,
      max: 40,
      hint: t.blocks.imageGrid.positionHint,
    },
  ],
  values: {
    clear: siteT.blocks.imageGrid.clearText,
    empty: siteT.blocks.imageGrid.emptyText,
    filter: siteT.blocks.imageGrid.filterText,
    count: siteT.blocks.imageGrid.countText,
    viewer: siteT.blocks.imageGrid.viewerText,
    close: siteT.blocks.imageGrid.closeText,
    previous: siteT.blocks.imageGrid.previousText,
    next: siteT.blocks.imageGrid.nextText,
    position: siteT.blocks.imageGrid.positionText,
  },
});
