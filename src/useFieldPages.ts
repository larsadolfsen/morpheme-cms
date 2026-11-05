// Keeps a form open while one of its fields' pages (Field.page) is shown, and where it was scrolled to.
// Exposes useFieldPages (the field whose page is open). Depends on useFormPages (FormFrame.tsx); used by CompanyForm.tsx and AppList.tsx.
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFormPages } from './FormFrame';
import type { Field, Part } from './schema';

/** For a part's form at `address` whose fields' pages are at `base`/<field> (none without `base`): the form and those
 * pages stay one form for the editor (useFormPages), so it keeps what is in it. Returns the field whose page is open
 * (`page`), and keeps the form's scroll while it is shown, so it comes back there from a field's page. */
export function useFieldPages(
  part: Part,
  address: string | undefined,
  base: string | undefined,
  page: string | undefined,
): Field | undefined {
  const paged = base ? (part as Required<Part>).fields.filter((f) => f.page) : [];
  useFormPages(address ? [address, ...paged.map((f) => `${base}/${f.name}`)] : []);
  const open = paged.find((f) => f.name === page);
  const scrolled = useRef(0);
  useEffect(() => {
    if (open) return;
    const keep = () => (scrolled.current = scrollY);
    addEventListener('scroll', keep, { passive: true });
    return () => removeEventListener('scroll', keep);
  }, [open]);
  useLayoutEffect(() => {
    scrollTo(0, open ? 0 : scrolled.current);
  }, [open]);
  return open;
}
