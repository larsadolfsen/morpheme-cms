// "Parts" › "UI components" (BlockParts.tsx), the group "Actions": the theme's buttons that do more than one thing
// (packages/editor/theme/ui/, through @site/editor) as the site draws them: button groups in both kinds with toggles on
// and off, in every size and in both shapes, segmented buttons with one and with several chosen, split buttons in their
// kinds and sizes, closed and with the menu open, and FAB menus in their colour sets, from FABs of each size, closed
// and open. Only drawn: nothing opens or turns on here (that is the site's ui/*.script.ts),
// and the links lead nowhere.
import {
  SiteButton,
  SiteButtonGroup,
  SiteFabMenu,
  SiteIconButton,
  SiteMenuItem,
  SiteSegmentedButton,
  SiteSplitButton,
  buttonGroupKinds,
  buttonShapes,
  buttonSizes,
  fabMenuKinds,
  splitButtonKinds,
} from './themeUi';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { t } from './i18n';

const { sizes, shapes } = t.parts.screens;
const say = t.parts.screens.actions;
const row = 'flex flex-wrap items-center gap-4';
// Icons the site draws (icon.tsx).
const channelIcons = ['phone', 'envelope-simple', 'chats'];
const modeIcons = ['sun', 'moon'];
const wayIcons = ['phone', 'envelope-simple', 'calendar-blank'];

const ways = () =>
  say.ways.map((way) => (
    <SiteMenuItem key={way} href="">
      {way}
    </SiteMenuItem>
  ));
const fabItems = say.ways.map((way, i) => ({ icon: wayIcons[i], label: way, href: '' }));

export default function ActionParts() {
  return (
    <>
      <Part name="ButtonGroup" use={say.buttonGroup}>
        <Preview>
          <div className="space-y-4 p-4">
            {buttonGroupKinds.map((kind) => (
              <div key={kind} className={row}>
                <SiteButtonGroup kind={kind} label={say.group}>
                  {say.views.map((view, i) => (
                    <SiteButton key={view} selected={i === 1}>
                      {view}
                    </SiteButton>
                  ))}
                </SiteButtonGroup>
                <SiteButtonGroup kind={kind} label={say.channel}>
                  {say.channels.map((name, i) => (
                    <SiteIconButton key={name} kind="filled" icon={channelIcons[i]} label={name} title={name} selected={i === 0} />
                  ))}
                </SiteButtonGroup>
              </div>
            ))}
            {buttonSizes.map((size) => (
              <div key={size} className={row} role="group" aria-label={sizes[size]}>
                <SiteButtonGroup kind="connected" label={say.mode}>
                  {say.modes.map((mode, i) => (
                    <SiteIconButton key={mode} kind="tonal" size={size} icon={modeIcons[i]} label={mode} title={mode} selected={i === 0} />
                  ))}
                </SiteButtonGroup>
                <SiteButtonGroup label={say.group}>
                  {say.views.map((view, i) => (
                    <SiteButton key={view} size={size} selected={i === 1}>
                      {view}
                    </SiteButton>
                  ))}
                </SiteButtonGroup>
              </div>
            ))}
            {buttonShapes.map((shape) => (
              <div key={shape} className={row} role="group" aria-label={shapes[shape]}>
                {buttonGroupKinds.map((kind) => (
                  <SiteButtonGroup key={kind} kind={kind} label={say.group}>
                    {say.views.map((view, i) => (
                      <SiteButton key={view} kind="outlined" size="small" shape={shape} selected={i === 0}>
                        {view}
                      </SiteButton>
                    ))}
                  </SiteButtonGroup>
                ))}
                <SiteButtonGroup kind="connected" label={say.channel}>
                  {say.channels.map((name, i) => (
                    <SiteIconButton
                      key={name}
                      kind="filled"
                      shape={shape}
                      icon={channelIcons[i]}
                      label={name}
                      title={name}
                      selected={i === 2}
                    />
                  ))}
                </SiteButtonGroup>
              </div>
            ))}
            <SiteButtonGroup label={say.book}>
              <SiteButton icon="calendar-blank">{say.actions[0]}</SiteButton>
              <SiteButton kind="outlined" icon="phone">
                {say.actions[1]}
              </SiteButton>
              <SiteButton kind="text">{say.actions[2]}</SiteButton>
            </SiteButtonGroup>
          </div>
        </Preview>
      </Part>
      <Part name="SegmentedButton" use={say.segmentedButton}>
        <Preview>
          <div className="space-y-4 p-4">
            <div>
              <SiteSegmentedButton
                label={say.mode}
                segments={say.modes.map((mode, i) => ({ label: mode, icon: modeIcons[i], selected: i === 0 }))}
              />
            </div>
            <div>
              <SiteSegmentedButton
                label={say.days}
                multiple
                segments={say.weekdays.map((day, i) => ({ label: day, selected: i === 0 || i === 2 }))}
              />
            </div>
            <div>
              <SiteSegmentedButton
                label={say.channel}
                segments={say.channels.map((name, i) => ({ label: name, icon: channelIcons[i], selected: i === 2, disabled: i === 1 }))}
              />
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="SplitButton" use={say.splitButton}>
        <Preview>
          <div className="space-y-4 p-4">
            <div className={row}>
              {splitButtonKinds.map((kind) => (
                <SiteSplitButton key={kind} kind={kind} label={say.kinds[kind]} menuLabel={say.more}>
                  {ways()}
                </SiteSplitButton>
              ))}
            </div>
            <div className={row}>
              {buttonSizes.map((size) => (
                <SiteSplitButton key={size} kind="tonal" size={size} label={sizes[size]} menuLabel={say.more}>
                  {ways()}
                </SiteSplitButton>
              ))}
            </div>
            <div className={row}>
              <SiteSplitButton disabled label={say.disabled} menuLabel={say.more}>
                {ways()}
              </SiteSplitButton>
            </div>
            <div className="flex justify-end pb-44">
              <SiteSplitButton icon="calendar-blank" label={say.book} menuLabel={say.more} open>
                {ways()}
              </SiteSplitButton>
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="FabMenu" use={say.fabMenu}>
        <Preview>
          <div className="space-y-6 p-4">
            <div className={`${row} justify-end`}>
              {fabMenuKinds.map((kind) => (
                <SiteFabMenu
                  key={kind}
                  kind={kind}
                  icon="chats"
                  label={say.contact}
                  closeLabel={say.close}
                  items={fabItems}
                  title={say.fabKinds[kind]}
                />
              ))}
              <SiteFabMenu fabKind="primary-container" icon="chats" label={say.contact} closeLabel={say.close} items={fabItems} />
              {(['medium', 'large'] as const).map((size) => (
                <SiteFabMenu key={size} size={size} icon="chats" label={say.contact} closeLabel={say.close} items={fabItems} />
              ))}
            </div>
            <div className="grid gap-6 medium:grid-cols-2">
              {fabMenuKinds.map((kind) => (
                <div key={kind} className="flex justify-end pt-52">
                  <SiteFabMenu kind={kind} icon="chats" label={say.contact} closeLabel={say.close} items={fabItems} open />
                </div>
              ))}
              <div className="flex justify-end pt-52">
                <SiteFabMenu size="large" icon="chats" label={say.contact} closeLabel={say.close} items={fabItems} open />
              </div>
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
