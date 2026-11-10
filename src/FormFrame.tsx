// What every form in the editor has around its fields: the top bar with the way back and a link to
// the page on the site, "Delete" below the fields where entries can be deleted, and a bar at the bottom
// of the screen with "Save" (across the bar on a phone, at its end from medium), which is only there when something
// has been changed. Messages are shown by the app (Env.notify); the first "Save" asks whether the editor may also send notifications.
// Leaving with changes that are not saved asks first, to save them or not (in the editor's dialog;
// closing or reloading the page asks in the browser's own). "Preview" beside "Save" and, as a page action (Screen.tsx `pageActions`:
// the end of the title row from expanded, the top bar below it), shows the page with
// what is in the form, before it is saved (pagePreview.tsx).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowSquareOut, Binoculars, Trash } from '@phosphor-icons/react';
import Screen, { type Back } from './Screen';
import { Button, Group, IconButton, IconLink, LoadingIndicator, type TabChoice, ListItem } from './ui';
import { hasUnsaved, setUnsaved } from './deploy';
import { askToNotify } from './notificationData';
import { choose } from './ask';
import { when } from './when';
import type { Env } from './App';
import { t } from './i18n';

import type { Edit } from './schema';
import type { EditorType } from './notificationData';

// `kind`: what kind of notification it is (notificationData.ts: `site`, `saved`, `failed`), kept under "Notifications";
// without it, it is only shown at the bottom (something going on, a form that cannot be saved).
export type Status = { text: string; error?: boolean; edit?: Edit; kind?: EditorType } | null;

type Props<T extends string> = {
  title: string;
  /** The way back; leaving asks first while something is unsaved, unless it has a `guard` of its own (a field's page
   * goes back to its form, which keeps what is unsaved). */
  back: Back;
  status?: ReactNode;
  view?: string;
  /** More in the top bar, before the link to the site. */
  actions?: ReactNode;
  /** The button at the end of the top bar, after the notifications. */
  drawer?: ReactNode;
  /** The form's tabs, in the top bar (Screen). */
  tabs?: TabChoice<T>;
  dirty: boolean;
  saving: boolean;
  // Deleting the entry: "Deleting" instead of "Saving".
  deleting?: boolean;
  /** Saves the form; true when it was saved (not when it said why not, or the owner chose not to). */
  onSave: () => Promise<unknown>;
  /** "Preview" beside "Save" and in the top bar (pagePreview.tsx). */
  onPreview?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  /** The fields beside the text on a wide computer screen (FormColumns in ui.tsx). */
  panel?: boolean;
  /** A list (the menu): as wide as the other lists on a computer. */
  wide?: boolean;
  children: ReactNode;
};

// When a file was last saved (Env.savedAt), for the top bar: undefined while it is being asked, null
// when it is not known (a new file). Set it to the time of a save.
export function useSavedAt(env: Env, path: string) {
  const [savedAt, setSavedAt] = useState<Date | null | undefined>(path ? undefined : null);
  useEffect(() => {
    if (path)
      env.savedAt([path]).then(
        (t) => setSavedAt(t[path] ?? null),
        () => setSavedAt(null),
      );
  }, []);
  return [savedAt, setSavedAt] as const;
}

// The top bar's line under the title: deleting, saving, or when the file was last saved.
export function savedStatus({
  savedAt,
  saving,
  deleting,
  isNew,
}: {
  savedAt?: Date | null;
  saving: boolean;
  deleting?: boolean;
  isNew?: boolean;
}) {
  if (deleting) return <LoadingIndicator>{t.app.busy.deleting}</LoadingIndicator>;
  if (saving) return <LoadingIndicator>{t.app.busy.saving}</LoadingIndicator>;
  if (savedAt) return t.app.lastSaved(when(savedAt));
  return isNew ? t.app.notSavedYet : undefined;
}

// The open form's save (onSave, with the question about notifications), while something is unsaved.
let saveOpen: (() => Promise<boolean>) | null = null;

/** Asks, while something is unsaved ("Save the changes?"), whether to save it first ("Save", the main one) or leave
 * it ("Discard"); Esc stays. True when the editor may go on: nothing unsaved, it was saved, or it is left. A save that fails or stops (a field not filled in, an address that is taken) stays. */
export async function mayLeave() {
  if (!hasUnsaved()) return true;
  const answer = await choose({
    title: t.app.unsavedTitle,
    text: t.app.unsaved,
    choices: [...(saveOpen ? [{ value: 'save', label: t.common.save }] : []), { value: 'discard', label: t.app.discard }],
    // A choice to make: no "Cancel"; Esc stays on the screen (null), so nothing is lost.
    cancel: false,
  });
  if (!answer) return false;
  if (answer.choice === 'save' && !(await saveOpen?.())) return false;
  setUnsaved(false);
  return true;
}

// The addresses of the open form and of its fields' pages of their own (Field.page, CompanyForm.tsx): the editor goes
// between them without leaving the form (App.tsx), so it keeps what is in it, saved or not, and asks nothing.
let formPages: string[] = [];

/** Keeps the addresses of the open form and of its fields' pages while it is open. */
export function useFormPages(pages: string[]) {
  const key = pages.join('\n');
  useEffect(() => {
    formPages = key.split('\n');
    return () => {
      formPages = [];
    };
  }, [key]);
}

/** Whether going from one address (a route) to another stays in the open form: to one of its fields' pages, or back. */
export const inForm = (from: string, to: string) => from !== to && formPages.includes(from) && formPages.includes(to);

// Goes to another screen of the editor (a hash, or a way there, e.g. nav.ts up), asking first while
// something is unsaved.
export function leaveTo(to: string | (() => void)) {
  const go = typeof to === 'string' ? () => (location.hash = to) : to;
  void mayLeave().then((yes) => yes && go());
}

export default function FormFrame<T extends string>({
  title,
  back,
  status,
  view,
  actions,
  drawer,
  tabs,
  dirty,
  saving,
  deleting,
  onSave,
  onPreview,
  onDelete,
  deleteLabel,
  panel,
  wide,
  children,
}: Props<T>) {
  const save = useRef(onSave);
  save.current = onSave;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    // The editor does not reload itself to a newer version meanwhile (deploy.ts keepCurrent).
    setUnsaved(true);
    saveOpen = async () => {
      askToNotify();
      return (await save.current()) === true;
    };
    return () => {
      window.removeEventListener('beforeunload', warn);
      setUnsaved(false);
      saveOpen = null;
    };
  }, [dirty]);

  return (
    <Screen
      title={title}
      status={status}
      panel={panel}
      wide={wide}
      drawer={drawer}
      tabs={tabs}
      back={{ guard: leaveTo, ...back }}
      actions={actions}
      pageActions={
        <>
          {onPreview && <IconButton icon={Binoculars} label={t.preview.button} aria-haspopup="dialog" onClick={onPreview} />}
          {view && <IconLink href={view} target="_blank" rel="noopener" label={t.app.viewOnSite} icon={ArrowSquareOut} />}
        </>
      }
    >
      <div className="space-y-6">{children}</div>
      {onDelete && (
        <div className="mt-12">
          <Group>
            <ListItem
              tone="delete"
              disabled={saving}
              onClick={onDelete}
              headline={
                <span className="inline-flex items-center gap-3">
                  <Trash size={18} />
                  {deleting ? <LoadingIndicator>{t.app.busy.deleting}</LoadingIndicator> : (deleteLabel ?? t.common.delete)}
                </span>
              }
            />
          </Group>
        </div>
      )}
      {(dirty || saving) && (
        <div className="editor-save-bar fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant bg-surface-container-lowest/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className="mx-auto max-w-3xl px-4 py-3 medium:px-6">
            {/* Preview beside Save, at the end of the bar, each as wide as its label. */}
            <div className="flex justify-end gap-2">
              {onPreview && (
                <Button kind="outlined" icon={Binoculars} aria-haspopup="dialog" onClick={onPreview}>
                  {t.preview.button}
                </Button>
              )}
              <Button
                disabled={saving}
                busy={saving && !deleting}
                onClick={() => {
                  askToNotify();
                  void onSave();
                }}
              >
                {t.common.saveChanges}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
