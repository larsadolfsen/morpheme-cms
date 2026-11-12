// The editor's main menu (App.tsx renders it): the drawer (ui.tsx MainDrawer) in two levels. The first lists Home and the
// sections; a section opens its list, under a back row, with the open screen marked and its fold-out folded out. Apps lists
// Appstore and a row per app installed. From medium and wider the first level is also the collapsed navigation rail
// (MainRailItem), whose sections open the drawer at their list. The drawer's header is the signed-in user (AccountRow), a link
// to the account. The cog (Settings, #settings) is pinned at the bottom of the first level and of the rail; it is marked on
// Settings and every screen under it. The levels are not steps in the history: in the modal drawer the phone's back gesture goes to the screen
// before, as everywhere else, and closes the drawer. Exposes MainMenu. The tree and the open place are lib/menu.mjs
// (menuTree, currentPlace); it only wires them to the drawer.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gear } from '@phosphor-icons/react';
import { config, header } from '@site/editor';
import { currentPlace, menuTree } from '../lib/menu.mjs';
import { STORE_ROUTE } from './store';
import { collectionOf } from './schema';
import { apps, collections, companyParts, groups, icons, lists, partScreens, settings } from './site';
import { partOf } from './Library';
import { AccountRow } from './AccountRow';
import { childrenOf } from './menuChildren';
import { t } from './i18n';
import { useMenuOpen } from './menuOpen';
import {
  MainDrawer,
  MainDrawerBack,
  MainDrawerFold,
  MainDrawerItem,
  MainDrawerLevel,
  MainDrawerSection,
  MainDrawerSectionItem,
  MainDrawerSubitem,
  MainRailItem,
  MainRailSectionItem,
  useMenuLayout,
} from './ui';
import type { RepoFile, Viewer } from './github';

// The icon of a row: an app's own, a part of the business its own, else the menu's icon for the id.
const iconOf = (section: string, id: string) =>
  (section === 'apps' && apps.find((a) => a.id === id)?.icon) ||
  (section === 'company' && companyParts.find((p) => p.id === id)?.icon) ||
  icons[id];

export function MainMenu({ route, files, user }: { route: string; files: RepoFile[] | null; user: Viewer | null }) {
  const { open, setOpen } = useMenuOpen();
  const tree = useMemo(
    () =>
      menuTree(
        groups,
        (id: string) => partOf(id, files ?? []),
        (id: string) => childrenOf(id, files ?? []),
      ),
    [files],
  );
  // A file being edited (a page, a post) is open under its list; the same call as wave 3's in App.tsx.
  const collection = collectionOf(collections, route)?.collection;
  const place = currentPlace(route, tree, {
    open: collection?.id,
    lists,
    header,
    partScreens: partScreens.map((s) => s.id),
    cookies: config.lists.cookies,
    store: STORE_ROUTE,
    settings,
  });
  // The section whose list is shown (null: the first level). It follows the route's section, and the drawer opening.
  // A flat section (Apps) has no list of its own: its rows stand under its label on the first level.
  const flat = groups.filter((g) => g.flat).map((g) => g.id);
  const sectionOf = place.section && !flat.includes(place.section) ? place.section : null;
  const [shown, setShown] = useState<string | null>(sectionOf);
  const [focus, setFocus] = useState<'list' | 'top' | undefined>();
  const shownRef = useRef(shown);
  shownRef.current = shown;
  // The section a click in the rail asked for: the drawer opens at its list instead of at the route's section.
  const asked = useRef<string | null>(null);
  useEffect(() => {
    setShown(asked.current ?? sectionOf);
    setFocus(asked.current ? 'list' : undefined);
    asked.current = null;
  }, [sectionOf, open]);
  const openAt = (section: string) => {
    asked.current = section;
    setOpen(true);
  };
  const show = (section: string | null) => {
    setFocus(section === null ? 'top' : 'list');
    setShown(section);
  };
  // Escape in a section's list goes to the first level; at the first level it is not used, so the modal drawer closes.
  const onEscape = useCallback(() => {
    if (shownRef.current === null) return false;
    setFocus('top');
    setShown(null);
    return true;
  }, []);
  // The modal drawer closes when the screen changes another way than by a link in it (the phone's back gesture), so the
  // screen before is not left under it.
  const modal = useMenuLayout().expanded !== 'standard';
  useEffect(() => {
    if (!modal || !open) return;
    const close = () => setOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, [modal, open, setOpen]);
  // Every level stays in the page (the screen check finds the screens from the links); the ones not shown are `hidden`.
  const sections = tree.filter((entry) => entry.href === undefined && !flat.includes(entry.id));
  return (
    <MainDrawer
      label={t.library.navigation}
      open={open}
      onOpenChange={setOpen}
      onEscape={onEscape}
      header={
        shown === null ? (
          user && <AccountRow user={user} supporting={config.domain} href="#account" />
        ) : (
          <MainDrawerBack label={t.library.back} name={t.common.backTo(t.library.mainMenu)} onClick={() => show(null)} />
        )
      }
      footer={
        shown === null ? (
          <MainDrawerItem href="#settings" icon={Gear} label={t.common.parts.settings} selected={!!place.settings} />
        ) : undefined
      }
      railFooter={<MainRailItem href="#settings" icon={Gear} label={t.common.parts.settings} selected={!!place.settings} />}
      rail={tree.flatMap((entry) =>
        flat.includes(entry.id) ? (
          entry.items
            .filter((item) => !apps.some((a) => a.id === item.id))
            .map((item) => (
              <MainRailItem
                key={item.id}
                href={item.href}
                icon={iconOf(entry.id, item.id)}
                label={item.label}
                selected={place.section === entry.id && place.item === item.id}
              />
            ))
        ) : entry.href !== undefined ? (
          <MainRailItem key={entry.id} href={entry.href} icon={icons[entry.id]} label={entry.label} selected={route === ''} />
        ) : (
          <MainRailSectionItem
            key={entry.id}
            icon={icons[entry.id]}
            label={entry.label}
            selected={place.section === entry.id}
            onClick={() => openAt(entry.id)}
          />
        ),
      )}
    >
      <MainDrawerLevel shown={shown === null} focus={focus}>
        <MainDrawerSection>
          {tree
            .filter((entry) => !flat.includes(entry.id))
            .map((entry) =>
              entry.href !== undefined ? (
                <MainDrawerItem key={entry.id} href={entry.href} icon={icons[entry.id]} label={entry.label} selected={route === ''} />
              ) : (
                <MainDrawerSectionItem
                  key={entry.id}
                  icon={icons[entry.id]}
                  label={entry.label}
                  selected={place.section === entry.id}
                  onClick={() => show(entry.id)}
                />
              ),
            )}
        </MainDrawerSection>
        {tree
          .filter((entry) => flat.includes(entry.id))
          .map((entry) => (
            <MainDrawerSection key={entry.id} label={entry.label}>
              {entry.items.map((item) => (
                <MainDrawerItem
                  key={item.id}
                  href={item.href}
                  icon={iconOf(entry.id, item.id)}
                  label={item.label}
                  selected={place.section === entry.id && place.item === item.id}
                />
              ))}
            </MainDrawerSection>
          ))}
      </MainDrawerLevel>
      {sections.map((section) => (
        <MainDrawerLevel key={section.id} shown={shown === section.id} focus={focus}>
          {section.items.map(({ id, label, href, count, children }) => {
            const here = place.section === section.id && place.item === id;
            const shownCount = files ? count : null;
            // An app's row has the app's icon (an installed app is a row of Apps, lib/menu.mjs), a part of the business its
            // own (a part is a row of Business).
            const icon = iconOf(section.id, id);
            return children ? (
              <MainDrawerFold key={id} href={href} icon={icon} label={label} count={shownCount} selected={here && !place.child} open={here}>
                {children.map((child) => (
                  <MainDrawerSubitem key={child.id} href={child.href} label={child.label} selected={here && place.child === child.id} />
                ))}
              </MainDrawerFold>
            ) : (
              <MainDrawerItem key={id} href={href} icon={icon} label={label} count={shownCount} selected={here} />
            );
          })}
        </MainDrawerLevel>
      ))}
    </MainDrawer>
  );
}
