// The link of some text (the toolbar's and the selection's "Link", MarkdownEditor.tsx), in a sheet
// from the bottom on a phone and a dialog on a computer: a page of the site (PagePicker), or another
// address (another site, an e-mail, a phone number). askLink() opens it and tells what to do; <LinkAsk />
// is in App.tsx, with the pages. An e-mail or a phone number becomes a link of its own kind (mailto:,
// tel:), and an address without https:// gets it.
import { useEffect, useId, useRef, useState } from 'react';
import PagePicker, { type Group } from './PagePicker';
import { Button, ConnectedButtons, BottomSheet, SheetActions, SheetBody, SheetTitle, TextField, atLeastNow } from './ui';
import { usePane } from './PaneHost';
import { closeChanged } from './ask';
import { t } from './i18n';
import { isActionEnter } from '../lib/enterKey.mjs';
import { materialIcon } from './icon';

/** The new address of the link and the text it is shown as (the page's name, the address), '' to
 * remove it, or null when nothing is to be done. */
export type LinkAnswer = { href: string; text: string } | null;

let open: (href: string, resolve: (a: LinkAnswer) => void) => void = () => {};

/** The link's address as it is now ('' for a new one). */
export const askLink = (href: string) => new Promise<LinkAnswer>((resolve) => open(href, resolve));

type Kind = 'page' | 'address';

// An address as it is written: an e-mail as mailto:, a phone number as tel:, a site without https://
// with it; a page's own (/…), a part of the page (#…), one with its kind (https:, mailto:) and
// anything else as it is.
export function hrefOf(typed: string) {
  const s = typed.trim();
  if (!s || /^[/#]/.test(s) || /^[a-z][a-z+.-]*:/i.test(s)) return s;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `mailto:${s}`;
  if (/^\+?[\d\s()-]{6,}$/.test(s)) return `tel:${s.replace(/[\s()-]/g, '')}`;
  if (/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;
  return s;
}

// The address as the owner writes it: without mailto: and tel:.
const typedOf = (href: string) => href.replace(/^(mailto|tel):/, '');

export function LinkAsk({ groups }: { groups: Group[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // From medium (600 dp) the link is in the pane beside the page (owner, 15 Nov 2026: settings are a pane, not a dialog), below it the sheet from
  // the bottom; taken when it opens and kept while it is open.
  const [inPane, setInPane] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const answer = useRef<(a: LinkAnswer) => void>(() => {});
  // The link as it was when the sheet opened, and what it is now.
  const [old, setOld] = useState('');
  const [kind, setKind] = useState<Kind>('page');
  const [page, setPage] = useState('');
  const [address, setAddress] = useState('');

  const pages = useRef(groups);
  pages.current = groups;
  // The page of an address, also with a part of it (/contact/#directions).
  const pageOf = (href: string) => {
    const all = pages.current.flatMap((g) => g.options);
    return all.find((o) => o.value === href) ?? all.find((o) => o.value === href.replace(/#.*/, ''));
  };

  useEffect(() => {
    open = (href, resolve) => {
      answer.current = resolve;
      const onSite = !href || !!pageOf(href);
      setOld(href);
      setKind(onSite ? 'page' : 'address');
      setPage(onSite ? href : '');
      setAddress(onSite ? '' : typedOf(href));
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const wide = atLeastNow('medium');
      setInPane(wide);
      if (!wide) dialog.current?.showModal();
    };
  }, []);

  const href = kind === 'page' ? page : hrefOf(address);
  const done = (a: LinkAnswer) => {
    answer.current(a);
    answer.current = () => {};
    if (inPane) void pane.close().then(() => setInPane(false));
    else dialog.current?.close();
  };
  const use = () => href && done({ href, text: kind === 'page' ? (pageOf(href)?.label ?? href) : address.trim() });
  // Closed with a change: the owner is asked whether to keep it (Keep), leave it (Discard) or stay.
  async function leave() {
    if (href === old || !href) return done(null);
    const choice = await closeChanged();
    if (choice === 'keep') use();
    else if (choice === 'discard') done(null);
  }

  // What the link has: page or address, and the field of each.
  const fields = (
    <>
      <ConnectedButtons
        label={t.text.linkTo}
        value={kind}
        options={[
          { value: 'page', label: t.text.linkPage },
          { value: 'address', label: t.text.linkAddress },
        ]}
        onChange={setKind}
      />
      {kind === 'page' ? (
        <PagePicker id="link-page" inField={{ label: t.text.linkPage }} value={page} groups={groups} required onChange={setPage} />
      ) : (
        <TextField
          id="link-address"
          label={t.forms.address}
          hint={t.text.linkAddressHint}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => isActionEnter(e) && (e.preventDefault(), use())}
        />
      )}
    </>
  );
  const remove = old && (
    <Button kind="outlined" icon={materialIcon('delete')} onClick={() => done({ href: '', text: '' })}>
      {t.text.removeLink}
    </Button>
  );
  const pane = usePane(
    inPane
      ? {
          headline: t.text.link,
          headlineId: headingId,
          beforeClose: async () => {
            await leave();
            return false;
          },
          opener: opener.current,
          onBack: () => void leave(),
          backLabel: t.common.back,
          actions: (
            <>
              <Button disabled={!href} onClick={use}>
                {old ? t.common.save : t.text.insertLink}
              </Button>
              <Button kind="outlined" onClick={() => void leave()}>
                {t.common.cancel}
              </Button>
              {remove}
            </>
          ),
          children: <div className="mo-editor-stack-250">{fields}</div>,
        }
      : null,
  );

  return (
    <>
      <BottomSheet
        ref={dialog}
        aria-label={t.text.link}
        // A page picked in the sheet over it closes that one, not this.
        onClose={(e) => e.target === e.currentTarget && answer.current(null)}
        onCancel={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          void leave();
        }}
        onClick={(e) => e.target === dialog.current && void leave()}
      >
        <SheetTitle title={t.text.link} onClose={() => void leave()} />
        {!inPane && <SheetBody>{fields}</SheetBody>}
        {!inPane && (
          <SheetActions
            onCancel={() => void leave()}
            onDone={use}
            disabled={!href}
            done={old ? t.common.save : t.text.insertLink}
            start={remove}
          />
        )}
      </BottomSheet>
      {pane.portal}
    </>
  );
}
