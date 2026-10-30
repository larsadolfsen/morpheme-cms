// "Dele" › "Tema" (#udseende/dele/tema) and "Dele" › "Apps" (#udseende/dele/apps): the blocks as the theme shows them, every
// one in every version, to see and agree on how the site looks. Under "Tema" first the theme's UI components (its
// buttons and icon buttons, text fields and checkboxes, packages/editor/theme/ui/, through @site/editor) in every kind,
// size and state, then the standard blocks, which every theme styles (packages/editor/src/standard/), each in its own
// group; under "Apps" what each app adds, its blocks and the kinds of entries it draws (a pop-up, once for each of its states), the app a group. A block's versions are the
// options of its choices side by side (a field with `segments`: the designs of "Kort"), the first choice's all, each
// other's but the one a new block has (its default, else the empty one: the backgrounds of "Kort", with the first's empty
// option; the width of "Banner", as wide as the text). All of it is drawn with the
// made-up site of examples.ts, never the site's own, with the search, the order and the filter of "Editor"
// (PartsShown.tsx). Nothing here is saved.
import { useMemo } from 'react';
import Screen from './Screen';
import { Part, PartGroup, PartsShown } from './PartsShown';
import { EmptyNote, Preview } from './ui';
import {
  SiteButton,
  SiteCard,
  SiteCheckbox,
  SiteChip,
  SiteIconButton,
  SiteList,
  SiteListItem,
  SiteTextField,
  buttonShapes,
  buttonSizes,
  cardKinds,
  chipKinds,
  iconButtonWidths,
} from '@site/editor';
import ContainmentParts from './ContainmentParts';
import NavigationParts from './NavigationParts';
import ActionParts from './ActionParts';
import SelectionParts from './SelectionParts';
import CommunicationParts from './CommunicationParts';
import NavigationRestParts from './NavigationRestParts';
import PickerParts from './PickerParts';
import { exampleOf, type BlockData, type BlockProps, type SiteBlock } from './blocks';
import { apps, preview, siteBlocks, standardTypes } from './registry';
import { examplePicture, exampleData } from './examples';
import type { Field, FolderCollection, PreviewVariant } from './schema';
import { buttonKinds, iconButtonKinds } from './standard/view';
import { kindDraw } from './apps';
import { collections } from './site';
import { t } from './i18n';
import { Svg } from './icon';

const { screens } = t.parts;
const back = { href: '#udseende/dele', label: t.common.parts.editorParts };

// The fields filled in with the plain picture where they have none (a card's, a list's items').
function pictured(fields: Field[], props: BlockProps): BlockProps {
  const filled = { ...props };
  for (const f of fields) {
    const v = filled[f.name];
    if (f.type === 'image' && !v) filled[f.name] = examplePicture;
    else if (f.type === 'object' && f.fields) filled[f.name] = pictured(f.fields, (v ?? {}) as BlockProps);
    else if (f.type === 'list' && f.fields && Array.isArray(v)) filled[f.name] = v.map((item) => pictured(f.fields!, item as BlockProps));
  }
  return filled;
}

// A block's versions: one for each option of its first choice side by side and for each other option of the others
// than the one a new block has, else only itself.
function versionsOf(block: SiteBlock): PreviewVariant[] {
  const [first, ...rest] = block.fields.filter((f) => f.type === 'select' && f.segments && !f.only);
  if (!first?.options) return [{ label: '', props: {} }];
  return [
    ...first.options.map((o) => ({ label: o.label, props: { [first.name]: o.value } })),
    ...rest.flatMap((c) =>
      (c.options ?? []).filter((o) => o.value !== String(c.default ?? '')).map((o) => ({ label: o.label, props: { [c.name]: o.value } })),
    ),
  ];
}

/** A block in each of its versions, filled in as an example, under its name (and the version's). */
function BlockShown({ block, data }: { block: SiteBlock; data: BlockData }) {
  const example = exampleOf(block, data);
  return versionsOf(block).map((v) => (
    <Part key={v.label} name={v.label ? `${block.label} · ${v.label}` : block.label} use={block.hint}>
      <Preview>{preview(block.type, pictured(block.fields, { ...example, ...v.props }), data)}</Preview>
    </Part>
  ));
}

/** The theme's chips, as the site draws them: every kind, elevated on a picture, in every state (chosen, with an icon or
 * a picture, with the button that removes it, dragged, only shown) and disabled. */
function ChipParts() {
  const row = 'flex flex-wrap items-center gap-3';
  const { input, filter, suggestion, assist } = screens.chipKinds;
  return (
    <Part name="Chip" use={screens.chip}>
      <Preview>
        <div className="space-y-4 p-4">
          <div className={row}>
            {chipKinds.map((k) => (
              <SiteChip key={k} kind={k} label={screens.chipKinds[k]} />
            ))}
          </div>
          <div className={`${row} rounded-xl bg-cover bg-center p-4`} style={{ backgroundImage: `url("${examplePicture}")` }}>
            <SiteChip elevated icon="calendar-blank" label={`${assist} · ${screens.elevated}`} />
            <SiteChip elevated kind="filter" label={`${filter} · ${screens.elevated}`} />
            <SiteChip elevated kind="filter" selected label={screens.selected} />
            <SiteChip elevated kind="suggestion" label={`${suggestion} · ${screens.elevated}`} />
          </div>
          <div className={row}>
            <SiteChip kind="filter" selected label={screens.selected} />
            <SiteChip kind="filter" label={filter} />
            <SiteChip kind="suggestion" selected label={`${suggestion} · ${screens.selected}`} />
            <SiteChip icon="calendar-blank" label={screens.withIcon} />
            <SiteChip kind="input" trailingIcon="x" label={input} />
            <SiteChip kind="input" avatar={examplePicture} removeLabel={screens.remove(screens.withAvatar)} label={screens.withAvatar} />
            <SiteChip kind="input" selected removeLabel={screens.remove(screens.selected)} label={screens.selected} />
            <SiteChip kind="input" dragged avatar={examplePicture} label={screens.dragged} />
            <SiteChip plain label={screens.plain} />
          </div>
          <div className={row}>
            {chipKinds.map((k) => (
              <SiteChip key={k} kind={k} disabled label={screens.disabled} />
            ))}
            <SiteChip kind="input" disabled removeLabel={screens.remove(screens.disabled)} label={screens.disabled} />
            <SiteChip elevated disabled label={`${screens.elevated} · ${screens.disabled}`} />
            <SiteChip href="" disabled label={screens.disabled} />
          </div>
        </div>
      </Preview>
    </Part>
  );
}

// The standard blocks (not HTML, which has no look of its own).
const standardBlocks = siteBlocks.filter((b) => standardTypes.has(b.type));

// The kinds a toggle button can be (Material: never a text button).
const toggleKinds = buttonKinds.filter((k) => k !== 'text');

/** The theme's buttons and icon buttons, as the site draws them: every kind, the five sizes, both shapes, each kind
 * that can be a toggle off and on in both shapes, the icon buttons' widths, with an icon, and disabled. */
function UiParts() {
  const row = 'flex flex-wrap items-center gap-3';
  const kinds = t.blocks.buttons.kinds;
  return (
    <>
      <Part name="Button" use={screens.button}>
        <Preview>
          <div className="space-y-4 p-4">
            <div className={row}>
              {buttonKinds.map((k) => (
                <SiteButton key={k} kind={k}>
                  {kinds[k]}
                </SiteButton>
              ))}
            </div>
            <div className={row}>
              {buttonSizes.map((size) => (
                <SiteButton key={size} size={size}>
                  {screens.sizes[size]}
                </SiteButton>
              ))}
            </div>
            <div className={row}>
              {buttonSizes.map((size) => (
                <SiteButton key={size} size={size} shape="square" kind="tonal">
                  {screens.sizes[size]}
                </SiteButton>
              ))}
            </div>
            {buttonShapes.map((shape) => (
              <div key={shape} className={row} role="group" aria-label={screens.shapes[shape]}>
                {toggleKinds.map((k) =>
                  ([false, true] as const).map((on) => (
                    <SiteButton key={`${k}-${on}`} kind={k} shape={shape} selected={on} icon="heart">
                      {on ? screens.toggle.on : screens.toggle.off}
                    </SiteButton>
                  )),
                )}
              </div>
            ))}
            <div className={row}>
              <SiteButton icon="phone">{screens.withIcon}</SiteButton>
              <SiteButton kind="outlined" trailingIcon="arrow-right">
                {screens.withIcon}
              </SiteButton>
              {buttonKinds.map((k) => (
                <SiteButton key={k} kind={k} disabled>
                  {screens.disabled}
                </SiteButton>
              ))}
              <SiteButton selected disabled>
                {screens.disabled}
              </SiteButton>
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="IconButton" use={screens.iconButton}>
        <Preview>
          <div className="space-y-4 p-4">
            <div className={row}>
              {iconButtonKinds.map((k) => (
                <SiteIconButton key={k} kind={k} icon="x" label={screens.iconKinds[k]} title={screens.iconKinds[k]} />
              ))}
            </div>
            <div className={row}>
              {buttonSizes.map((size) => (
                <SiteIconButton key={size} kind="filled" size={size} icon="phone" label={screens.sizes[size]} title={screens.sizes[size]} />
              ))}
            </div>
            <div className={row}>
              {buttonSizes.map((size) => (
                <SiteIconButton
                  key={size}
                  kind="tonal"
                  size={size}
                  shape="square"
                  icon="phone"
                  label={`${screens.sizes[size]}, ${screens.shapes.square}`}
                  title={`${screens.sizes[size]}, ${screens.shapes.square}`}
                />
              ))}
            </div>
            <div className={row}>
              {(['small', 'medium'] as const).flatMap((size) =>
                iconButtonWidths.map((width) => (
                  <SiteIconButton
                    key={`${size}-${width}`}
                    kind="outlined"
                    size={size}
                    width={width}
                    icon="phone"
                    label={`${screens.sizes[size]}, ${screens.widths[width]}`}
                    title={`${screens.sizes[size]}, ${screens.widths[width]}`}
                  />
                )),
              )}
            </div>
            {buttonShapes.map((shape) => (
              <div key={shape} className={row} role="group" aria-label={screens.shapes[shape]}>
                {iconButtonKinds.map((k) =>
                  ([false, true] as const).map((on) => (
                    <SiteIconButton
                      key={`${k}-${on}`}
                      kind={k}
                      shape={shape}
                      selected={on}
                      icon="heart"
                      label={`${screens.iconKinds[k]}, ${on ? screens.toggle.on : screens.toggle.off}`}
                      title={`${screens.iconKinds[k]}, ${on ? screens.toggle.on : screens.toggle.off}`}
                    />
                  )),
                )}
              </div>
            ))}
            <div className={row}>
              {iconButtonKinds.map((k) => (
                <SiteIconButton key={k} kind={k} icon="phone" label={screens.disabled} disabled />
              ))}
              <SiteIconButton kind="filled" icon="phone" label={screens.disabled} selected disabled />
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}

/** The theme's form controls, as the site draws them: each kind of text field empty, filled in, with a line under it,
 * with an error, with only a placeholder and disabled, with an icon before it, a search field with its clear button, a
 * prefix and a suffix, the error's icon, a password with its button, a counter, read-only, and several lines (growing,
 * and three rows); and a checkbox empty, ticked, with a line, disabled, indeterminate and wrong. */
function FieldParts() {
  const fields = 'grid gap-6 sm:grid-cols-2';
  return (
    <>
      <Part name="TextField" use={screens.textField}>
        <Preview>
          <div className="space-y-6 p-4">
            {(['outlined', 'filled'] as const).map((kind) => (
              <div key={kind} className={fields} aria-label={screens.fieldKinds[kind]} role="group">
                <SiteTextField kind={kind} label={screens.fieldLabel} type="email" />
                <SiteTextField kind={kind} label={screens.fieldLabel} type="email" defaultValue={screens.fieldValue} />
                <SiteTextField kind={kind} label={screens.fieldLabel} type="email" supporting={screens.fieldSupporting} />
                <SiteTextField kind={kind} label={screens.fieldLabel} type="email" defaultValue="navn@" error={screens.fieldError} />
                <SiteTextField kind={kind} label={screens.fieldLabel} hideLabel type="email" placeholder={screens.fieldPlaceholder} />
                <SiteTextField kind={kind} label={screens.fieldLabel} type="email" disabled />
                <SiteTextField kind={kind} label={screens.fieldLabel} type="email" leadingIcon="envelope-simple" />
                <SiteTextField
                  kind={kind}
                  label={screens.fieldSearch}
                  hideLabel
                  type="search"
                  placeholder={screens.fieldSearch}
                  leadingIcon="magnifying-glass"
                  clearLabel={screens.fieldClear}
                  defaultValue={screens.fieldNote}
                />
                <SiteTextField kind={kind} label={screens.fieldPhone} type="tel" prefix={screens.fieldPrefix} defaultValue="12 34 56 78" />
                <SiteTextField kind={kind} label={screens.fieldPrice} inputMode="numeric" suffix={screens.fieldSuffix} defaultValue="450" />
                <SiteTextField
                  kind={kind}
                  label={screens.fieldLabel}
                  type="email"
                  defaultValue="navn@"
                  error={screens.fieldError}
                  leadingIcon="envelope-simple"
                  errorIcon
                />
                <SiteTextField
                  kind={kind}
                  label={screens.fieldPassword}
                  type="password"
                  defaultValue={screens.fieldPasswordValue}
                  passwordLabel={screens.fieldShowPassword}
                />
                <SiteTextField
                  kind={kind}
                  label={screens.fieldName}
                  supporting={screens.fieldNameSupporting}
                  counter
                  maxLength={30}
                  defaultValue={screens.fieldValue}
                />
                <SiteTextField kind={kind} label={screens.fieldReadOnly} readOnly defaultValue={screens.fieldReadOnlyValue} />
                <SiteTextField kind={kind} label={screens.fieldMessage} multiline defaultValue={screens.fieldMessageValue} />
                <SiteTextField kind={kind} label={screens.fieldNote} rows={3} counter maxLength={200} />
              </div>
            ))}
          </div>
        </Preview>
      </Part>
      <Part name="Checkbox" use={screens.checkbox}>
        <Preview>
          <div className={`${fields} p-4`}>
            <SiteCheckbox label={screens.checkboxLabel} />
            <SiteCheckbox label={screens.checkboxLabel} checked />
            <SiteCheckbox label={screens.checkboxLabel} supporting={screens.checkboxSupporting} />
            <SiteCheckbox label={screens.checkboxLabel} supporting={screens.checkboxSupporting} checked disabled />
            <SiteCheckbox label={screens.checkboxParent} supporting={screens.checkboxSupporting} indeterminate />
            <SiteCheckbox label={screens.checkboxParent} indeterminate disabled />
            <SiteCheckbox label={screens.checkboxLabel} error={screens.checkboxError} />
            <SiteCheckbox label={screens.checkboxLabel} error checked />
          </div>
        </Preview>
      </Part>
    </>
  );
}

/** The theme's cards in each kind, one a link, and lists: one line, a link and an icon with a text under it; one, two
 * and three lines; each leading kind; the choices; selected and disabled; each kind of dividers; and segmented. */
function CardParts() {
  const say = screens.cardsAndLists;
  const [one, link, withIcon] = say.items;
  const lists = say.lists;
  const [icon, avatar, avatarPicture, image, video] = lists.headlines;
  const [checkbox, radio, switchItem, after] = lists.choices;
  return (
    <>
      <Part name="Card" use={say.card}>
        <Preview>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {cardKinds.map((k) => (
              <SiteCard key={k} kind={k}>
                <p className="font-medium">{say.kinds[k]}</p>
                <p className="mt-1 text-muted">{say.text}</p>
              </SiteCard>
            ))}
            <SiteCard href="">
              <p className="font-medium">{say.link}</p>
              <p className="mt-1 text-muted">{say.text}</p>
            </SiteCard>
          </div>
        </Preview>
      </Part>
      <Part name="List" use={say.list}>
        <Preview>
          <div className="grid items-start gap-4 p-4 lg:grid-cols-2">
            <SiteCard>
              <SiteList>
                <SiteListItem headline={one} />
                <SiteListItem href="" headline={link} trailing={<Svg name="arrow-right" size={18} />} />
                <SiteListItem
                  href=""
                  leading={<Svg name="phone" size={24} />}
                  headline={withIcon}
                  supporting={say.supporting}
                  trailing={<Svg name="caret-right" size={20} />}
                />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList aria-label={lists.lines}>
                <SiteListItem href="" headline={one} trailingSupporting={lists.trailing} />
                <SiteListItem href="" headline={one} supporting={say.supporting} trailingIcon="caret-right" />
                <SiteListItem href="" overline={lists.overline} headline={one} supporting={say.supporting} trailingIcon="caret-right" />
                <SiteListItem
                  href=""
                  lines={3}
                  leadingIcon="calendar-blank"
                  headline={one}
                  supporting={lists.long}
                  trailingSupporting={lists.trailing}
                />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList dividers="inset" aria-label={lists.leading}>
                <SiteListItem href="" leadingIcon="phone" headline={icon} supporting={say.supporting} trailingIcon="caret-right" />
                <SiteListItem
                  href=""
                  leadingAvatar={lists.letter}
                  headline={avatar}
                  supporting={say.supporting}
                  trailingSupporting={lists.trailing}
                />
                <SiteListItem href="" leadingAvatar={{ src: examplePicture }} headline={avatarPicture} supporting={say.supporting} />
                <SiteListItem href="" leadingImage={{ src: examplePicture }} headline={image} supporting={say.supporting} />
                <SiteListItem href="" leadingVideo={{ src: examplePicture }} lines={3} headline={video} supporting={lists.long} />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList aria-label={lists.controls}>
                <SiteListItem control={{ type: 'checkbox', checked: true }} headline={checkbox} supporting={say.supporting} />
                <SiteListItem control={{ type: 'radio-button', name: 'parts-list-radio', checked: true }} headline={radio} />
                <SiteListItem control={{ type: 'radio-button', name: 'parts-list-radio' }} headline={radio} />
                <SiteListItem control={{ type: 'switch', checked: true, icons: 'selected' }} leadingIcon="moon" headline={switchItem} />
                <SiteListItem control={{ type: 'checkbox', at: 'trailing' }} leadingAvatar={lists.letter} headline={after} />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList aria-label={lists.states}>
                <SiteListItem href="" selected leadingIcon="house" headline={lists.selected} supporting={say.supporting} />
                <SiteListItem href="" disabled leadingIcon="house" headline={lists.disabled} supporting={say.supporting} />
                <SiteListItem control={{ type: 'switch' }} disabled headline={lists.disabled} />
              </SiteList>
            </SiteCard>
            {(['middle-inset', 'none'] as const).map((dividers) => (
              <SiteCard key={dividers}>
                <SiteList dividers={dividers} aria-label={lists.dividers[dividers]}>
                  {[icon, avatar, image].map((h) => (
                    <SiteListItem
                      key={h}
                      href=""
                      leadingIcon="phone"
                      headline={`${lists.dividers[dividers]} · ${h}`}
                      trailingIcon="caret-right"
                    />
                  ))}
                </SiteList>
              </SiteCard>
            ))}
            <SiteList kind="segmented" aria-label={lists.segmented}>
              <SiteListItem href="" leadingIcon="phone" headline={lists.segmented} supporting={say.supporting} trailingIcon="caret-right" />
              <SiteListItem
                href=""
                selected
                leadingIcon="envelope-simple"
                headline={lists.selected}
                supporting={say.supporting}
                trailingIcon="caret-right"
              />
              <SiteListItem control={{ type: 'checkbox', checked: true }} headline={checkbox} />
              <SiteListItem control={{ type: 'switch' }} leadingIcon="moon" headline={switchItem} />
              <SiteListItem href="" disabled leadingIcon="map-pin" headline={lists.disabled} />
            </SiteList>
          </div>
        </Preview>
      </Part>
    </>
  );
}

export function ThemeParts() {
  const data = useMemo(exampleData, []);
  const groups = [
    { id: 'ui', title: screens.ui },
    { id: 'fields', title: screens.fields },
    { id: 'chips', title: screens.chips },
    { id: 'containment', title: screens.containment.title },
    { id: 'cards', title: screens.cardsAndLists.title },
    { id: 'navigation', title: screens.navigation.title },
    { id: 'actions', title: screens.actions.title },
    { id: 'selection', title: screens.selection.title },
    { id: 'communication', title: screens.communication.title },
    { id: 'navigationRest', title: screens.navigationRest.title },
    { id: 'pickers', title: screens.pickers.title },
    ...standardBlocks.map((b) => ({ id: b.type, title: b.label })),
  ];
  return (
    <Screen title={screens.theme} back={back}>
      <div className="space-y-10">
        <p className="text-muted">{screens.themeIntro}</p>
        <PartsShown groups={groups} keep="parts-theme" search={screens.search} none={screens.none}>
          <PartGroup group="ui">
            <UiParts />
          </PartGroup>
          <PartGroup group="fields">
            <FieldParts />
          </PartGroup>
          <PartGroup group="chips">
            <ChipParts />
          </PartGroup>
          <PartGroup group="containment">
            <ContainmentParts />
          </PartGroup>
          <PartGroup group="cards">
            <CardParts />
          </PartGroup>
          <PartGroup group="navigation">
            <NavigationParts />
          </PartGroup>
          <PartGroup group="actions">
            <ActionParts />
          </PartGroup>
          <PartGroup group="selection">
            <SelectionParts />
          </PartGroup>
          <PartGroup group="communication">
            <CommunicationParts />
          </PartGroup>
          <PartGroup group="navigationRest">
            <NavigationRestParts />
          </PartGroup>
          <PartGroup group="pickers">
            <PickerParts />
          </PartGroup>
          {standardBlocks.map((b) => (
            <PartGroup key={b.type} group={b.type}>
              <BlockShown block={b} data={data} />
            </PartGroup>
          ))}
        </PartsShown>
      </div>
    </Screen>
  );
}

export function AppParts() {
  const data = useMemo(exampleData, []);
  // Each app with its blocks and the kinds it draws; one with neither is not shown.
  const shown = apps
    .map((app) => ({
      app,
      blocks: siteBlocks.filter((b) => b.app === app.id),
      kinds: Object.entries(app.kinds ?? {})
        .map(([list, k]) => ({
          ...k,
          draw: kindDraw(k, collections.find((c) => c.id === list && c.kind === 'folder') as FolderCollection),
        }))
        .filter((k) => k.draw),
    }))
    .filter((a) => a.blocks.length || a.kinds.length);
  const entry = { ...t.parts.examples.entry, image: examplePicture };
  return (
    <Screen title={screens.apps} back={back}>
      <div className="space-y-10">
        <p className="text-muted">{screens.appsIntro}</p>
        {shown.length ? (
          <PartsShown
            groups={shown.map(({ app }) => ({ id: app.id, title: app.label }))}
            keep="parts-apps"
            search={screens.search}
            none={screens.none}
          >
            {shown.map(({ app, blocks, kinds }) => (
              <PartGroup key={app.id} group={app.id}>
                {blocks.map((b) => (
                  <BlockShown key={b.type} block={b} data={data} />
                ))}
                {kinds.flatMap((k) =>
                  (k.variants ?? [{ label: '', props: {} }]).map((v) => (
                    <Part key={`${k.label} ${v.label}`} name={v.label ? `${k.label} · ${v.label}` : k.label} use={k.hint}>
                      <Preview>{k.draw!({ ...entry, ...v.props }, data)}</Preview>
                    </Part>
                  )),
                )}
              </PartGroup>
            ))}
          </PartsShown>
        ) : (
          <EmptyNote>{screens.noApps}</EmptyNote>
        )}
      </div>
    </Screen>
  );
}
