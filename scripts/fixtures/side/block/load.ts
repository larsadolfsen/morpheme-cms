// TEST-ONLY block for check:themes (scripts/check-side.mjs): a block that can be drawn beside a page's text (`beside`).
// Its view is the page's address and the length of the text it was given, so the check sees that both reach the block.
import type { Load } from '@morphemecms/cms/src/standard/view';

export const beside = true;

export const load: Load<{ path: string; length: number }> = async (props, at) =>
  Object.keys(props).length === 0 && at.html ? { path: at.path ?? '', length: at.html.length } : null;
