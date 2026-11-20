// What the start screen's widgets get from the start screen (Library.tsx Start), which a widget's props do not carry: the
// repository's files, the times pages were saved (Env['savedAt']) and when the site was last built. Exposes `StartDataContext`, which Start provides,
// and `useStartData`, which a widget reads.
import { createContext, useContext } from 'react';
import type { Env } from './App';
import type { RepoFile } from './github';

export type StartData = { files: RepoFile[]; savedAt: Env['savedAt']; builtAt: Date | null };

export const StartDataContext = createContext<StartData | null>(null);

/** The start screen's data, for a widget rendered by it. Throws when no Start provides it. */
export function useStartData(): StartData {
  const data = useContext(StartDataContext);
  if (!data) throw new Error('useStartData: no StartDataContext.Provider above this widget');
  return data;
}
