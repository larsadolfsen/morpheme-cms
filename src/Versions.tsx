// "Tidligere versioner": the commits that changed a form's file (github.ts versionsOf), newest first, with when and by
// whom, 20 at a time: the last section of a page's or a post's form (VersionList), and in the other forms a sheet
// opened by the clock in the top bar (VersionsButton). The newest is the
// version saved now. Tapping an earlier one opens it in the form as changes that are not saved yet
// (EntryForm.tsx, DataForm.tsx, with a Notice at the top): "Gem ændringer" makes it the current
// version, in a new commit, so nothing is lost and every version can always be found here again.
import { Component, Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { Button, EmptyNote, IconButton, listClass, Notice, BottomSheet, SheetTitle, SheetBody, ProblemNote, ListItem } from './ui';
import { mayLeave } from './FormFrame';
import { when } from './when';
import type { Env } from './App';
import type { Version } from './github';
import { locale, siteLocale, t } from './i18n';

/** An earlier version shown in a form: its text, and when it was saved. */
export type ShownVersion = { text: string; at: Date };

// "i dag kl. 13.42" as "I dag kl. 13.42", alone on its line.
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/** When a version was saved, in the site's language: for the commit that brings it back. */
export const savedOn = (v: ShownVersion) => v.at.toLocaleString(siteLocale, { dateStyle: 'medium', timeStyle: 'short' });

/** A form that can show an earlier version: started again with each version, and with the one saved
 * now when it cannot show one (a file from before the form was changed): then it says so. */
export function WithVersions({
  notify,
  children,
}: {
  notify: Env['notify'];
  children: (version: ShownVersion | null, onVersion: (v: ShownVersion | null) => void) => ReactNode;
}) {
  const [version, setVersion] = useState<ShownVersion | null>(null);
  if (!version) return <Fragment key="now">{children(null, setVersion)}</Fragment>;
  return (
    <Unreadable
      key={version.at.getTime()}
      onError={() => {
        setVersion(null);
        notify({ text: t.history.cannotShow, error: true });
      }}
    >
      {children(version, setVersion)}
    </Unreadable>
  );
}

// Catches an error while a version is shown, so the editor goes on (React needs a class for that).
class Unreadable extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// The versions of a file, loaded 20 at a time (`load`, again from the newest without `after`), and how one is opened in
// the form (`pick`: asks first while something is unsaved, then fetches the file as it was; true when it was opened).
function useVersionList(env: Env, path: string, onPick: (v: ShownVersion) => void) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [more, setMore] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(after?: string) {
    setLoading(true);
    setProblem('');
    try {
      const page = await env.versions(path, after);
      setVersions((was) => [...(after ? (was ?? []) : []), ...page.versions]);
      setMore(page.more);
    } catch (e) {
      setProblem(t.history.notLoaded((e as Error).message));
    } finally {
      setLoading(false);
    }
  }

  async function pick(v: Version) {
    if (!(await mayLeave())) return false;
    env.notify({ text: t.history.opening });
    try {
      const text = await env.versionText(v, path);
      if (text === null) {
        env.notify({ text: t.history.notThere, error: true });
        return false;
      }
      onPick({ text, at: v.at });
      env.notify(null);
      return true;
    } catch (e) {
      env.notify({ text: t.history.notOpened((e as Error).message), error: true });
      return false;
    }
  }

  return { versions, more, problem, loading, load, pick };
}

// The versions as rows, newest first: the one saved now first (it cannot be picked), each with when and by whom, and
// "Vis ældre versioner" under them while there are more.
function VersionRows({ list, onPick }: { list: ReturnType<typeof useVersionList>; onPick: (v: Version) => void }) {
  const { versions, more, problem, loading, load } = list;
  return (
    <>
      {problem && <ProblemNote>{problem}</ProblemNote>}
      {!versions && !problem && <EmptyNote busy>{t.history.loading}</EmptyNote>}
      {versions && versions.length < 2 && !more && <p className="text-muted">{t.history.none}</p>}
      {versions && versions.length > 0 && (
        <ul className={listClass}>
          {versions.map((v, i) => (
            <ListItem
              key={v.commit}
              onClick={i === 0 ? undefined : () => onPick(v)}
              headline={capital(when(v.at))}
              supporting={i === 0 ? t.history.current : v.by && t.history.by(v.by)}
              truncate
            />
          ))}
        </ul>
      )}
      {more && (
        <Button kind="outlined" busy={loading} onClick={() => load(more)}>
          {t.history.more}
        </Button>
      )}
    </>
  );
}

/** The clock in the top bar of a form (DataForm.tsx), and the sheet with the versions. `onPick` opens one in the form. */
export function VersionsButton({ env, path, onPick }: { env: Env; path: string; onPick: (v: ShownVersion) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useVersionList(env, path, onPick);

  function open() {
    dialog.current?.showModal();
    // Asked again each time, so a save since is among them.
    void list.load();
  }

  return (
    <>
      <IconButton icon={ClockCounterClockwise} label={t.history.versions} aria-haspopup="dialog" onClick={open} />
      <BottomSheet ref={dialog} aria-label={t.history.versions} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <SheetTitle title={t.history.versions} onClose={() => dialog.current?.close()} />
        <SheetBody>
          <VersionRows
            list={list}
            onPick={(v) => {
              dialog.current?.close();
              void list.pick(v);
            }}
          />
        </SheetBody>
      </BottomSheet>
    </>
  );
}

/** The versions as the last section of a page's or a post's form (EntryForm.tsx), under its heading there: loaded when
 * the form opens (so the page is as long as it will be when the drawer scrolls to them), and again after each save
 * (`oid`, the file's version saved now). A version picked
 * opens in the form, which goes up to its top, where it says which version it is (VersionNotice). */
export function VersionList({ env, path, oid, onPick }: { env: Env; path: string; oid: string; onPick: (v: ShownVersion) => void }) {
  const list = useVersionList(env, path, onPick);
  useEffect(() => {
    void list.load();
  }, [oid]);
  const pick = async (v: Version) => {
    if (!(await list.pick(v))) return;
    requestAnimationFrame(() => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  };
  return (
    <div className="space-y-4">
      <VersionRows list={list} onPick={(v) => void pick(v)} />
    </div>
  );
}

/** At the top of a form that shows an earlier version: when it is from, what saving does, and the way
 * back to the version saved now. */
export function VersionNotice({ version, onCurrent }: { version: ShownVersion; onCurrent: () => void }) {
  return (
    <Notice
      title={t.history.shownTitle(when(version.at))}
      action={
        <Button kind="outlined" size="small" onClick={onCurrent}>
          {t.history.showCurrent}
        </Button>
      }
    >
      {t.history.shownText}
    </Notice>
  );
}
