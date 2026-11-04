// "Dele" › "UI-komponenter" (BlockParts.tsx), the group "Navigation": the theme's parts of the header (packages/editor/theme/ui/,
// through @site/editor) as the site draws them, with made-up pages: the top app bar as the site's header has it (at the
// top and once the page scrolls under it) and in its kinds (search, small, medium and large flexible, at the start and
// in the middle, with a subtitle, a long headline and collapsed), a menu (the header's pages, and actions in both
// colours with their icons, shortcuts, texts, ticks, a choice, a disabled one, dividers, groups with a gap and with a
// line, and a submenu drawn open), a dropdown menu closed and drawn open, the exposed dropdown menu in both kinds in
// every state, the navigation drawer with an item's sub-pages unfolded, and the standard one with sections, icons and counts,
// in two levels (items with a trailing arrow, and the back row over a list), the tabs (only the text, as the bar of
// "Mobilmenu", and primary and secondary, fixed and scrollable, with icons over and beside their labels, badges, and a
// tab list with a tab that cannot be chosen), and the FABs and extended FABs in their colours and sizes, an extended
// FAB also collapsed. Only drawn: the links lead nowhere, and nothing opens.
import { Fragment } from 'react';
import {
  SiteButton,
  SiteExtendedFab,
  SiteFab,
  SiteDropdownMenu,
  SiteExposedDropdownMenu,
  SiteIconButton,
  SiteMenu,
  SiteMenuDivider,
  SiteMenuGroup,
  SiteMenuItem,
  SiteNavigationDrawer,
  SiteNavigationDrawerBack,
  SiteNavigationDrawerItem,
  SiteNavigationDrawerRow,
  SiteNavigationDrawerSection,
  SiteNavigationDrawerSubitem,
  SiteNavigationDrawerToggle,
  SiteSearch,
  SiteTab,
  SiteTabs,
  SiteTopAppBar,
  extendedFabSizes,
  fabKinds,
  fabSizes,
} from './themeUi';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { t } from './i18n';

const say = t.parts.screens.navigation;
const [home, open, parent, contact] = say.pages;
const [sub, openSub] = say.subpages;
const [mail, account] = say.drawerSections;
const [backLabel] = say.drawerBack;
const [inbox, messages, favourites, trash, profile] = say.drawerItems;
const row = 'flex flex-wrap items-center gap-4';
const kinds = ['primary', 'secondary'] as const;
const bar = say.appBar;
const flexible = ['medium-flexible', 'large-flexible'] as const;
// Icons the site draws (icon.tsx).
const viewIcons = ['house', 'ticket', 'chats', 'phone', 'map-pin', 'video-camera'];

const back = <SiteIconButton icon="arrow-left" label={bar.back} />;
const actions = (
  <>
    <SiteIconButton icon="heart" label={bar.favourite} />
    <SiteIconButton icon="user" label={bar.profile} />
  </>
);
const search = (trailing?: boolean) => (
  <SiteSearch
    label={bar.search}
    backLabel={bar.back}
    clearLabel={bar.clear}
    emptyText={bar.empty}
    results={[]}
    trailing={trailing ? <SiteIconButton icon="user" label={bar.profile} /> : undefined}
  />
);

const menus = say.menus;
const colors = ['standard', 'vibrant'] as const;
const actionIcons = ['pencil-simple', 'copy', 'download-simple', 'arrow-right', 'trash'];

/** A menu's actions: an icon and a shortcut, a text under one, a disabled one, a divider, ticks and a choice. */
function menuActions() {
  const [edit, copy, download, move, remove] = menus.actions;
  return (
    <>
      <SiteMenuItem icon={actionIcons[0]} trailingSupporting={menus.shortcuts[0]}>
        {edit}
      </SiteMenuItem>
      <SiteMenuItem icon={actionIcons[1]} trailingSupporting={menus.shortcuts[1]}>
        {copy}
      </SiteMenuItem>
      <SiteMenuItem icon={actionIcons[2]} supporting={menus.download}>
        {download}
      </SiteMenuItem>
      <SiteMenuItem icon={actionIcons[3]} disabled>
        {move}
      </SiteMenuItem>
      <SiteMenuDivider />
      <SiteMenuItem checked>{menus.checks[0]}</SiteMenuItem>
      <SiteMenuItem checked={false}>{menus.checks[1]}</SiteMenuItem>
      <SiteMenuDivider />
      <SiteMenuItem icon={actionIcons[4]}>{remove}</SiteMenuItem>
    </>
  );
}

/** A menu in groups: what to show (ticks), how to sort (a choice), and an action with a submenu. */
function groups(open?: boolean) {
  return (
    <>
      <SiteMenuGroup label={menus.view}>
        <SiteMenuItem checked>{menus.checks[0]}</SiteMenuItem>
        <SiteMenuItem checked={false}>{menus.checks[1]}</SiteMenuItem>
      </SiteMenuGroup>
      <SiteMenuGroup label={menus.sort}>
        <SiteMenuItem selected>{menus.sorts[0]}</SiteMenuItem>
        <SiteMenuItem selected={false}>{menus.sorts[1]}</SiteMenuItem>
      </SiteMenuGroup>
      <SiteMenuGroup>
        <SiteMenuItem
          icon="envelope-simple"
          open={open}
          submenu={menus.shares.map((name, i) => (
            <SiteMenuItem key={name} icon={['envelope-simple', 'phone', 'copy'][i]}>
              {name}
            </SiteMenuItem>
          ))}
        >
          {menus.share}
        </SiteMenuItem>
      </SiteMenuGroup>
    </>
  );
}

export default function NavigationParts() {
  return (
    <>
      <Part name="TopAppBar" use={say.topAppBar}>
        <Preview>
          <div className="space-y-4">
            {[false, true].map((stuck) => (
              <SiteTopAppBar key={String(stuck)} data-stuck={stuck || undefined} className="flex h-16 items-center gap-4 px-4">
                <span className="mr-auto font-medium">{stuck ? say.stuck : say.name}</span>
                <SiteIconButton icon="list" label={say.open} />
              </SiteTopAppBar>
            ))}
            <SiteTopAppBar
              kind="search"
              leading={<SiteIconButton icon="list" label={say.open} />}
              search={search(true)}
              trailing={<SiteIconButton icon="heart" label={bar.favourite} />}
            />
            <SiteTopAppBar kind="search" align="center" search={search()} />
            <SiteTopAppBar kind="small" leading={back} headline={bar.kinds.small} trailing={actions} />
            <SiteTopAppBar kind="small" leading={back} headline={bar.kinds.small} subtitle={bar.subtitle} trailing={actions} />
            <SiteTopAppBar
              kind="small"
              align="center"
              leading={back}
              headline={`${bar.kinds.small}, ${bar.center}`}
              subtitle={bar.subtitle}
              trailing={<SiteIconButton icon="user" label={bar.profile} />}
            />
            {flexible.map((kind) => (
              <Fragment key={kind}>
                <SiteTopAppBar kind={kind} leading={back} headline={bar.kinds[kind]} subtitle={bar.subtitle} trailing={actions} />
                <SiteTopAppBar
                  kind={kind}
                  align="center"
                  leading={back}
                  headline={bar.long}
                  subtitle={bar.subtitle}
                  trailing={
                    <SiteButton size="small" icon="calendar-blank">
                      {say.book}
                    </SiteButton>
                  }
                />
                <SiteTopAppBar
                  kind={kind}
                  collapsed
                  leading={back}
                  headline={`${bar.kinds[kind]}, ${bar.collapsed}`}
                  subtitle={bar.subtitle}
                  trailing={actions}
                />
              </Fragment>
            ))}
          </div>
        </Preview>
      </Part>
      <Part name="Menu" use={say.menu}>
        <Preview>
          <div className="flex flex-wrap items-start gap-6 p-4">
            <SiteMenu>
              <SiteMenuItem href="">{home}</SiteMenuItem>
              <SiteMenuItem href="" selected>
                {open}
              </SiteMenuItem>
              <SiteMenuItem href="">{contact}</SiteMenuItem>
            </SiteMenu>
            {colors.map((color) => (
              <SiteMenu key={color} color={color} aria-label={menus[color]}>
                {menuActions()}
              </SiteMenu>
            ))}
            {colors.map((color) => (
              <SiteMenu key={color} color={color} aria-label={`${menus.gap} · ${menus[color]}`}>
                {groups()}
              </SiteMenu>
            ))}
            <SiteMenu groups="divider" aria-label={menus.divider}>
              {groups()}
            </SiteMenu>
            <div className="pb-24 medium:pr-72">
              <SiteMenu aria-label={menus.share}>{groups(true)}</SiteMenu>
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="DropdownMenu" use={say.dropdownMenu}>
        <Preview>
          <div className="flex flex-wrap items-start gap-6 p-4 pb-[26rem]">
            <SiteDropdownMenu label={menus.more}>{menuActions()}</SiteDropdownMenu>
            <SiteDropdownMenu label={menus.more} iconButton icon="list">
              {groups()}
            </SiteDropdownMenu>
            {colors.map((color) => (
              <SiteDropdownMenu key={color} label={menus.more} kind={color === 'vibrant' ? 'filled' : 'outlined'} color={color} open>
                {menuActions()}
              </SiteDropdownMenu>
            ))}
          </div>
        </Preview>
      </Part>
      <Part name="ExposedDropdownMenu" use={say.exposedDropdownMenu}>
        <Preview>
          <div className="space-y-6 p-4">
            {(['outlined', 'filled'] as const).map((kind) => {
              const options = menus.options.map((label, i) => ({ value: String(i), label, disabled: i === 3 }));
              return (
                <div key={kind} className="grid gap-6 medium:grid-cols-2" aria-label={menus.kinds[kind]} role="group">
                  <SiteExposedDropdownMenu kind={kind} label={menus.field} options={options} />
                  <SiteExposedDropdownMenu kind={kind} label={menus.field} options={options} value="1" />
                  <SiteExposedDropdownMenu kind={kind} label={menus.field} options={options} value="0" supporting={menus.supporting} />
                  <SiteExposedDropdownMenu kind={kind} label={menus.field} options={options} error={menus.error} />
                  <SiteExposedDropdownMenu kind={kind} label={menus.field} options={options} value="2" disabled />
                </div>
              );
            })}
          </div>
        </Preview>
      </Part>
      <Part name="NavigationDrawer" use={say.navigationDrawer}>
        <Preview>
          <div className="flex flex-wrap items-start gap-6">
            <SiteNavigationDrawer>
              <SiteNavigationDrawerRow>
                <SiteNavigationDrawerItem href="">{home}</SiteNavigationDrawerItem>
              </SiteNavigationDrawerRow>
              <SiteNavigationDrawerRow data-active="">
                <SiteNavigationDrawerItem href="" active>
                  {parent}
                </SiteNavigationDrawerItem>
                <SiteNavigationDrawerToggle label={parent} expanded />
              </SiteNavigationDrawerRow>
              <SiteNavigationDrawerSubitem href="">{sub}</SiteNavigationDrawerSubitem>
              <SiteNavigationDrawerSubitem href="" active>
                {openSub}
              </SiteNavigationDrawerSubitem>
              <SiteNavigationDrawerRow>
                <SiteNavigationDrawerItem href="">{contact}</SiteNavigationDrawerItem>
                <SiteNavigationDrawerToggle label={contact} expanded={false} />
              </SiteNavigationDrawerRow>
            </SiteNavigationDrawer>
            <SiteNavigationDrawer variant="standard">
              <SiteNavigationDrawerSection label={mail}>
                <SiteNavigationDrawerItem href="" icon="envelope-simple" badge={24} active>
                  {inbox}
                </SiteNavigationDrawerItem>
                <SiteNavigationDrawerItem href="" icon="chats" badge={3}>
                  {messages}
                </SiteNavigationDrawerItem>
                <SiteNavigationDrawerItem href="" icon="heart">
                  {favourites}
                </SiteNavigationDrawerItem>
                <SiteNavigationDrawerItem href="" icon="trash">
                  {trash}
                </SiteNavigationDrawerItem>
              </SiteNavigationDrawerSection>
              <SiteNavigationDrawerSection label={account}>
                <SiteNavigationDrawerItem href="" icon="user">
                  {profile}
                </SiteNavigationDrawerItem>
              </SiteNavigationDrawerSection>
            </SiteNavigationDrawer>
            <SiteNavigationDrawer variant="standard">
              <SiteNavigationDrawerItem icon="envelope-simple" trailing="arrow-right" active>
                {mail}
              </SiteNavigationDrawerItem>
              <SiteNavigationDrawerItem icon="user" trailing="arrow-right">
                {account}
              </SiteNavigationDrawerItem>
            </SiteNavigationDrawer>
            <SiteNavigationDrawer variant="standard">
              <SiteNavigationDrawerBack label={backLabel} />
              <SiteNavigationDrawerItem href="" icon="envelope-simple" badge={24} active>
                {inbox}
              </SiteNavigationDrawerItem>
              <SiteNavigationDrawerItem href="" icon="chats">
                {messages}
              </SiteNavigationDrawerItem>
            </SiteNavigationDrawer>
          </div>
        </Preview>
      </Part>
      <Part name="Tabs" use={say.tabs}>
        <Preview>
          <div className="space-y-6">
            <SiteTabs>
              <SiteTab href="">{home}</SiteTab>
              <SiteTab href="" selected>
                {open}
              </SiteTab>
              <SiteTab href="">{contact}</SiteTab>
            </SiteTabs>
            <SiteTabs kind="primary" scrollable={false}>
              {say.views.slice(0, 3).map((view, i) => (
                <SiteTab key={view} href="" icon={viewIcons[i]} selected={i === 0} badge={i === 2 ? 3 : undefined}>
                  {view}
                </SiteTab>
              ))}
            </SiteTabs>
            <SiteTabs kind="primary" inline>
              {say.views.map((view, i) => (
                <SiteTab key={view} href="" icon={viewIcons[i]} selected={i === 1} badge={i === 2 ? true : undefined}>
                  {view}
                </SiteTab>
              ))}
            </SiteTabs>
            <SiteTabs kind="primary">
              {say.views.map((view, i) => (
                <SiteTab key={view} href="" selected={i === 2}>
                  {view}
                </SiteTab>
              ))}
            </SiteTabs>
            <SiteTabs kind="secondary" scrollable={false}>
              {say.views.slice(0, 3).map((view, i) => (
                <SiteTab key={view} href="" selected={i === 0} badge={i === 2 ? 12 : undefined}>
                  {view}
                </SiteTab>
              ))}
            </SiteTabs>
            <SiteTabs kind="secondary" label={say.viewList}>
              {say.views.map((view, i) => (
                <SiteTab key={view} icon={viewIcons[i]} selected={i === 1} disabled={i === say.views.length - 1}>
                  {view}
                </SiteTab>
              ))}
            </SiteTabs>
          </div>
        </Preview>
      </Part>
      <Part name="Fab" use={say.fab}>
        <Preview>
          <div className="space-y-6 p-4">
            <div className={row}>
              {fabKinds.map((k) => (
                <SiteFab key={k} kind={k} icon="calendar-blank" label={say.kinds[k]} title={say.kinds[k]} />
              ))}
            </div>
            <div className={row}>
              {fabSizes.map((size) => (
                <SiteFab key={size} size={size} icon="calendar-blank" label={say.sizes[size]} title={say.sizes[size]} />
              ))}
            </div>
            <div className={row}>
              {fabKinds.map((k) => (
                <SiteExtendedFab key={k} kind={k} icon="calendar-blank" label={say.kinds[k]} />
              ))}
            </div>
            <div className={row}>
              {extendedFabSizes.map((size) => (
                <SiteExtendedFab key={size} size={size} icon="calendar-blank" label={say.book} title={say.extendedSizes[size]} />
              ))}
            </div>
            <div className={row}>
              {extendedFabSizes.map((size) => (
                <SiteExtendedFab key={size} size={size} icon="calendar-blank" label={say.book} title={say.extendedSizes[size]} collapsed />
              ))}
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
