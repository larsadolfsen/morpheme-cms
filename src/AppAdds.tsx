// What an app adds to the site, on its page: its blocks, the lists it brings and its kinds of the site's lists. Installed,
// each row has its switch and opens a sheet with where it is used and the same switch; not installed, the rows are plain.
// Exposes AppAdds (default). Depends on BlockSettings.tsx (the switches), AppList.tsx (listsOf, entriesOf, kindsOf) and ./ui.
import { useRef, useState } from 'react';
import { BlockSwitch, blockSwitchTexts, KindSwitch, kindSwitchTexts, pagesWith, useOnOff } from './BlockSettings';
import { BottomSheet, Group, LeadingIcon, LinkButton, ListItem, listClass, SheetBody, SheetTitle, Switch } from './ui';
import type { RepoFile } from './github';
import type { Env } from './App';
import { kindKey, type SiteApp } from './apps';
import { offBlocks, siteBlocks } from './registry';
import { t } from './i18n';
import { entriesOf, kindsOf, listsOf } from './AppList';

/** What an app adds but its lists, each on its page under "Blokke" or the name of its list ("Promovering") with a sheet: its blocks, and its kinds of the site's
 * lists (a Mailchimp popup), each with where it is used and its switch; a kind with a button to a new one. */
function addsOf(app: SiteApp, files: RepoFile[]) {
  return [
    ...siteBlocks
      .filter((b) => b.app === app.id)
      .map((b) => ({
        key: b.type,
        icon: b.icon,
        label: b.label,
        hint: b.hint,
        block: b,
        create: undefined,
        uses: pagesWith(b.type, files).map((p) => ({ href: `#${p.path}`, title: p.title })),
      })),
    ...kindsOf(app).map((k) => ({
      ...k,
      block: undefined,
      create: k.create ? { href: `#ny/${k.key}/${app.id}`, label: k.create } : undefined,
      uses: entriesOf(app, k.key, files),
    })),
  ];
}

type Add = ReturnType<typeof addsOf>[number];

/** The row of a block (or a kind of a list) an installed app adds: tapped, it opens its sheet; at its end the switch
 * that turns it on or off, as the one in the sheet ("Aktiveret"), saved at once. Used, it cannot be turned off, and
 * the switch says why. The only switch in a row (CLAUDE.md). */
function SwitchedRow({
  app,
  add,
  env,
  files,
  busy,
  onBusy,
  onOpen,
}: {
  app: SiteApp;
  add: Add;
  env: Env;
  files: RepoFile[];
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onOpen: () => void;
}) {
  const count = add.uses.length;
  const id = add.block ? add.block.type : kindKey(add.key, app.id);
  const texts = add.block ? blockSwitchTexts(add.block, count) : kindSwitchTexts(app, add.key, count);
  const { on, saving, turn } = useOnOff(id, count, texts, env, files);
  return (
    <ListItem
      aria-haspopup="dialog"
      onClick={onOpen}
      icon={add.icon}
      headline={add.label}
      supporting={add.hint}
      actions={
        <span className="shrink-0 pr-4">
          <Switch
            label={t.apps.activeOf(add.label)}
            selected={on}
            texts={[t.blockSettings.on, t.blockSettings.off]}
            disabled={busy || saving}
            onChange={async (next) => {
              onBusy(true);
              try {
                await turn(next);
              } finally {
                onBusy(false);
              }
            }}
          />
        </span>
      }
    />
  );
}

/** What it adds: its blocks under "Blokke", the lists it brings under "Lister" (as on "Lister", each opening its
 * list), and its kinds under the name of the list they are added to ("Promovering"). `on`: it is installed. */
export default function AppAdds({ app, env, files, on }: { app: SiteApp; env: Env; files: RepoFile[]; on: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  // While one row's switch saves, the others wait.
  const [switching, setSwitching] = useState(false);
  const adds = addsOf(app, files);
  const lists = listsOf(app, files);
  const open = adds.find((a) => a.key === openKey);

  // What it adds under a heading. Installed, each row opens its sheet and has its switch at its end.
  const addsGroup = (title: string, items: typeof adds) =>
    items.length > 0 && (
      <Group key={title} title={title}>
        {items.map((a) =>
          on ? (
            <SwitchedRow
              key={a.key}
              app={app}
              add={a}
              env={env}
              files={files}
              busy={switching}
              onBusy={setSwitching}
              onOpen={() => {
                setOpenKey(a.key);
                dialog.current?.showModal();
              }}
            />
          ) : (
            <ListItem key={a.key} icon={a.icon} headline={a.label} supporting={a.hint} />
          ),
        )}
      </Group>
    );

  return (
    <>
      {addsGroup(
        t.apps.blocks,
        adds.filter((a) => a.block),
      )}
      {lists.length > 0 && (
        <Group title={t.apps.lists}>
          {lists.map((l) => (
            // Installed, a row opens its list.
            <ListItem key={l.key} href={on ? l.href : undefined} icon={l.icon} headline={l.label} count={l.count} arrow={on} />
          ))}
        </Group>
      )}
      {[...new Set(adds.flatMap((a) => (a.block ? [] : [a.more])))].map((title) =>
        addsGroup(
          title,
          adds.filter((a) => !a.block && a.more === title),
        ),
      )}
      <BottomSheet
        ref={dialog}
        aria-label={open?.label}
        onClose={(e) => e.target === e.currentTarget && setOpenKey(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <SheetTitle title={open?.label ?? ''} onClose={() => dialog.current?.close()} />
        {open && (
          <SheetBody>
            <div className="flex items-start gap-3">
              <LeadingIcon icon={open.icon} />
              <p className="pt-1.5 text-muted">{open.hint ?? open.label}</p>
            </div>
            {open.block ? (
              <BlockSwitch block={open.block} env={env} files={files} />
            ) : (
              <KindSwitch app={app} list={open.key} env={env} files={files} />
            )}
            {open.create && !offBlocks(files).includes(kindKey(open.key, app.id)) && (
              <LinkButton href={open.create.href} wide onClick={() => dialog.current?.close()}>
                {open.create.label}
              </LinkButton>
            )}
            <div>
              <p className="mb-1 font-medium">{t.apps.used}</p>
              {open.uses.length ? (
                <ul className={listClass}>
                  {open.uses.map((u) => (
                    <ListItem key={u.href} href={u.href} onClick={() => dialog.current?.close()} headline={u.title} />
                  ))}
                </ul>
              ) : (
                <p className="text-muted">{t.apps.notUsed}</p>
              )}
            </div>
          </SheetBody>
        )}
      </BottomSheet>
    </>
  );
}
