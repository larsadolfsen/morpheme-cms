// Several single data files edited on one screen (Appearance › Header: the two menus and header.json): each one's values
// in the form and as they were saved, a change to them, whether any is changed, the field that keeps one from being saved,
// and "Gem ændringer", which saves each changed file in its own commit, as SideColumn.tsx saves its file. Exposes
// useDataFiles. Uses dataFileValues.ts, check.ts (problemAt), fields.tsx (useWrongField) and Env (App.tsx).
import { useMemo, useState } from 'react';
import type { DataFile, FilesCollection } from './schema';
import { ConflictError, type RepoFile } from './github';
import { problemAt } from './check';
import { useWrongField, type Wrong } from './fields';
import { dataFileIn, dataOf, fieldsOf, valuesOf } from './dataFileValues';
import { asWritten } from './site';
import { changesText, lower, savedText } from './deploy';
import type { Env } from './App';
import { siteT, t } from './i18n';

/** A file on the screen: its collection and the file. */
export type DataFilePart = { collection: FilesCollection; dataFile: DataFile };

type Values = Record<string, unknown>;

/** `onWrong`: a file's field keeps it from being saved (its place in `parts`, the field's path), before it is marked: so
 * the screen can open what the field is in. */
export function useDataFiles(env: Env, parts: DataFilePart[], onWrong?: (i: number, path: string) => void) {
  const { notify } = env;
  // The files as last saved (or loaded); an optional one the site has not got yet is empty (dataFileIn).
  const [bases, setBases] = useState<RepoFile[]>(() =>
    parts.map((p) => dataFileIn(env.files, p.dataFile) ?? { path: p.dataFile.file, oid: '', text: '{}\n' }),
  );
  const read = (i: number, text: string) => valuesOf(text, fieldsOf(parts[i].dataFile), parts[i].dataFile, parts[i].collection, env.files);
  const initial = useMemo(() => bases.map((b, i) => read(i, b.text)), [bases]);
  const [values, setValues] = useState<Values[]>(initial);
  const [saving, setSaving] = useState(false);
  // The field that keeps a file from being saved, marked in that file's fields only (the menus have the same paths).
  const wrongField = useWrongField((text) => notify({ text, error: true }));
  const [wrongIn, setWrongIn] = useState(-1);
  const changed = values.flatMap((v, i) => (JSON.stringify(v) !== JSON.stringify(initial[i]) ? [i] : []));

  async function save() {
    // Every changed file is right before any is saved.
    for (const i of changed) {
      const problem = problemAt(fieldsOf(parts[i].dataFile), values[i]);
      if (problem) {
        setWrongIn(i);
        onWrong?.(i, problem.path);
        wrongField.stop(problem);
        return false;
      }
    }
    const texts = changed
      .map((i) => ({ i, text: `${JSON.stringify(dataOf(fieldsOf(parts[i].dataFile), values[i], parts[i].dataFile), null, 2)}\n` }))
      .filter(({ i, text }) => text !== bases[i].text);
    if (!texts.length) {
      notify({ text: t.forms.nothingToSave });
      return false;
    }
    setSaving(true);
    notify({ text: t.common.saving });
    const done: string[] = [];
    try {
      for (const { i, text } of texts) {
        const { dataFile } = parts[i];
        const path = bases[i].path;
        const change = t.app.changes.edited(lower(dataFile.label));
        const message = siteT.forms.commit.edit(asWritten(dataFile).label.toLowerCase());
        const oids = await env.commit(message, [{ path, content: text, oid: bases[i].oid || null }], change);
        const saved = { path, oid: oids[path], text };
        setBases((all) => all.map((b, j) => (j === i ? saved : b)));
        setValues((all) => all.map((v, j) => (j === i ? read(i, text) : v)));
        env.onSaved(saved);
        done.push(change);
      }
      notify({ text: savedText(changesText(done)), kind: 'saved' });
      return true;
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    /** Each file's values in the form, and as they were saved (in the same form, for what the preview changes). */
    values,
    initial,
    /** Sets one file's values (by its place in `parts`). */
    set: (i: number, v: Values) => setValues((all) => all.map((x, j) => (j === i ? v : x))),
    dirty: changed.length > 0,
    saving,
    save,
    /** The field marked in a file's fields (WrongField), or null. */
    wrong: (i: number): Wrong | null => (wrongIn === i ? wrongField.field : null),
  };
}
