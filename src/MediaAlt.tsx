// The text of an image in Files (Media.tsx): its base alternative text ("Describe the image"), "Decorative image" and its caption, from the
// image's record (src/fileRecords.mjs). Every use of the image starts from this text unless that place has its own (src/imageAlt.mjs).
// A text is saved when the field is left, the switch at once, each in its own commit, one save at a time; a change during a save goes into the next.
// Exposes MediaAlt; uses TextField and SwitchRow (ui.tsx), withAltText (fileTags.mjs), writeRecords (fileRecords.mjs).
import { useRef, useState, type ReactElement } from 'react';
import { config } from '@site/editor';
import type { Env } from './App';
import { kindAndName, savedText } from './deploy';
import { kindOf } from './FileView';
import { recordFor, recordsIn, writeRecords, type StoredRecord } from './fileRecords.mjs';
import { withAltText } from './fileTags.mjs';
import type { RepoFile } from './github';
import { siteT, t } from './i18n';
import { SwitchRow, TextField } from './ui';

const fileName = (src: string) => src.split('/').pop() ?? '';

type Values = { alt: string; decorative: boolean; caption: string };

export default function MediaAlt({ src, files, env }: { src: string; files: RepoFile[]; env: Env }): ReactElement {
  // The record as last stored: from the files at first, then from each save's result (the files may not have updated yet).
  const stored = useRef<StoredRecord | undefined>(recordFor(recordsIn(files, config.fileRecords), src));
  const valuesOf = (record?: StoredRecord['record']): Values => ({
    alt: record?.alt ?? '',
    decorative: !!record?.decorative,
    caption: record?.caption ?? '',
  });
  const [values, setValues] = useState<Values>(() => valuesOf(stored.current?.record));
  const running = useRef(false);
  const waiting = useRef<Values | null>(null);

  // One commit for the values `next`; nothing when they are what is stored; throws when it fails.
  async function save(next: Values) {
    const record = withAltText(stored.current?.record, src, next);
    const [change] = writeRecords(stored.current ? [stored.current] : [], config.fileRecords, [{ src, next: record }]);
    if (!change) return;
    const word = t.media.kinds[kindOf(src)].word;
    const text = t.app.changes.edited(kindAndName(word, fileName(src)));
    const oids = await env.commit(siteT.media.commit.alt(siteT.media.kinds[kindOf(src)].word, fileName(src)), [change], text);
    if (change.content === null) {
      stored.current = undefined;
      env.forget([change.path]);
    } else {
      stored.current = { path: change.path, oid: oids[change.path], record };
      env.onSaved({ path: change.path, oid: oids[change.path], text: change.content });
    }
    env.notify({ text: savedText(text), kind: 'saved' });
  }

  // Saves the waiting values, then the next ones that came meanwhile; on an error the fields go back to what is stored.
  async function drain() {
    running.current = true;
    while (waiting.current) {
      const next = waiting.current;
      waiting.current = null;
      try {
        await save(next);
      } catch (e) {
        waiting.current = null;
        setValues(valuesOf(stored.current?.record));
        env.notify({ text: t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      }
    }
    running.current = false;
  }

  function request(next: Values) {
    waiting.current = next;
    if (!running.current) void drain();
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={t.media.alt}
        hint={t.media.altHint}
        value={values.alt}
        autoComplete="off"
        disabled={values.decorative}
        onChange={(e) => setValues({ ...values, alt: e.target.value })}
        onBlur={() => request(values)}
      />
      <SwitchRow
        label={t.media.decorative}
        hint={t.media.decorativeHint}
        selected={values.decorative}
        onChange={(decorative) => {
          const next = { ...values, decorative };
          setValues(next);
          request(next);
        }}
      />
      <TextField
        label={t.media.caption}
        value={values.caption}
        autoComplete="off"
        onChange={(e) => setValues({ ...values, caption: e.target.value })}
        onBlur={() => request(values)}
      />
    </div>
  );
}
