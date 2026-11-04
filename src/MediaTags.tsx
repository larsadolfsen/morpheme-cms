// The tags of a file in Filer (Media.tsx): its tags as chips and "Tilføj tag", from the file's record (src/fileRecords.mjs).
// Each change is saved at once in its own commit, one save at a time; taps during a save go into the next.
// Exposes MediaTags; uses MultiChoice and SheetLink (ui.tsx), setTags (fileTags.mjs), writeRecords (fileRecords.mjs).
import { useRef, useState, type ReactElement } from 'react';
import { config } from '@site/editor';
import type { Env } from './App';
import { kindAndName, savedText } from './deploy';
import { leaveTo } from './FormFrame';
import { kindOf } from './FileView';
import { recordFor, recordsIn, writeRecords, type StoredRecord } from './fileRecords.mjs';
import { setTags } from './fileTags.mjs';
import type { RepoFile } from './github';
import { siteT, t } from './i18n';
import { MultiChoice, SheetLink } from './ui';

const fileName = (src: string) => src.split('/').pop() ?? '';

export default function MediaTags({ src, files, env }: { src: string; files: RepoFile[]; env: Env }): ReactElement {
  // The record as last stored: from the files at first, then from each save's result (the files may not have updated yet).
  const stored = useRef<StoredRecord | undefined>(recordFor(recordsIn(files, config.fileRecords), src));
  const [value, setValue] = useState<string[]>(stored.current?.record.categories ?? []);
  const running = useRef(false);
  const waiting = useRef<string[] | null>(null);

  // One commit for the tags `next`; throws when it fails.
  async function save(next: string[]) {
    const record = setTags(stored.current?.record, src, next);
    const [change] = writeRecords(stored.current ? [stored.current] : [], config.fileRecords, [{ src, next: record }]);
    if (!change) return;
    const word = t.media.kinds[kindOf(src)].word;
    const text = t.app.changes.edited(kindAndName(word, fileName(src)));
    const oids = await env.commit(siteT.media.commit.tags(siteT.media.kinds[kindOf(src)].word, fileName(src)), [change], text);
    if (change.content === null) {
      stored.current = undefined;
      env.forget([change.path]);
    } else {
      stored.current = { path: change.path, oid: oids[change.path], record };
      env.onSaved({ path: change.path, oid: oids[change.path], text: change.content });
    }
    env.notify({ text: savedText(text), kind: 'saved' });
  }

  // Saves the waiting value, then the next one that came meanwhile; on an error the chips go back to what is stored.
  async function drain() {
    running.current = true;
    while (waiting.current) {
      const next = waiting.current;
      waiting.current = null;
      try {
        await save(next);
      } catch (e) {
        waiting.current = null;
        setValue(stored.current?.record.categories ?? []);
        env.notify({ text: t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      }
    }
    running.current = false;
  }

  function change(next: string[]) {
    setValue(next);
    waiting.current = next;
    if (!running.current) void drain();
  }

  return (
    <div>
      <p className="mb-1 font-medium">{t.media.tags}</p>
      <MultiChoice
        label={t.media.tags}
        options={env.relations.categories}
        value={value}
        add={t.media.addTag}
        keep="categories"
        footer={(close) => (
          <SheetLink
            href="#ny/kategorier"
            onClick={(e) => {
              e.preventDefault();
              close();
              leaveTo('#ny/kategorier');
            }}
          >
            {t.media.createTag}
          </SheetLink>
        )}
        onChange={change}
      />
    </div>
  );
}
