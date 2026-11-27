// "Parts" › "UI components" (BlockParts.tsx), the group "Bars and search": the rest of the theme's navigation parts
// (packages/editor/theme/ui/, through @site/editor) as the site draws them, with made-up destinations: the navigation bar
// with the open one and its badges, with vertical items, horizontal ones and both by its width, the navigation rail
// collapsed and expanded with its menu button and FAB, in sections with a count at each destination's end (the
// theme's rail, which sites use), expanded over the content (modal, over its scrim), and one that
// hides while it is collapsed, collapsed (opened by a button beside it) and expanded, the search bar and the view it
// opens, and the toolbars, docked and floating in both colours, across and vertical (the docked one with buttons as the
// site's bar at the bottom of a phone; floating ones also with a FAB, and folded into it). Only drawn: the links lead
// nowhere, and nothing opens.
import {
  SiteFab,
  SiteIconButton,
  SiteNavigationBar,
  SiteNavigationBarItem,
  SiteNavigationRail,
  SiteNavigationRailItem,
  SiteNavigationRailSection,
  SiteSearch,
  SiteSearchView,
  SiteToolbar,
  SiteButton,
} from './themeUi';
import { useState } from 'react';
import { Example, Part } from './PartsShown';
import { Button, Preview, SearchBarButton, SupportingText } from './ui';
import { t } from './i18n';

const say = t.parts.screens.navigationRest;
const eg = t.parts.screens.example;
const icons = ['house', 'search', 'forum', 'person'];
const actions = ['edit', 'favorite', 'content_copy', 'delete'];
const colors = ['standard', 'vibrant'] as const;

function Destinations({ rail }: { rail?: boolean }) {
  const Item = rail ? SiteNavigationRailItem : SiteNavigationBarItem;
  return (
    <>
      {say.destinations.map((label, i) => (
        <Item key={label} href="" icon={icons[i]} label={label} selected={i === 0} badge={i === 2 ? 3 : i === 3 ? true : undefined} />
      ))}
    </>
  );
}

/** The search view driven by the page (SearchView): grouped results with a key and a disabled item, the arrow keys on one of them, a count read aloud. */
function SearchViewExample({ kind }: { kind?: 'divided' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | undefined>('0');
  /** The groups for a query: what has it in its name, each group under its label; a group with nothing in it is left out by the view. */
  const groupsFor = (text: string) => {
    const q = text.trim().toLocaleLowerCase();
    return say.viewGroups.map((label, g) => ({
      id: String(g),
      label,
      items: say.viewItems
        .map((item, i) => ({ ...item, id: String(i), group: i < 2 ? 0 : 1 }))
        .filter((item) => item.group === g && (!q || item.headline.toLocaleLowerCase().includes(q))),
    }));
  };
  const groups = groupsFor(query);
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  // The first option is the one the arrow keys are on, after each change of what is written.
  const change = (value: string) => {
    setQuery(value);
    setActive(groupsFor(value).flatMap((g) => g.items)[0]?.id);
  };
  return (
    <>
      <Button onClick={() => (change(''), setOpen(true))}>{kind ? say.viewOpenDivided : say.viewOpen}</Button>
      <SiteSearchView
        kind={kind}
        open={open}
        onClose={() => setOpen(false)}
        label={say.searchLabel}
        backLabel={say.back}
        clearLabel={say.clear}
        emptyText={say.empty}
        liveText={count ? say.viewCount(count) : say.empty}
        query={query}
        onQueryChange={change}
        groups={groups}
        activeId={active}
        onActiveChange={setActive}
        onActivate={() => setOpen(false)}
      />
    </>
  );
}

export default function NavigationRestParts() {
  return (
    <>
      <Part name="NavigationBar" m3="md.comp.navigation-bar" use={say.navigationBar}>
        <Preview>
          <div className="mo-editor-nav-demo">
            <div className="mo-editor-nav-demo-narrow">
              <SiteNavigationBar label={say.name}>
                <Destinations />
              </SiteNavigationBar>
            </div>
            <SiteNavigationBar label={say.name} iconPosition="start">
              <Destinations />
            </SiteNavigationBar>
            <SiteNavigationBar label={say.name} iconPosition="auto">
              <Destinations />
            </SiteNavigationBar>
          </div>
        </Preview>
      </Part>
      <Part name="NavigationRail" m3="md.comp.navigation-rail" use={say.navigationRail}>
        <Preview>
          <div className="mo-editor-nav-demo">
            <div className="mo-editor-nav-demo-row">
              {[false, true].map((expanded) => (
                <Example label={eg(1)} flat>
                  <SiteNavigationRail
                    key={String(expanded)}
                    label={say.name}
                    menuLabel={say.menu}
                    expanded={expanded}
                    fab={{ icon: 'edit', label: say.compose }}
                  >
                    <Destinations rail />
                  </SiteNavigationRail>
                </Example>
              ))}
            </div>
            <div className="mo-editor-nav-demo-row">
              {[false, true].map((expanded) => (
                <Example label={eg(2)} flat>
                  <SiteNavigationRail key={String(expanded)} label={say.name} menuLabel={say.menu} expanded={expanded}>
                    {say.sections.map((section, s) => (
                      <SiteNavigationRailSection key={section} label={section}>
                        {say.destinations.slice(s * 2, s * 2 + 2).map((label, i) => (
                          <SiteNavigationRailItem
                            key={label}
                            href=""
                            icon={icons[s * 2 + i]}
                            label={label}
                            selected={s + i === 0}
                            trailingSupporting={(s * 2 + i + 1) * 4}
                          />
                        ))}
                      </SiteNavigationRailSection>
                    ))}
                  </SiteNavigationRail>
                </Example>
              ))}
            </div>
            {/* Over the content: its scrim (fixed on the site) held in this box. */}
            <div className="mo-editor-nav-rail-frame">
              <Example label={eg(3)} flat>
                <SiteNavigationRail
                  label={say.name}
                  menuLabel={say.menu}
                  expanded
                  modality="modal"
                  fab={{ icon: 'edit', label: say.compose }}
                >
                  <Destinations rail />
                </SiteNavigationRail>
              </Example>
              <SupportingText medium className="mo-editor-nav-note">
                {say.content}
              </SupportingText>
            </div>
            <div className="mo-editor-nav-demo">
              <div className="mo-editor-nav-rail-row">
                <Example label={eg(4)} flat>
                  <SiteNavigationRail id="parts-navigation-rail-hidden" label={say.name} menuLabel={say.menu} expandedBehavior="hide">
                    <Destinations rail />
                  </SiteNavigationRail>
                </Example>
                <div className="mo-editor-nav-rail-actions">
                  <SiteIconButton
                    icon="menu"
                    label={say.openRail}
                    aria-controls="parts-navigation-rail-hidden"
                    aria-expanded="false"
                    data-navigation-rail-menu=""
                  />
                  <SupportingText medium className="mo-editor-nav-note">
                    {say.content}
                  </SupportingText>
                </div>
              </div>
              <div className="mo-editor-nav-rail-row">
                <Example label={eg(5)} flat>
                  <SiteNavigationRail label={say.name} menuLabel={say.menu} expanded expandedBehavior="hide">
                    <Destinations rail />
                  </SiteNavigationRail>
                </Example>
                <SupportingText medium className="mo-editor-nav-note">
                  {say.content}
                </SupportingText>
              </div>
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="Search" m3="md.comp.search" use={say.search}>
        <Preview>
          <div className="mo-editor-nav-search-demo">
            <Example label={eg(1)}>
              <SiteSearch
                label={say.searchLabel}
                backLabel={say.back}
                clearLabel={say.clear}
                emptyText={say.empty}
                results={[]}
                trailing={<SiteIconButton icon="person" label={say.destinations[3]} />}
              />
            </Example>
            <Example label={eg(2)}>
              <SiteSearch
                label={say.searchLabel}
                backLabel={say.back}
                clearLabel={say.clear}
                emptyText={say.empty}
                open
                query={say.query}
                results={say.results.map((r, i) => ({
                  href: '',
                  headline: r.headline,
                  supporting: r.supporting,
                  icon: i ? 'menu_book' : 'schedule',
                }))}
              />
            </Example>
            <SearchViewExample />
            <Example label={say.divided}>
              <SiteSearch
                kind="divided"
                label={say.searchLabel}
                backLabel={say.back}
                clearLabel={say.clear}
                emptyText={say.empty}
                open
                query={say.query}
                results={say.results.map((r, i) => ({
                  href: '',
                  headline: r.headline,
                  supporting: r.supporting,
                  icon: i ? 'menu_book' : 'schedule',
                }))}
              />
            </Example>
            <SearchViewExample kind="divided" />
            <SearchBarButton label={say.searchLabel} open={false} keys="Control+K" onOpen={() => {}} />
          </div>
        </Preview>
      </Part>
      <Part name="Toolbar" m3="md.comp.toolbar" use={say.toolbar}>
        <Preview>
          <div className="mo-editor-nav-demo">
            <div className="mo-editor-nav-colors">
              {colors.map((color) => (
                <SiteToolbar key={color} label={say.colors[color]} color={color}>
                  {actions.map((icon, i) => (
                    <SiteIconButton key={icon} icon={icon} label={say.actions[i]} />
                  ))}
                </SiteToolbar>
              ))}
              <SiteToolbar label={say.withPrimary} primary={<SiteIconButton icon="add" label={say.compose} kind="filled" shape="square" />}>
                {actions.slice(0, 4).map((icon, i) => (
                  <SiteIconButton key={icon} icon={icon} label={say.actions[i]} />
                ))}
              </SiteToolbar>
              <SiteToolbar label={say.bar}>
                <SiteButton href="" icon="calendar_today">
                  {say.book}
                </SiteButton>
                <SiteButton href="" kind="outlined" icon="call">
                  {say.call}
                </SiteButton>
              </SiteToolbar>
            </div>
            <div className="mo-editor-nav-color-row">
              {colors.map((color) => (
                <SiteToolbar key={color} label={say.colors[color]} kind="floating" color={color}>
                  {actions.map((icon, i) => (
                    <SiteIconButton
                      key={icon}
                      icon={icon}
                      label={say.actions[i]}
                      kind={i === 0 ? 'filled' : undefined}
                      aria-pressed={i === 0}
                    />
                  ))}
                </SiteToolbar>
              ))}
              {colors.map((color) => (
                <SiteToolbar key={color} label={`${say.vertical}: ${say.colors[color]}`} kind="floating" color={color} vertical>
                  {actions.slice(0, 3).map((icon, i) => (
                    <SiteIconButton key={icon} icon={icon} label={say.actions[i]} />
                  ))}
                </SiteToolbar>
              ))}
            </div>
            <div className="mo-editor-nav-color-row-wide">
              {colors.map((color) => (
                <Example key={color} label={`${say.withFab}: ${say.colors[color]}`} flat>
                  <SiteToolbar
                    label={`${say.withFab}: ${say.colors[color]}`}
                    kind="floating"
                    color={color}
                    fab={<SiteFab icon="edit" label={say.compose} kind={color === 'vibrant' ? 'primary' : 'secondary'} />}
                  >
                    {actions.slice(1).map((icon, i) => (
                      <SiteIconButton key={icon} icon={icon} label={say.actions[i + 1]} />
                    ))}
                  </SiteToolbar>
                </Example>
              ))}
              <Example label={`${say.withFab}: ${say.vertical}`} flat>
                <SiteToolbar
                  label={`${say.withFab}: ${say.vertical}`}
                  kind="floating"
                  vertical
                  fab={<SiteFab icon="edit" label={say.compose} kind="secondary" />}
                >
                  {actions.slice(1).map((icon, i) => (
                    <SiteIconButton key={icon} icon={icon} label={say.actions[i + 1]} />
                  ))}
                </SiteToolbar>
              </Example>
              <Example label={say.collapsed} flat>
                <SiteToolbar label={say.collapsed} kind="floating" expanded={false} fab={<SiteFab icon="edit" label={say.compose} />}>
                  {actions.slice(1).map((icon, i) => (
                    <SiteIconButton key={icon} icon={icon} label={say.actions[i + 1]} />
                  ))}
                </SiteToolbar>
              </Example>
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
