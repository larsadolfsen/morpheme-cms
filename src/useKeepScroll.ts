// Keeps where a screen was scrolled to while another page of the same form is shown (a field's page, the Preview), and puts it
// back when it comes back. Exposes useKeepScroll(away): `away` is true while the other page is shown, which starts at the top.
import { useEffect, useLayoutEffect, useRef } from 'react';

export function useKeepScroll(away: boolean) {
  const scrolled = useRef(0);
  useEffect(() => {
    if (away) return;
    const keep = () => (scrolled.current = scrollY);
    addEventListener('scroll', keep, { passive: true });
    return () => removeEventListener('scroll', keep);
  }, [away]);
  useLayoutEffect(() => {
    scrollTo(0, away ? 0 : scrolled.current);
  }, [away]);
}
