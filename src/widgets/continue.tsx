// "Continue where you left off" on the start screen, the widget cms:continue: a card with the last three pages and blog
// posts saved, newest first, each a row that opens its form. Exposes
// ContinueWidget. The logic is startView.mjs's, the storage startStorage.ts's, the times savedTimes.ts's (shared with the
// lists), the files and savedAt come from startData.ts, and the card and rows the theme's (ui.tsx).
import { useEffect, useId, useState } from 'react';
import { locale, t } from '../i18n';
import { nameOf } from '../deploy';
import { icons } from '../site';
import { when } from '../when';
import { loadSavedTimes, saved } from '../savedTimes';
import { latestEdits } from '../startView.mjs';
import { startListOf, storedEdits } from '../startStorage';
import { useStartData } from '../startData';
import { SiteCard } from '../themeUi';
import { ListItem, plainListClass } from '../ui';

const SHOWN = 3;

/** A list's singular as it starts a line: "page" as "Page". */
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/** Those saved in this browser and, once GitHub has answered, those saved on the site by anyone (savedAt, from the start
 * screen); with nothing saved yet it says where they will be. */
export function ContinueWidget() {
  const { files, savedAt } = useStartData();
  // The same widget may be placed twice, so the heading's id is made for each.
  const titleId = useId();
  const [edits] = useState(storedEdits);
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
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby={titleId} className="mo-editor-widget-list">
      <h2 id={titleId} className="mo-type-title-medium mo-editor-widget-list-title">
        {t.library.continueTitle}
      </h2>
      {rows.length ? (
        <ul className={plainListClass}>
          {rows.slice(0, SHOWN).map(({ edit, collection, file }) => (
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
        <p className="mo-type-body-medium mo-editor-widget-empty">{history ? t.library.continueEmpty : t.app.loading}</p>
      )}
    </SiteCard>
  );
}
