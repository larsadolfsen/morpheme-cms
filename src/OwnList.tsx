// The page of a list the owner made (`#list/<id>`; the owner's decision of 14 November: "Dynamic lists should work like testimonials, except the user decides what
// fields it has"): the same list page (Library.tsx `List`) and the same item page (DataForm.tsx) as the testimonials have, with the fields of the list's own
// definition. What is new is the round button, a FAB menu here with `Edit list` (it opens the list's edit page, src/OwnListEdit.tsx) and `Add <entry>`, the owner's decisions of 14 and 15 November,
// and the waiting version: making the list and changing its fields is kept (src/listDraft.ts) until a `Save`, the page's own or an item's (App.tsx adds the
// waiting definition to that commit). The state is src/useOwnList.tsx's.
import { List } from './Library';
import ListText from './ListText';
import Screen from './Screen';
import { SaveBar } from './FormFrame';
import { LinkButton, SupportingText } from './ui';
import { ListEditFab } from './CreateFab';
import { t } from './i18n';
import { useOwnList } from './useOwnList';
import { singularOf } from '../lib/ownList.mjs';
import type { RepoFile } from './github';
import type { Env } from './App';

export default function OwnList({ id, files, saved, env }: { id: string; files: RepoFile[]; saved: RepoFile[]; env: Env }) {
  const { definition, collection, pending, saving, status, save } = useOwnList(id, files, saved, env);
  const editAt = `#list/${id}/edit`;
  const bar = pending && <SaveBar saving={saving} onSave={save} />;
  if (definition.fields.length === 0)
    return (
      <Screen title={definition.label} back={{ href: '#lists', label: t.common.parts.lists }} status={status}>
        <div className="editor-text">
          <ListText notes={definition.notes} />
          <SupportingText>{t.ownList.noFields}</SupportingText>
          <LinkButton kind="filled" href={editAt} className="mt-4">
            {t.ownList.edit}
          </LinkButton>
        </div>
        {bar}
      </Screen>
    );
  return (
    <List
      collection={collection}
      files={files}
      env={env}
      own={{
        status,
        before: <ListText notes={definition.notes} />,
        fab: <ListEditFab id={id} entry={singularOf(definition.label) || 'item'} />,
        after: bar,
      }}
    />
  );
}
