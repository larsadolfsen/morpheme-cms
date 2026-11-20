// The text of a part's save (CompanyForm.tsx usePartForm): "<label> set to <value>" or "<label> changed".
// Exposes partChange. Depends only on types, so it runs under node --test; the texts come in as `texts` (t.app.changes).
import type { AppPageProps } from './apps';
import type { Part } from './schema';

/** The texts it needs, from `t.app.changes`. */
export type ChangeTexts = { edited: (what: string) => string; setTo: (what: string, value: string) => string };

/** The text of a part's save: "<label> set to <value>" with the value its `changedTo` gives, else "<label> changed".
 * `what` is the part's label as it stands in a sentence (lower). A throw, a rejection, no value or an empty one gives
 * "changed". */
export async function partChange(
  what: string,
  values: Record<string, unknown>,
  changedTo: Part['changedTo'],
  props: AppPageProps,
  texts: ChangeTexts,
): Promise<string> {
  try {
    const value = await changedTo?.(values, props);
    if (value) return texts.setTo(what, value);
  } catch {}
  return texts.edited(what);
}
