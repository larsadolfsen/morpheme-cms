// Where the editor's top bar stands: one place at the top of the content column, beside the full-height navigation
// rail or drawer (`aside`; App.tsx wraps the layout in TopBarLayout), which Screen.tsx draws its bar into. The bar scrolls
// away with the page. Exposes TopBarLayout and useTopBarSlot.
// While the side panel is open the place ends at the panel's start edge (.editor-top-bar-slot in editor.css).
import { createContext, useContext, useState, type ReactNode } from 'react';

const Slot = createContext<HTMLElement | null>(null);

/** The element a Screen draws its top bar into, or null outside TopBarLayout (the bar is then drawn in the screen). */
export const useTopBarSlot = () => useContext(Slot);

/** The layout round the editor: `above` (what scrolls away over everything), then a row of `aside` (the rail or the drawer,
 * full height) and the column of the bar's place and `children`, which are not drawn before the place is there, so a
 * screen's bar does not first stand in the screen and then move. */
export function TopBarLayout({ above, aside, children }: { above?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  return (
    <div>
      {above}
      <div className="flex">
        {aside}
        {/* At least as high as the window, so a short screen's footer is at its bottom (Screen.tsx), and the room for a FAB
            under the footer higher (--editor-fab-clearance, editor.css). */}
        <div className="flex min-h-[calc(100dvh+var(--editor-fab-clearance,0px))] min-w-0 flex-1 flex-col">
          <div ref={setSlot} className="editor-top-bar-slot" />
          <Slot.Provider value={slot}>{slot && children}</Slot.Provider>
        </div>
      </div>
    </div>
  );
}
