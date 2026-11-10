// "Continue where you left off" on the start screen, the widget cms:continue: a card with the last three pages and blog
// posts saved, newest first, each a row that opens its form, with a close button in its top end corner. Exposes
// ContinueWidget. The logic is startView.mjs's, the storage startStorage.ts's, the times savedTimes.ts's (shared with the
// lists), the files and savedAt come from startData.ts, and the card, rows and close button the theme's (ui.tsx).
// Closed, it shows nothing, unless it is being edited: then it renders with its empty text.
import { useEffect, useState } from 'react';
import { locale, t } from '../i18n';
import { nameOf } from '../deploy';
import { icons } from '../site';
import { when } from '../when';
import { loadSavedTimes, saved } from '../savedTimes';
import { continueShown, latestEdits } from '../startView.mjs';
import { CLOSED, keepStored, readStored, startListOf, storedEdits } from '../startStorage';
import { useStartData } from '../startData';
import type { WidgetProps } from '../widgets';
import { SiteCard } from '../themeUi';
import { CloseButton, ListItem, plainListClass } from '../ui';

const SHOWN = 3;

/** A list's singular as it starts a line: "page" as "Page". */
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/** Those saved in this browser and, once GitHub has answered, those saved on the site by anyone (savedAt, from the start
 * screen). The close button hides the card until something is saved after that; with nothing saved yet it says where
 * they will be. */
export function ContinueWidget({ editing }: WidgetProps) {
  const { files, savedAt } = useStartData();
  const [edits] = useState(storedEdits);
  const [closedAt, setClosedAt] = useState(() => readStored<number>(CLOSED));
  const startFiles = files.filter((f) => startListOf(f.path));
  // When each page and post was last saved on the site, from the cache the lists use (savedTimes.ts); null until GitHub
  // has answered (or could not).
  const [history, setHistory] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let live = true;
    const fromCache = () =>
      Object.fromEntries(startFiles.flatMap((f) => (saved.has(f.path) ? [[f.path, saved.get(f.path)!.date.getTime()]] : [])));
    loadSavedTimes(savedAt, startFiles).then(
      () => live && setHistory(fromCache()),
      () => live && setHistory(fromCache()),
    );
    return () => {
      live = false;
    };
  }, [startFiles.map((f) => `${f.path}@${f.oid}`).join()]);
  const rows = latestEdits(edits, history ?? {}).flatMap((edit) => {
    const collection = startListOf(edit.path);
    const file = collection && files.find((f) => f.path === edit.path);
    return collection && file ? [{ edit, collection, file }] : [];
  });
  const hidden = !continueShown(closedAt, rows[0]?.edit.at);
  // Hidden, the widget is still drawn while it is being edited, with its empty text and no rows.
  if (hidden && !editing) return null;
  const close = () => {
    const now = Date.now();
    keepStored(CLOSED, now);
    setClosedAt(now);
  };
  const shownRows = hidden ? [] : rows;
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby="continue-title" className="relative mb-8 [--card-padding:1rem_0_0.5rem]">
      <h2 id="continue-title" className="ps-4 pe-14 pb-2 font-medium">
        {t.library.continueTitle}
      </h2>
      <CloseButton onClick={close} />
      {shownRows.length ? (
        <ul className={plainListClass}>
          {shownRows.slice(0, SHOWN).map(({ edit, collection, file }) => (
            <ListItem
              key={edit.path}
              href={`#${edit.path}`}
              icon={icons[collection.id]}
              headline={nameOf(collection, file)}
              supporting={t.library.recentEdit(capital(collection.singular ?? collection.label), when(new Date(edit.at)))}
              truncate
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-2 text-sm text-on-surface-variant">{hidden || history ? t.library.continueEmpty : t.app.loading}</p>
      )}
    </SiteCard>
  );
}
