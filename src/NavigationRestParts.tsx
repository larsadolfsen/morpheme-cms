// "Dele" › "Tema" (BlockParts.tsx), the group "Bjælker og søgning": the rest of the theme's navigation parts
// (packages/editor/theme/ui/, through @site/editor) as the site draws them, with made-up destinations: the navigation bar
// with the open one and its badges, with vertical items, horizontal ones and both by its width, the navigation rail
// collapsed and expanded with its menu button and FAB, in sections with a count at each destination's end (the
// editor's sidebar), expanded over the content (modal, over its scrim), and one that
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
  SiteToolbar,
  SiteButton,
} from '@site/editor';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { t } from './i18n';

const say = t.parts.screens.navigationRest;
const icons = ['house', 'magnifying-glass', 'chats', 'user'];
const actions = ['pencil-simple', 'heart', 'copy', 'trash'];
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

export default function NavigationRestParts() {
  return (
    <>
      <Part name="NavigationBar" use={say.navigationBar}>
        <Preview>
          <div className="space-y-4">
            <div className="mx-auto max-w-sm">
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
      <Part name="NavigationRail" use={say.navigationRail}>
        <Preview>
          <div className="space-y-4">
            <div className="flex flex-wrap items-start gap-4">
              {[false, true].map((expanded) => (
                <SiteNavigationRail
                  key={String(expanded)}
                  label={say.name}
                  menuLabel={say.menu}
                  expanded={expanded}
                  fab={{ icon: 'pencil-simple', label: say.compose }}
                >
                  <Destinations rail />
                </SiteNavigationRail>
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-4">
              {[false, true].map((expanded) => (
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
              ))}
            </div>
            {/* Over the content: its scrim (fixed on the site) held in this box. */}
            <div className="flex transform-gpu overflow-hidden">
              <SiteNavigationRail
                label={say.name}
                menuLabel={say.menu}
                expanded
                modality="modal"
                fab={{ icon: 'pencil-simple', label: say.compose }}
              >
                <Destinations rail />
              </SiteNavigationRail>
              <p className="p-4 text-sm text-muted">{say.content}</p>
            </div>
            <div className="space-y-4">
              <div className="flex">
                <SiteNavigationRail id="parts-navigation-rail-hidden" label={say.name} menuLabel={say.menu} expandedBehavior="hide">
                  <Destinations rail />
                </SiteNavigationRail>
                <div className="flex items-start gap-2 p-2">
                  <SiteIconButton
                    icon="list"
                    label={say.openRail}
                    aria-controls="parts-navigation-rail-hidden"
                    aria-expanded="false"
                    data-navigation-rail-menu=""
                  />
                  <p className="py-3 text-sm text-muted">{say.content}</p>
                </div>
              </div>
              <div className="flex">
                <SiteNavigationRail label={say.name} menuLabel={say.menu} expanded expandedBehavior="hide">
                  <Destinations rail />
                </SiteNavigationRail>
                <p className="p-4 text-sm text-muted">{say.content}</p>
              </div>
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="Search" use={say.search}>
        <Preview>
          <div className="mx-auto max-w-md space-y-4 p-2">
            <SiteSearch
              label={say.searchLabel}
              backLabel={say.back}
              clearLabel={say.clear}
              emptyText={say.empty}
              results={[]}
              trailing={<SiteIconButton icon="user" label={say.destinations[3]} />}
            />
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
                icon: i ? 'book-open' : 'clock',
              }))}
            />
          </div>
        </Preview>
      </Part>
      <Part name="Toolbar" use={say.toolbar}>
        <Preview>
          <div className="space-y-4">
            <div className="mx-auto max-w-sm space-y-4">
              {colors.map((color) => (
                <SiteToolbar key={color} label={say.colors[color]} color={color}>
                  {actions.map((icon, i) => (
                    <SiteIconButton key={icon} icon={icon} label={say.actions[i]} />
                  ))}
                </SiteToolbar>
              ))}
              <SiteToolbar label={say.bar}>
                <SiteButton href="" icon="calendar-blank">
                  {say.book}
                </SiteButton>
                <SiteButton href="" kind="outlined" icon="phone">
                  {say.call}
                </SiteButton>
              </SiteToolbar>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 p-2">
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
            <div className="flex flex-wrap items-end justify-center gap-6 p-2">
              {colors.map((color) => (
                <SiteToolbar
                  key={color}
                  label={`${say.withFab}: ${say.colors[color]}`}
                  kind="floating"
                  color={color}
                  fab={<SiteFab icon="pencil-simple" label={say.compose} kind={color === 'vibrant' ? 'primary' : 'secondary'} />}
                >
                  {actions.slice(1).map((icon, i) => (
                    <SiteIconButton key={icon} icon={icon} label={say.actions[i + 1]} />
                  ))}
                </SiteToolbar>
              ))}
              <SiteToolbar
                label={`${say.withFab}: ${say.vertical}`}
                kind="floating"
                vertical
                fab={<SiteFab icon="pencil-simple" label={say.compose} kind="secondary" />}
              >
                {actions.slice(1).map((icon, i) => (
                  <SiteIconButton key={icon} icon={icon} label={say.actions[i + 1]} />
                ))}
              </SiteToolbar>
              <SiteToolbar
                label={say.collapsed}
                kind="floating"
                expanded={false}
                fab={<SiteFab icon="pencil-simple" label={say.compose} />}
              >
                {actions.slice(1).map((icon, i) => (
                  <SiteIconButton key={icon} icon={icon} label={say.actions[i + 1]} />
                ))}
              </SiteToolbar>
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
