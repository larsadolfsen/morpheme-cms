// The theme's UI components in every kind, size and state, as the site draws them: the gallery of "Parts" › "UI components"
// (#developer/parts/ui, BlockParts.tsx) and of the site's UI components page (`componentsPath`, pages/components.astro), one list of
// groups and parts for both, so the two never differ. The theme gives the components their look; here are only the rows and the names.
import { Example, Part, PartGroup, PartSub } from './PartsShown';
import FrameParts from './FrameParts';
import { Preview } from './ui';
import {
  SiteButton,
  SiteAvatar,
  SiteCard,
  SiteCheckbox,
  SiteChip,
  SiteIconButton,
  SiteList,
  SiteListItem,
  SiteTextField,
  buttonShapes,
  buttonSizes,
  iconButtonSizes,
  cardKinds,
  chipKinds,
  chipSetLayouts,
  SiteChipSet,
  iconButtonWidths,
} from './themeUi';
import ContainmentParts from './ContainmentParts';
import NavigationParts from './NavigationParts';
import ActionParts from './ActionParts';
import SelectionParts from './SelectionParts';
import CommunicationParts from './CommunicationParts';
import NavigationRestParts from './NavigationRestParts';
import PickerParts from './PickerParts';
import { buttonKinds, iconButtonKinds } from './standard/view';
import { exampleImage } from './examples';
import { t } from './i18n';
import { Svg } from './icon';

const { screens } = t.parts;

/** The theme's chips, as the site draws them: every kind, elevated on an image, in every state (chosen, with an icon or
 * an image, with the button that removes it, dragged, only shown) and disabled. */
function ChipParts() {
  const row = 'mo-editor-parts-row';
  const { input, filter, suggestion, assist } = screens.chipKinds;
  return (
    <Part name="Chip" m3="md.comp.chip" use={screens.chip}>
      <Preview>
        <div className="mo-editor-parts-chips">
          <PartSub name={screens.rows.kinds}>
            <div className={row}>
              {chipKinds.map((k) => (
                <SiteChip key={k} kind={k} label={screens.chipKinds[k]} />
              ))}
            </div>
          </PartSub>
          <PartSub name={screens.elevated}>
            <div className={`${row} mo-editor-parts-chip-image`} style={{ backgroundImage: `url("${exampleImage}")` }}>
              <SiteChip elevated icon="calendar-blank" label={`${assist} · ${screens.elevated}`} />
              <SiteChip elevated kind="filter" label={`${filter} · ${screens.elevated}`} />
              <SiteChip elevated kind="filter" selected label={screens.selected} />
              <SiteChip elevated kind="suggestion" label={`${suggestion} · ${screens.elevated}`} />
            </div>
          </PartSub>
          <PartSub name={screens.selected}>
            <div className={row}>
              <Example label={`${filter} · ${screens.selected}`} flat>
                <SiteChip kind="filter" selected label={screens.selected} />
              </Example>
              <SiteChip kind="filter" label={filter} />
              <SiteChip kind="suggestion" selected label={`${suggestion} · ${screens.selected}`} />
              <SiteChip icon="calendar-blank" label={screens.withIcon} />
              <SiteChip kind="input" trailingIcon="x" label={input} />
              <SiteChip kind="input" avatar={exampleImage} removeLabel={screens.remove(screens.withAvatar)} label={screens.withAvatar} />
              <Example label={`${input} · ${screens.selected}`} flat>
                <SiteChip kind="input" selected removeLabel={screens.remove(screens.selected)} label={screens.selected} />
              </Example>
              <SiteChip kind="input" dragged avatar={exampleImage} label={screens.dragged} />
              <SiteChip plain label={screens.plain} />
            </div>
          </PartSub>
          <PartSub name={screens.disabled}>
            <div className={row}>
              {chipKinds.map((k) => (
                <Example key={k} label={screens.chipKinds[k]} flat>
                  <SiteChip kind={k} disabled label={screens.disabled} />
                </Example>
              ))}
              <Example label={screens.example(1)} flat>
                <SiteChip kind="input" disabled removeLabel={screens.remove(screens.disabled)} label={screens.disabled} />
              </Example>
              <SiteChip elevated disabled label={`${screens.elevated} · ${screens.disabled}`} />
              <Example label={screens.example(2)} flat>
                <SiteChip href="" disabled label={screens.disabled} />
              </Example>
            </div>
          </PartSub>
        </div>
      </Preview>
    </Part>
  );
}

/** The theme's chip sets, as the site draws them: each layout, with more chips than there is room for on one line. */
function ChipSetParts() {
  return (
    <Part name="ChipSet" m3="md.comp.chip" use={screens.chipSet}>
      <Preview>
        <div className="mo-editor-parts-chip-sets">
          {chipSetLayouts.map((layout) => (
            <SiteChipSet key={layout} layout={layout} label={screens.chipSetLayouts[layout]}>
              {[...chipKinds, ...chipKinds].map((k, i) => (
                <SiteChip key={i} kind="filter" selected={!i} label={`${screens.chipSetLayouts[layout]} ${i + 1}`} />
              ))}
            </SiteChipSet>
          ))}
        </div>
      </Preview>
    </Part>
  );
}

// The kinds a toggle button can be (Material: never a text button).
const toggleKinds = buttonKinds.filter((k) => k !== 'text');

/** The theme's buttons and icon buttons, as the site draws them: every kind, the five sizes, both shapes, each kind
 * that can be a toggle off and on in both shapes, the icon buttons' widths, with an icon, and disabled. */
function ButtonParts() {
  const row = 'mo-editor-parts-row';
  const kinds = t.blocks.buttons.kinds;
  return (
    <>
      <Part name="Button" m3="md.comp.button" use={screens.button}>
        <Preview>
          <div className="mo-editor-parts-chips">
            <PartSub name={screens.rows.kinds}>
              <div className={row}>
                {buttonKinds.map((k) => (
                  <SiteButton key={k} kind={k}>
                    {kinds[k]}
                  </SiteButton>
                ))}
              </div>
            </PartSub>
            <PartSub name={screens.rows.sizes}>
              <div className={row}>
                {buttonSizes.map((size) => (
                  <SiteButton key={size} size={size}>
                    {screens.sizes[size]}
                  </SiteButton>
                ))}
              </div>
            </PartSub>
            <PartSub name={`${screens.rows.sizes}, ${screens.shapes.square}`}>
              <div className={row}>
                {buttonSizes.map((size) => (
                  <SiteButton key={size} size={size} shape="square" kind="tonal">
                    {screens.sizes[size]}
                  </SiteButton>
                ))}
              </div>
            </PartSub>
            {buttonShapes.map((shape) => (
              <PartSub key={shape} name={screens.subs.toggle(screens.shapes[shape])}>
                <div className={row}>
                  {toggleKinds.map((k) => (
                    <Example key={k} label={kinds[k]} flat>
                      {([false, true] as const).map((on) => (
                        <SiteButton key={`${k}-${on}`} kind={k} shape={shape} selected={on} icon="heart">
                          {on ? screens.toggle.on : screens.toggle.off}
                        </SiteButton>
                      ))}
                    </Example>
                  ))}
                </div>
              </PartSub>
            ))}
            <PartSub name={screens.rows.states}>
              <div className={row}>
                <Example label={screens.example(1)} flat>
                  <SiteButton icon="phone">{screens.withIcon}</SiteButton>
                </Example>
                <Example label={screens.example(2)} flat>
                  <SiteButton kind="outlined" trailingIcon="arrow_forward">
                    {screens.withIcon}
                  </SiteButton>
                </Example>
                {buttonKinds.map((k) => (
                  <Example key={k} label={`${kinds[k]}, ${screens.disabled}`} flat>
                    <SiteButton kind={k} disabled>
                      {screens.disabled}
                    </SiteButton>
                  </Example>
                ))}
                <Example label={`${screens.selected}, ${screens.disabled}`} flat>
                  <SiteButton selected disabled>
                    {screens.disabled}
                  </SiteButton>
                </Example>
              </div>
            </PartSub>
          </div>
        </Preview>
      </Part>
      <Part name="IconButton" m3="md.comp.icon-button" use={screens.iconButton}>
        <Preview>
          <div className="mo-editor-parts-chips">
            <PartSub name={screens.rows.kinds}>
              <div className={row}>
                {iconButtonKinds.map((k) => (
                  <SiteIconButton key={k} kind={k} icon="x" label={screens.iconKinds[k]} title={screens.iconKinds[k]} />
                ))}
              </div>
            </PartSub>
            <PartSub name={screens.rows.sizes}>
              <div className={row}>
                {iconButtonSizes.map((size) => (
                  <SiteIconButton
                    key={size}
                    kind="filled"
                    size={size}
                    icon="phone"
                    label={screens.sizes[size]}
                    title={screens.sizes[size]}
                  />
                ))}
              </div>
            </PartSub>
            <PartSub name={`${screens.rows.sizes}, ${screens.shapes.square}`}>
              <div className={row}>
                {iconButtonSizes.map((size) => (
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
            </PartSub>
            <PartSub name={screens.subs.widths}>
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
            </PartSub>
            {buttonShapes.map((shape) => (
              <PartSub key={shape} name={screens.subs.toggle(screens.shapes[shape])}>
                <div className={row}>
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
              </PartSub>
            ))}
            <PartSub name={screens.rows.states}>
              <div className={row}>
                {iconButtonKinds.map((k) => (
                  <Example key={k} label={screens.iconKinds[k]} flat>
                    <SiteIconButton kind={k} icon="phone" label={screens.disabled} disabled />
                  </Example>
                ))}
                <Example label={screens.selected} flat>
                  <SiteIconButton kind="filled" icon="phone" label={screens.disabled} selected disabled />
                </Example>
              </div>
            </PartSub>
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
  const fields = 'mo-editor-parts-field-grid';
  return (
    <>
      <Part name="TextField" m3="md.comp.text-field" use={screens.textField}>
        <Preview>
          <div className="mo-editor-parts-fields">
            {(['outlined', 'filled'] as const).map((kind) => (
              <PartSub key={kind} name={screens.fieldKinds[kind]}>
                <div className={fields}>
                  <SiteTextField kind={kind} label={screens.fieldLabel} type="email" />
                  <SiteTextField kind={kind} label={screens.fieldLabel} type="email" defaultValue={screens.fieldValue} />
                  <SiteTextField kind={kind} label={screens.fieldLabel} type="email" supporting={screens.fieldSupporting} />
                  <SiteTextField kind={kind} label={screens.fieldLabel} type="email" defaultValue="name@" error={screens.fieldError} />
                  <SiteTextField
                    kind={kind}
                    label={screens.fieldLabel}
                    type="email"
                    required
                    data-part="invalid-field"
                    supporting={screens.fieldSupporting}
                    invalidText={screens.fieldError}
                  />
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
                  <SiteTextField
                    kind={kind}
                    label={screens.fieldPhone}
                    type="tel"
                    prefix={screens.fieldPrefix}
                    defaultValue="12 34 56 78"
                  />
                  <SiteTextField
                    kind={kind}
                    label={screens.fieldPrice}
                    inputMode="numeric"
                    suffix={screens.fieldSuffix}
                    defaultValue="450"
                  />
                  <SiteTextField
                    kind={kind}
                    label={screens.fieldPrice}
                    type="number"
                    data-part="invalid-number"
                    supporting={screens.fieldNameSupporting}
                    invalidText={t.check.notANumber}
                  />
                  <SiteTextField
                    kind={kind}
                    label={screens.fieldLabel}
                    type="email"
                    defaultValue="name@"
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
              </PartSub>
            ))}
          </div>
        </Preview>
      </Part>
      <Part name="Checkbox" m3="md.comp.checkbox" use={screens.checkbox}>
        <Preview>
          <div className={`${fields} mo-editor-parts-checkboxes`}>
            <Example label={screens.example(1)} flat>
              <SiteCheckbox label={screens.checkboxLabel} />
            </Example>
            <Example label={screens.example(2)} flat>
              <SiteCheckbox label={screens.checkboxLabel} checked />
            </Example>
            <Example label={screens.example(3)} flat>
              <SiteCheckbox label={screens.checkboxLabel} supporting={screens.checkboxSupporting} />
            </Example>
            <Example label={screens.example(4)} flat>
              <SiteCheckbox label={screens.checkboxLabel} supporting={screens.checkboxSupporting} checked disabled />
            </Example>
            <Example label={screens.example(5)} flat>
              <SiteCheckbox label={screens.checkboxParent} supporting={screens.checkboxSupporting} indeterminate />
            </Example>
            <Example label={screens.example(6)} flat>
              <SiteCheckbox label={screens.checkboxParent} indeterminate disabled />
            </Example>
            <Example label={screens.example(7)} flat>
              <SiteCheckbox label={screens.checkboxLabel} error={screens.checkboxError} />
            </Example>
            <Example label={screens.example(8)} flat>
              <SiteCheckbox label={screens.checkboxLabel} error={screens.checkboxError} checked />
            </Example>
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
  const [icon, avatar, avatarImage, image, video] = lists.headlines;
  const [checkbox, radio, switchItem, after] = lists.choices;
  return (
    <>
      <Part name="Card" m3="md.comp.card" use={say.card}>
        <Preview>
          <div className="mo-editor-parts-cards">
            {cardKinds.map((k) => (
              <SiteCard key={k} kind={k}>
                <p className="mo-editor-parts-card-title">{say.kinds[k]}</p>
                <p className="mo-editor-parts-card-text">{say.text}</p>
              </SiteCard>
            ))}
            <SiteCard href="">
              <p className="mo-editor-parts-card-title">{say.link}</p>
              <p className="mo-editor-parts-card-text">{say.text}</p>
            </SiteCard>
            {cardKinds.map((k) => (
              <Example key={`${k}-parts`} label={say.kinds[k]} flat>
                <SiteCard
                  kind={k}
                  media={<img src={exampleImage} alt="" />}
                  headline={say.anatomy.headline}
                  subhead={say.kinds[k]}
                  supporting={say.anatomy.supporting}
                  actions={
                    <>
                      <SiteButton kind="text">{say.anatomy.save}</SiteButton>
                      <SiteButton kind="text">{say.anatomy.learnMore}</SiteButton>
                    </>
                  }
                />
              </Example>
            ))}
            <SiteCard
              kind="outlined"
              icon={<Svg name="heart" size={24} />}
              headline={say.anatomy.headline}
              supporting={say.anatomy.supporting}
            />
            <SiteCard href="" kind="filled" headline={say.anatomy.headline} subhead={say.link} supporting={say.anatomy.supporting} />
            <SiteCard kind="outlined" selected headline={say.anatomy.headline} supporting={say.anatomy.supporting} />
            {cardKinds.map((k) => (
              <SiteCard key={k} kind={k} dragged>
                <p className="mo-editor-parts-card-title">{`${say.kinds[k]} · ${screens.dragged}`}</p>
                <p className="mo-editor-parts-card-text">{say.text}</p>
              </SiteCard>
            ))}
          </div>
        </Preview>
      </Part>
      <Part name="Avatar" m3="none" use={say.avatar}>
        <Preview>
          <div className="mo-editor-parts-list-row">
            <SiteAvatar>{lists.letter}</SiteAvatar>
            <SiteAvatar image={{ src: exampleImage }} />
          </div>
        </Preview>
      </Part>
      <Part name="List" m3="md.comp.list" use={say.list}>
        <Preview>
          <div className="mo-editor-parts-lists">
            <SiteCard>
              <SiteList>
                <SiteListItem headline={one} />
                <SiteListItem href="" headline={link} trailing={<Svg name="arrow_forward" size={18} />} />
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
                <SiteListItem href="" subhead={lists.overline} headline={one} supporting={say.supporting} trailingIcon="caret-right" />
                <SiteListItem
                  href=""
                  lines={3}
                  icon="calendar-blank"
                  headline={one}
                  supporting={lists.long}
                  trailingSupporting={lists.trailing}
                />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList dividers="inset" aria-label={lists.leading}>
                <SiteListItem href="" icon="phone" headline={icon} supporting={say.supporting} trailingIcon="caret-right" />
                <SiteListItem
                  href=""
                  thumbnail={lists.letter}
                  headline={avatar}
                  supporting={say.supporting}
                  trailingSupporting={lists.trailing}
                />
                <SiteListItem href="" thumbnail={{ src: exampleImage }} headline={avatarImage} supporting={say.supporting} />
                <SiteListItem href="" media={{ src: exampleImage }} headline={image} supporting={say.supporting} />
                <SiteListItem href="" media={{ src: exampleImage, video: true }} lines={3} headline={video} supporting={lists.long} />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList aria-label={lists.controls}>
                <SiteListItem control={{ type: 'checkbox', checked: true }} headline={checkbox} supporting={say.supporting} />
                <SiteListItem
                  control={{ type: 'radio-button', name: 'parts-list-radio', checked: true }}
                  headline={`${radio}, ${screens.toggle.on}`}
                />
                <SiteListItem control={{ type: 'radio-button', name: 'parts-list-radio' }} headline={`${radio}, ${screens.toggle.off}`} />
                <SiteListItem control={{ type: 'switch', checked: true, icons: 'selected' }} icon="moon" headline={switchItem} />
                <SiteListItem control={{ type: 'checkbox', at: 'trailing' }} thumbnail={lists.letter} headline={after} />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList aria-label={lists.states}>
                <SiteListItem href="" selected icon="house" headline={lists.selected} supporting={say.supporting} />
                <SiteListItem href="" disabled icon="house" headline={lists.disabled} supporting={say.supporting} />
                <SiteListItem control={{ type: 'switch' }} disabled headline={lists.disabled} />
              </SiteList>
            </SiteCard>
            <SiteCard>
              <SiteList aria-label={lists.more}>
                <SiteListItem
                  onClick={() => {}}
                  icon="pencil-simple"
                  headline={lists.tapped}
                  supporting={say.supporting}
                  trailingIcon="caret-right"
                />
                <SiteListItem
                  href=""
                  headline={lists.withActions}
                  supporting={lists.long}
                  truncate
                  actions={<SiteIconButton icon="trash" label={lists.remove} />}
                />
                <SiteListItem href="" headline={lists.address} supporting={lists.sendsTo} />
              </SiteList>
            </SiteCard>
            {(['middle-inset', 'none'] as const).map((dividers) => (
              <SiteCard key={dividers}>
                <SiteList dividers={dividers} aria-label={lists.dividers[dividers]}>
                  {[icon, avatar, image].map((h) => (
                    <SiteListItem key={h} href="" icon="phone" headline={`${lists.dividers[dividers]} · ${h}`} trailingIcon="caret-right" />
                  ))}
                </SiteList>
              </SiteCard>
            ))}
            <SiteList kind="segmented" aria-label={lists.segmented}>
              <SiteListItem href="" icon="phone" headline={lists.segmented} supporting={say.supporting} trailingIcon="caret-right" />
              <SiteListItem
                href=""
                selected
                icon="envelope-simple"
                headline={lists.selected}
                supporting={say.supporting}
                trailingIcon="caret-right"
              />
              <SiteListItem control={{ type: 'checkbox', checked: true }} headline={checkbox} />
              <SiteListItem control={{ type: 'switch' }} icon="moon" headline={switchItem} />
              <SiteListItem href="" disabled icon="map-pin" headline={lists.disabled} />
            </SiteList>
            {/* The "expand" kind (Material's "List - Expand"): items that fold out, one open at a time; the second one open. */}
            <SiteList expand aria-label={lists.expand[0]}>
              {lists.expand.map((h, i) => (
                <SiteListItem key={h} expand expandName="parts-list-expand" expandOpen={i === 1 ? true : undefined} headline={h}>
                  {lists.expandText}
                </SiteListItem>
              ))}
            </SiteList>
          </div>
        </Preview>
      </Part>
    </>
  );
}

/** The gallery's groups, in order: the editor's gallery has all of them, the site's page not the editor's own frame (`frame`). */
const GROUPS = [
  { id: 'ui', title: () => screens.ui, parts: () => <ButtonParts /> },
  { id: 'fields', title: () => screens.fields, parts: () => <FieldParts /> },
  {
    id: 'chips',
    title: () => screens.chips,
    parts: () => (
      <>
        <ChipParts />
        <ChipSetParts />
      </>
    ),
  },
  { id: 'containment', title: () => screens.containment.title, parts: () => <ContainmentParts /> },
  { id: 'cards', title: () => screens.cardsAndLists.title, parts: () => <CardParts /> },
  { id: 'navigation', title: () => screens.navigation.title, parts: () => <NavigationParts /> },
  { id: 'actions', title: () => screens.actions.title, parts: () => <ActionParts /> },
  { id: 'selection', title: () => screens.selection.title, parts: () => <SelectionParts /> },
  { id: 'communication', title: () => screens.communication.title, parts: () => <CommunicationParts /> },
  { id: 'navigationRest', title: () => screens.navigationRest.title, parts: () => <NavigationRestParts /> },
  { id: 'pickers', title: () => screens.pickers.title, parts: () => <PickerParts /> },
  { id: 'frame', title: () => screens.frame.title, parts: () => <FrameParts />, editorOnly: true },
];

/** The groups (id and title) of the gallery; `editor`: with the editor's own frame. */
export const galleryGroups = (editor: boolean) =>
  GROUPS.filter((g) => editor || !g.editorOnly).map((g) => ({ id: g.id, title: g.title() }));

/** Every group of the gallery with its heading and its parts. In the editor it stands inside PartsShown (search, order and filters). */
export function ComponentGallery({ editor = false }: { editor?: boolean }) {
  return (
    <>
      {GROUPS.filter((g) => editor || !g.editorOnly).map((g) => (
        <PartGroup key={g.id} group={g.id} title={g.title()}>
          {g.parts()}
        </PartGroup>
      ))}
    </>
  );
}
