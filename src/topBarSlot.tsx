// Where the editor's top bar stands: one sticky place at the top of the content column, beside the full-height navigation
// rail or drawer (`aside`; App.tsx wraps the layout in TopBarLayout), which Screen.tsx draws its bar into. Exposes
// TopBarLayout and useTopBarSlot. It keeps `--top-bar-height` (the bar's height) on the layout, for the sections pane.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const Slot = createContext<HTMLElement | null>(null);

/** The element a Screen draws its top bar into, or null outside TopBarLayout (the bar is then drawn in the screen). */
export const useTopBarSlot = () => useContext(Slot);

/** The layout round the editor: `above` (what scrolls away over everything), then a row of `aside` (the rail or the drawer,
 * full height) and the column of the bar's place and `children`, which are not drawn before the place is there, so a
 * screen's bar does not first stand in the screen and then move. */
export function TopBarLayout({ above, aside, children }: { above?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!slot || !layout) return;
    const measure = () => layout.style.setProperty('--top-bar-height', `${slot.offsetHeight}px`);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(slot);
    return () => watch.disconnect();
  }, [slot, layout]);
  return (
    <div ref={setLayout} className="[--top-bar-height:4rem]">
      {above}
      <div className="flex">
        {aside}
        <div className="min-w-0 flex-1">
          <div ref={setSlot} className="sticky top-0 z-20" />
          <Slot.Provider value={slot}>{slot && children}</Slot.Provider>
        </div>
      </div>
    </div>
  );
}
