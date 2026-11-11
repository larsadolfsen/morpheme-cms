// The start screen's first lines for a new site: a sentence on the state of the website (StartSentence) and, while the site
// has no page or post of its own, a card with the first things to do (FirstRunCard): write a page, write a blog post, add a
// picture. The card goes away when a page or post exists, and can be closed (kept in this browser). Exposes StartSentence and
// FirstRunCard. The entries are entries.mjs's, the lists START_FAB's, the storage startStorage.ts's.
import { useId, useState } from 'react';
import { Image } from '@phosphor-icons/react';
import { t } from './i18n';
import { START_FAB } from './fabScreens';
import { collections, icons } from './site';
import { entriesOf } from './entries.mjs';
import { keepStored, readStored } from './startStorage';
import { useUpdating } from './siteState';
import type { RepoFile } from './github';
import { SiteCard } from './themeUi';
import { CloseButton, ListItem, plainListClass } from './ui';

export const FIRST_RUN_CLOSED = 'editor-first-run-closed';

const lists = collections.flatMap((c) => (c.kind === 'markdown' && START_FAB.includes(c.id) ? [{ id: c.id, folder: c.folder }] : []));

/** "Your website is live", or "Updating…" from a save until the site has it. */
export function StartSentence() {
  return (
    <p role="status" className="text-on-surface-variant">
      {useUpdating() ? t.library.siteUpdating : t.library.siteLive}
    </p>
  );
}

export function FirstRunCard({ files }: { files: RepoFile[] }) {
  const titleId = useId();
  const [closed, setClosed] = useState(() => readStored<boolean>(FIRST_RUN_CLOSED) === true);
  if (closed || entriesOf(files, lists).length) return null;
  const rows = START_FAB.flatMap((id) => {
    const c = collections.find((x) => x.id === id);
    return c?.create
      ? [{ key: id, icon: icons[id], label: id === 'blog' ? t.library.firstRunPost : t.library.firstRunPage, href: `#new/${id}` }]
      : [];
  });
  return (
    <SiteCard kind="outlined" as="section" aria-labelledby={titleId} className="relative mb-4 [--card-padding:1rem_0_0.5rem]">
      <h2 id={titleId} className="ps-4 pe-14 pb-2 font-medium">
        {t.library.firstRunTitle}
      </h2>
      <CloseButton
        onClick={() => {
          keepStored(FIRST_RUN_CLOSED, true);
          setClosed(true);
        }}
      />
      <ul className={plainListClass}>
        {rows.map((r) => (
          <ListItem key={r.key} href={r.href} icon={r.icon} headline={r.label} arrow />
        ))}
        <ListItem href="#files" icon={Image} headline={t.library.firstRunPicture} arrow />
      </ul>
    </SiteCard>
  );
}
