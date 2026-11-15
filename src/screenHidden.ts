// Tells the screens under it that they are not the page shown: the form while its Preview (a page of the editor, pagePreview.tsx)
// is open. A hidden Screen draws no top bar and FormFrame no bottom bar, but the form stays mounted, so it keeps what is in
// it, saved or not. Exposes ScreenHidden (a context, false by default).
import { createContext } from 'react';

export const ScreenHidden = createContext(false);
