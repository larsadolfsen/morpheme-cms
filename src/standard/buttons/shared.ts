// The shared buttons of "Buttons" ("Blocks"): in a "Buttons" block that has none of its own, and where
// a site shows them itself (this site's front page). None to begin with.
import { t } from '../../i18n';
import { defineShared } from '../../shared';
import { buttonList } from './fields';

export default defineShared({
  fields: [{ ...buttonList, hint: t.blocks.buttons.sharedHint }],
  values: { items: [] },
  // Always the shared ones, not a copy on a page.
  preview: { shared: true },
});
