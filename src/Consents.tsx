// "Consents" (#privacy/consents, Part.opens 'consents'): the visitors' answers in the cookie banner, as the site's
// Worker keeps them (consentData.ts, packages/editor/worker/consent.js), newest first, so the site can show that a visitor said yes. Over
// the list the search by consent id (the one the banner shows the visitor under "Cookieindstillinger", asked of the
// Worker, so older answers are found too) and the order (kept in this browser); in the top bar the download of all of
// them as CSV. Tapping one opens a sheet with when, the banner's version and each yes or no, and the button that deletes
// every answer with its id (when the visitor asks for it).
import { useEffect, useRef, useState } from 'react';
import { ArrowsDownUp, DownloadSimple, Trash } from '@phosphor-icons/react';
import { ask } from './ask';
import Screen from './Screen';
import {
  Button,
  Choice,
  EmptyNote,
  Group,
  IconLink,
  listClass,
  ProblemNote,
  SearchRow,
  SheetBody,
  SheetTitle,
  SupportingText,
  BottomSheet,
  useKept,
  ListItem,
} from './ui';
import type { Env } from './App';
import { CONSENT_API, deleteConsents, loadConsents, type ConsentAnswer } from './consentData';
import { CONSENT_CATEGORIES } from '../lib/cookieCategories.mjs';
import { when } from './when';
import { t } from './i18n';

type Sort = 'newest' | 'oldest';
const SORTS: Sort[] = ['newest', 'oldest'];
const SORT_KEY = 'editor-sort-consents';

// The yes and the no of an answer as one line, in the banner's order: "Ja: Statistik · Nej: Marketing".
function summary(answer: ConsentAnswer) {
  const names = t.blocks.cookies.entries.categories;
  const asked = CONSENT_CATEGORIES.filter((c) => c in answer.choices);
  const yes = asked.filter((c) => answer.choices[c]).map((c) => names[c]);
  const no = asked.filter((c) => !answer.choices[c]).map((c) => names[c]);
  return [yes.length && `${t.consents.yes}: ${yes.join(', ')}`, no.length && `${t.consents.no}: ${no.join(', ')}`]
    .filter(Boolean)
    .join(' · ');
}

export default function Consents({ env, back }: { env: Env; back: { href: string; label: string } }) {
  const [query, setQuery] = useKept('consents-search', '');
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'newest';
  });
  // undefined while loading, null when the site does not keep them.
  const [found, setFound] = useState<{ entries: ConsentAnswer[]; total: number } | null>();
  const [problem, setProblem] = useState('');
  const [open, setOpen] = useState<ConsentAnswer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const q = query.trim().toLowerCase();

  // Asked of the Worker as the search changes (a moment after the last key), so answers older than the newest are found.
  useEffect(() => {
    let current = true;
    const timer = setTimeout(
      () =>
        loadConsents(q)
          .then((result) => current && (setFound(result), setProblem('')))
          .catch((e) => current && setProblem(t.consents.notLoaded((e as Error).message))),
      q ? 300 : 0,
    );
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }

  async function remove(id: string) {
    if (!(await ask(t.consents.deleteAsk(id), t.common.delete))) return;
    setDeleting(true);
    try {
      const n = await deleteConsents(id);
      setFound((was) => was && { entries: was.entries.filter((e) => e.id !== id), total: was.total - n });
      dialog.current?.close();
      env.notify({ text: t.consents.deleted, kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.consents.notDeleted((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setDeleting(false);
    }
  }

  const shown = [...(found?.entries ?? [])].sort((a, b) => (sort === 'newest' ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at)));
  return (
    <Screen
      title={t.consents.title}
      wide
      back={back}
      status={found ? t.consents.count(found.total) : undefined}
      actions={found && <IconLink icon={DownloadSimple} label={t.consents.download} href={`${CONSENT_API}?format=csv`} download />}
    >
      <p className="mb-4 text-muted">{t.consents.intro}</p>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={t.consents.searchLabel}
        sort={
          <Choice
            title={t.library.sort}
            icon={ArrowsDownUp}
            value={sort}
            options={SORTS.map((s) => ({ value: s, label: t.consents.sorts[s] }))}
            onChange={pickSort}
          />
        }
        className="mb-6"
      />
      {problem && <ProblemNote>{problem}</ProblemNote>}
      {found === undefined && !problem && <EmptyNote busy>{t.consents.loading}</EmptyNote>}
      {found === null && <EmptyNote>{t.consents.notKept}</EmptyNote>}
      {found &&
        (shown.length ? (
          <Group>
            {shown.map((a) => (
              <ListItem
                key={`${a.id}-${a.at}`}
                onClick={() => setOpen(a)}
                headline={a.id}
                supporting={
                  <>
                    {when(new Date(a.at))} · {summary(a)}
                  </>
                }
              />
            ))}
          </Group>
        ) : (
          <ul className={listClass}>
            <EmptyNote item>{t.consents.none(q)}</EmptyNote>
          </ul>
        ))}
      <BottomSheet
        ref={dialog}
        onClose={(e) => e.target === e.currentTarget && setOpen(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <SheetTitle title={open?.id ?? ''} onClose={() => dialog.current?.close()} />
        {open && (
          <SheetBody onSubmit={(e) => e.preventDefault()}>
            <SupportingText>{t.consents.answered(when(new Date(open.at)))}</SupportingText>
            <SupportingText>{summary(open)}</SupportingText>
            {open.version && <SupportingText>{t.consents.version(open.version.slice(0, 7))}</SupportingText>}
            <Button kind="outlined" icon={Trash} disabled={deleting} onClick={() => remove(open.id)}>
              {t.consents.deleteAll}
            </Button>
          </SheetBody>
        )}
      </BottomSheet>
    </Screen>
  );
}
