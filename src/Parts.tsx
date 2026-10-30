// "Udseende" › "Dele" › "Editor" (#udseende/dele/editor): the parts only the editor has (ui.tsx: the SEO rating, the
// colour field, the choices of pages and icons, the form's layout …) in every state, on one screen, to see and agree on
// how the editor looks, and below them the form fields (fields.tsx), one of each type with the settings it can have.
// The parts the theme has too (buttons, fields, switches, lists, sheets …) are the theme's, shown under "Tema"
// (BlockParts.tsx). A part is changed in ui.tsx, and so everywhere at once. All of it is
// shown with the made-up site of examples.ts, never the site's own, and nothing here is saved.
import { useMemo, useRef, useState } from 'react';
import {
  AppWindow,
  Gear,
  ArrowDown,
  ArrowsDownUp,
  GoogleLogo,
  List as ListIcon,
  ListBullets,
  ArrowUp,
  CircleHalf,
  EnvelopeSimple,
  Heart,
  FolderSimple,
  Leaf,
  SignOut,
  Moon,
  PencilSimple,
  Plus,
  Sun,
  TextB,
  TextT,
  Trash,
} from '@phosphor-icons/react';
import Screen from './Screen';
import { Part, PartGroup, PartsShown, useGrouped, useSearched } from './PartsShown';
import {
  accentListItemClass,
  deleteListItemClass,
  EmptyNote,
  FoldSection,
  SharePreview,
  FormHeading,
  GroupTitle,
  mutedListItemClass,
  ProblemNote,
  SheetGroupTitle,
  SheetList,
  staticListItemClass,
  ArrowLink,
  Button,
  Checkbox,
  CheckList,
  ScoreRing,
  FieldGroup,
  FoldItem,
  FoldList,
  IconPicker,
  ImagePick,
  MultiChoice,
  SheetBody,
  SheetLink,
  ShownValue,
  subListClass,
  subListItemClass,
  Choice,
  NewChoice,
  Filters,
  FormColumns,
  ChoiceListItem,
  ChoiceTile,
  ColorField,
  PhoneField,
  Group,
  IconButton,
  LeadingIcon,
  LeadingImage,
  Label,
  listClass,
  Notice,
  Option,
  PageFrame,
  Preview,
  listItemClass,
  SearchRow,
  Select,
  BottomSheet,
  SheetActions,
  SheetTitle,
  TextArea,
  TextField,
  ToolbarButton,
  UnfoldButton,
  TrailingText,
  ColorSwatches,
  ColorsPreview,
  ChoiceRow,
  IconSwatches,
  TrailingIcon,
} from './ui';
import { FieldList, Fields, useWrongField, WrongField, type FieldContext } from './fields';
import { newValue, problemAt } from './check';
import { Icon, iconOptions } from './icon';
import { examplePicture, exampleData } from './examples';
import { exampleOf } from './blocks';
import { siteBlocks } from './registry';
import type { Field } from './schema';
import { defaultColors, iconPacks } from '@site/editor';
import type { Env } from './App';
import { t } from './i18n';

const { use, sample, examples } = t.parts;

// The groups the parts are shown in, as Material 3 sorts its components; the field types last.
const GROUPS = (['buttons', 'fields', 'choices', 'lists', 'sheets', 'messages', 'layout', 'fieldTypes'] as const).map((id) => ({
  id,
  title: t.parts.filter.group[id],
}));

export default function Parts({ env }: { env: Env }) {
  const [sort, setSort] = useState('nyeste');
  const [filter, setFilter] = useState('');
  const [content, setContent] = useState('');
  const [picked, setPicked] = useState('a');
  const [query, setQuery] = useState('');
  const [seo, setSeo] = useState(false);
  const [asMenu, setAsMenu] = useState(false);
  const [color, setColor] = useState('#3f6db3');
  const [phone, setPhone] = useState({ code: '+45', number: examples.contact.phone });
  const [tile, setTile] = useState(0);
  const [placement, setPlacement] = useState('top');
  const [unfolded, setUnfolded] = useState(false);
  const [front, setFront] = useState(true);
  // An e-mail address without its domain: the field says what is wrong.
  const [mail, setMail] = useState(t.parts.fields.values.email.replace(/@.*/, '@'));
  const mailWrong = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.trim());
  const [icon, setIcon] = useState('heart');
  const [picture, setPicture] = useState(examplePicture);
  const [folded, setFolded] = useState<number | null>(0);
  const [sectionOpen, setSectionOpen] = useState<number | null>(0);
  const [tags, setTags] = useState(['a', 'b']);
  const dialog = useRef<HTMLDialogElement>(null);
  const fieldsDialog = useRef<HTMLDialogElement>(null);
  const pageDialog = useRef<HTMLDialogElement>(null);
  const row = 'flex flex-wrap items-center gap-3';
  const page = useMemo(() => exampleData().relations.pages[1].value, []);

  return (
    <Screen title={t.parts.screens.editor} back={{ href: '#udseende/dele', label: t.common.parts.editorParts }}>
      <div className="space-y-10">
        <p className="text-muted">{t.parts.intro('packages/editor/src/ui.tsx')}</p>
        <PartsShown groups={GROUPS} keep="parts">
          <PartGroup group="buttons">
            <Part name="ToolbarButton" use={use.toolbarButton}>
              <div className="flex gap-0.5">
                <ToolbarButton icon={TextB} label={sample.bold} selected onClick={() => {}} />
                <ToolbarButton icon={Plus} label={sample.insert} onClick={() => {}} />
                <ToolbarButton icon={TextT} label={t.text.kind} menu={false} onClick={() => {}} />
              </div>
            </Part>

            <Part name="ArrowLink" use={use.arrowLink}>
              <ArrowLink href="#udseende/farver">{sample.editColors}</ArrowLink>
            </Part>
          </PartGroup>

          <PartGroup group="fields">
            <Part name="InField, Select, ChoiceField" use={use.fields}>
              <TextField id="parts-text" label={sample.address} hint={sample.sendsTo} defaultValue={page} />
              <div>
                <Select
                  label={sample.placement}
                  id="parts-select"
                  title={sample.placement}
                  value={placement}
                  options={[
                    { value: 'top', label: sample.top },
                    { value: 'list', label: sample.inList },
                  ]}
                  onChange={setPlacement}
                />
              </div>
              <div>
                <Select
                  label={sample.placementOnPage}
                  id="parts-select-page"
                  title={sample.placementOnPage}
                  value={placement}
                  options={[
                    { value: 'top', label: sample.top },
                    { value: 'list', label: sample.inList },
                  ]}
                  href="#udseende/dele/editor"
                  onChange={setPlacement}
                />
              </div>
            </Part>

            <Part name="InField: problem, limit" use={use.formField}>
              <TextField
                id="parts-field"
                label={t.parts.fields.email}
                problem={mailWrong ? t.parts.fields.emailForm : undefined}
                limit={30}
                inputMode="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
              />
            </Part>

            <Part name="FieldGroup" use={use.fieldGroup}>
              <FieldGroup label={sample.contact}>
                <TextField id="parts-name" label={sample.name} defaultValue={examples.contact.name} />
              </FieldGroup>
            </Part>

            <Part name="ShownValue" use={use.shownValue}>
              <ShownValue icon={AppWindow}>{sample.standardKind}</ShownValue>
              <ShownValue muted>{sample.fromTitle}</ShownValue>
            </Part>

            <Part name="IconPicker" use={use.iconPicker}>
              <IconPicker
                label={sample.icon}
                value={icon}
                options={iconOptions(t.blocks.icons)}
                icon={(name, size) => <Icon name={name} size={size} />}
                onChange={setIcon}
              />
            </Part>

            <Part name="ImagePick" use={use.imagePick}>
              <ImagePick src={picture || undefined} onPick={() => setPicture(examplePicture)} onRemove={() => setPicture('')} />
            </Part>

            <Part name="FoldList, FoldItem" use={use.foldList}>
              <FoldList>
                {[1, 2].map((n, i) => (
                  <FoldItem
                    key={n}
                    title={sample.question(n)}
                    open={folded === i}
                    onToggle={() => setFolded(folded === i ? null : i)}
                    tools={
                      <>
                        <IconButton icon={ArrowUp} label={t.common.moveUp} disabled={i === 0} />
                        <IconButton icon={ArrowDown} label={t.common.moveDown} disabled={i === 1} />
                        <IconButton icon={Trash} label={t.common.remove} />
                      </>
                    }
                  >
                    <TextArea id={`parts-answer-${n}`} label={sample.answer} rows={2} />
                  </FoldItem>
                ))}
              </FoldList>
            </Part>

            <Part name="MultiChoice, SheetLink" use={use.multiChoice}>
              <MultiChoice
                label={sample.group}
                options={['a', 'b', 'c'].map((v) => ({ value: v, label: sample.option(v.toUpperCase()) }))}
                value={tags}
                add={sample.addTag}
                max={3}
                footer={(close) => (
                  <SheetLink
                    href="#udseende/dele/editor"
                    onClick={(e) => {
                      e.preventDefault();
                      close();
                    }}
                  >
                    {sample.newTag}
                  </SheetLink>
                )}
                onChange={setTags}
              />
            </Part>

            <Part name="ColorField" use={use.color}>
              <div>
                <Label htmlFor="parts-color" hint={sample.colorHint}>
                  {sample.color}
                </Label>
                <ColorField
                  id="parts-color"
                  label={sample.color}
                  value={color}
                  swatches={['#3f6db3', '#f4f4f2', '#ffffff', '#1d1d1f', '#6b6b70', '#e2e2e0']}
                  onChange={setColor}
                />
              </div>
            </Part>

            <Part name="PhoneField" use={use.phone}>
              <div>
                <PhoneField code={phone.code} onCode={(code) => setPhone({ ...phone, code })}>
                  <TextField
                    id="parts-phone"
                    label={sample.phone}
                    inputMode="tel"
                    value={phone.number}
                    onChange={(e) => setPhone({ ...phone, number: e.target.value })}
                  />
                </PhoneField>
              </div>
            </Part>

            <Part name="SearchRow" use={use.searchRow}>
              <SearchRow
                value={query}
                onChange={setQuery}
                label={t.common.search}
                sort={
                  <Choice
                    title={sample.sort}
                    icon={ArrowsDownUp}
                    value={sort}
                    disabled={asMenu}
                    options={[
                      { value: 'nyeste', label: sample.newest },
                      { value: 'aeldste', label: sample.oldest },
                    ]}
                    onChange={setSort}
                  />
                }
                filter={
                  <Filters
                    title={sample.filter}
                    selected={!!filter}
                    groups={[
                      {
                        title: sample.placement,
                        value: filter,
                        options: [
                          { value: '', label: sample.all },
                          { value: 'top', label: sample.top },
                          { value: 'list', label: sample.inList },
                        ],
                        onChange: setFilter,
                      },
                    ]}
                  />
                }
                seo={
                  <IconButton
                    icon={GoogleLogo}
                    label={seo ? t.library.hideSeo : t.library.showSeo}
                    aria-pressed={seo}
                    selected={seo}

                    onClick={() => setSeo(!seo)}
                  />
                }
                view={
                  <IconButton
                    icon={asMenu ? ListBullets : ListIcon}
                    label={asMenu ? t.library.showAsList : t.library.showAsMenu}
                    aria-pressed={asMenu}

                    onClick={() => setAsMenu(!asMenu)}
                  />
                }
              />
            </Part>
          </PartGroup>

          <PartGroup group="choices">
            <Part name="ChoiceTile" use={use.choiceTile}>
              <div role="radiogroup" aria-label={sample.icon} className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2">
                {[Heart, Leaf, Sun].map((Glyph, i) => (
                  <ChoiceTile key={sample.icons[i]} selected={tile === i} label={sample.icons[i]} onClick={() => setTile(i)}>
                    <Glyph size={24} />
                  </ChoiceTile>
                ))}
              </div>
            </Part>
          </PartGroup>

          <PartGroup group="lists">
            <Part
              name="Group, GroupTitle, LeadingIcon, LeadingImage, TrailingText, TrailingIcon, listItemClass, accentListItemClass, deleteListItemClass, staticListItemClass, mutedListItemClass"
              use={use.group}
            >
              <Group title={sample.group}>
                {[
                  { icon: FolderSimple, label: sample.media, count: 42 },
                  { icon: PencilSimple, label: sample.pages, count: 12 },
                ].map((p) => (
                  <li key={p.label}>
                    <a href="#udseende/dele/editor" className={listItemClass}>
                      <LeadingIcon icon={p.icon} />
                      <span className="min-w-0 flex-1 font-medium">{p.label}</span>
                      <TrailingText>{p.count}</TrailingText>
                      <TrailingIcon />
                    </a>
                  </li>
                ))}
                {/* With a text under its name: the icon beside the first two lines. */}
                <li>
                  <a href="#udseende/dele/editor" className={listItemClass}>
                    <LeadingIcon icon={Gear} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{sample.cookieBanner}</span>
                      <span className="block text-sm text-muted">{sample.cookieHint}</span>
                    </span>
                    <TrailingIcon />
                  </a>
                </li>
                {/* With a picture before its name (the picture a page's colours came from). */}
                <li>
                  <span className={staticListItemClass}>
                    <LeadingImage src={examplePicture} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{sample.pages}</span>
                      <span className="block text-sm text-muted">/</span>
                    </span>
                    <ColorSwatches
                      colors={[defaultColors.light.accent, defaultColors.light.tint, defaultColors.light.bg, defaultColors.light.ink]}
                      label={t.colors.light}
                    />
                  </span>
                </li>
              </Group>
              <div className={row}>
                <LeadingIcon icon={FolderSimple} />
                <LeadingIcon icon={PencilSimple} selected />
              </div>
              <section>
                <GroupTitle>{sample.rows}</GroupTitle>
                <ul className={listClass}>
                  <li>
                    <span className={staticListItemClass}>{sample.versionNow}</span>
                  </li>
                  <li>
                    <span className={mutedListItemClass}>{t.library.pageGone}</span>
                  </li>
                  <li>
                    <button type="button" className={accentListItemClass}>
                      <SignOut size={20} />
                      {t.library.logOut}
                    </button>
                  </li>
                  <li>
                    <button type="button" className={deleteListItemClass}>
                      <Trash size={18} />
                      {t.common.delete}
                    </button>
                  </li>
                </ul>
              </section>
            </Part>

            <Part name="UnfoldButton, subListClass, subListItemClass" use={use.unfold}>
              <ul className={listClass}>
                <li className="flex items-center">
                  <a href="#udseende/dele/editor" className={`${listItemClass} min-w-0 flex-1`}>
                    {sample.pages}
                  </a>
                  <UnfoldButton
                    open={unfolded}
                    count={3}
                    label={unfolded ? t.library.hideSubpagesOf(sample.pages) : t.library.showSubpagesOf(sample.pages)}
                    title={unfolded ? t.library.hideSubpages : t.library.showSubpages}
                    className="mr-1.5"
                    onClick={() => setUnfolded(!unfolded)}
                  />
                </li>
                {unfolded && (
                  <li className="pb-2">
                    <ul className={subListClass}>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>
                          <a href="#udseende/dele/editor" className={subListItemClass}>
                            {sample.subpage(n)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </Part>

            <Part name="CheckList" use={use.checkList}>
              <CheckList
                title={t.forms.seoRating.title}
                items={[
                  { ok: true, text: t.forms.seoRating.oneH1 },
                  { ok: false, text: t.forms.seoRating.longTitle(72), fix: t.forms.seoRating.fixTitle },
                  { ok: true, text: t.forms.seoRating.goodDescription(148) },
                ]}
              />
            </Part>

            <Part name="ScoreRing" use={use.scoreRing}>
              <Group>
                {[95, 67, 33].map((score, i) => (
                  <li key={score}>
                    <div className={staticListItemClass}>
                      <ScoreRing score={score} label={t.seo.scoreLabel(score)} />
                      <span className="min-w-0 flex-1">{examples.pages[i]}</span>
                    </div>
                  </li>
                ))}
              </Group>
            </Part>
          </PartGroup>

          <PartGroup group="sheets">
            <Part
              name="sheet, SheetTitle, SheetList, SheetGroupTitle, Option, SheetBody, SheetActions, Choice, ChoiceListItem, PickListItem, Filters, NewChoice"
              use={`${use.sheet} ${use.sheetBody}`}
            >
              <div className={row}>
                <Button kind="outlined" onClick={() => dialog.current?.showModal()}>
                  {sample.openSheet}
                </Button>
                <Button kind="outlined" onClick={() => fieldsDialog.current?.showModal()}>
                  {sample.openFields}
                </Button>
                <NewChoice
                  title={sample.newPopup}
                  options={[
                    { value: 'standard', label: sample.standardKind, hint: sample.standardKindHint, icon: AppWindow },
                    { value: 'app', label: sample.appKind, hint: sample.appKindHint, icon: EnvelopeSimple },
                  ]}
                  onChange={() => {}}
                />
                <Choice
                  title={sample.sort}
                  icon={ArrowsDownUp}
                  value={sort}
                  options={[
                    { value: 'nyeste', label: sample.newest },
                    { value: 'aeldste', label: sample.oldest },
                  ]}
                  onChange={setSort}
                />
                <Filters
                  title={sample.filter}
                  selected={!!filter || !!content}
                  groups={[
                    {
                      title: sample.placement,
                      value: filter,
                      options: [
                        { value: '', label: sample.all },
                        { value: 'top', label: sample.top },
                        { value: 'list', label: sample.inList },
                      ],
                      onChange: setFilter,
                    },
                    {
                      title: sample.group,
                      value: content,
                      options: [
                        { value: '', label: sample.all },
                        { value: 'pages', label: sample.pages },
                        { value: 'media', label: sample.media },
                      ],
                      onChange: setContent,
                    },
                  ]}
                />
              </div>
              <Group>
                <ChoiceListItem
                  title={sample.sort}
                  search={t.common.search}
                  value={sort}
                  options={[
                    { value: 'nyeste', label: sample.newest },
                    { value: 'aeldste', label: sample.oldest },
                  ]}
                  onChange={setSort}
                />
              </Group>
              <BottomSheet ref={dialog} aria-label={sample.aSheet} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
                <SheetTitle title={sample.aSheet} onClose={() => dialog.current?.close()} />
                <SheetList div>
                  <SheetGroupTitle>{sample.group}</SheetGroupTitle>
                  <ul>
                    {['a', 'b', 'c'].map((v) => (
                      <li key={v}>
                        <Option selected={picked === v} onClick={() => setPicked(v)}>
                          {sample.option(v.toUpperCase())}
                        </Option>
                      </li>
                    ))}
                  </ul>
                </SheetList>
                <SheetActions
                  onCancel={() => dialog.current?.close()}
                  onDone={() => dialog.current?.close()}
                  done={t.common.save}
                  start={
                    <Button kind="text" icon={Trash}>
                      {t.common.remove}
                    </Button>
                  }
                />
              </BottomSheet>
            </Part>
            <BottomSheet
              ref={fieldsDialog}
              aria-label={sample.withFields}
              onClick={(e) => e.target === fieldsDialog.current && fieldsDialog.current?.close()}
            >
              <SheetTitle title={sample.withFields} onClose={() => fieldsDialog.current?.close()} />
              <SheetBody>
                <TextField id="parts-sheet-text" label={sample.name} defaultValue={examples.contact.name} />
                <Checkbox label={sample.showOnFront} checked={front} onChange={setFront} />
              </SheetBody>
              <SheetActions
                onCancel={() => fieldsDialog.current?.close()}
                onDone={() => fieldsDialog.current?.close()}
                done={t.common.save}
              />
            </BottomSheet>

            <Part name="PageFrame" use={use.fullScreenSheet}>
              <div className={row}>
                <Button kind="outlined" onClick={() => pageDialog.current?.showModal()}>
                  {sample.openPage}
                </Button>
              </div>
              <BottomSheet
                full
                ref={pageDialog}
                aria-label={sample.aPage}
                onClick={(e) => e.target === pageDialog.current && pageDialog.current?.close()}
              >
                <SheetTitle title={sample.aPage} onClose={() => pageDialog.current?.close()} />
                <PageFrame
                  title={sample.aPage}
                  width={390}
                  html={`<!doctype html><html><body style="font: 18px/1.5 system-ui; padding: 24px"><h1>${sample.aPage}</h1><p>${sample.pageText}</p></body></html>`}
                />
              </BottomSheet>
            </Part>
          </PartGroup>

          <PartGroup group="messages">
            <Part name="Notice" use={use.notice}>
              <Notice
                title={sample.noticeTitle}
                action={
                  <Button kind="outlined" size="small">
                    {sample.noticeAction}
                  </Button>
                }
              >
                {sample.noticeText}
              </Notice>
            </Part>

            <Part name="EmptyNote" use={use.emptyNote}>
              <EmptyNote busy>{t.app.loading}</EmptyNote>
              <ul className={listClass}>
                <EmptyNote item>{t.forms.noneFound}</EmptyNote>
              </ul>
            </Part>

            <Part name="ProblemNote" use={use.problemNote}>
              <ProblemNote>{t.check.fillIn(sample.name)}</ProblemNote>
            </Part>
          </PartGroup>

          <PartGroup group="layout">
            <Part name="FormColumns, FormHeading" use={use.formColumns}>
              <FormColumns
                first={<Label>{sample.status}</Label>}
                main={<TextArea id="parts-columns" label={t.forms.text} rows={4} />}
                side={<FormHeading first>{t.forms.otherFields}</FormHeading>}
              />
            </Part>

            <Part name="FoldSection" use={use.foldSection}>
              <div>
                {[t.forms.sections.content, t.forms.otherFields].map((title, i) => (
                  <FoldSection
                    key={title}
                    title={title}
                    open={sectionOpen === i}
                    onToggle={() => setSectionOpen(sectionOpen === i ? null : i)}
                  >
                    <TextField id={`parts-section-${i}`} label={sample.name} />
                  </FoldSection>
                ))}
              </div>
            </Part>

            <Part name="SharePreview" use={use.sharePreview}>
              <SharePreview image={examplePicture} domain={sample.domain} title={examples.pages[0]} description={examples.text} />
            </Part>

            <Part name="ColorsPreview" use={use.colorsPreview}>
              <div className="grid grid-cols-2 gap-3">
                {(['light', 'dark'] as const).map((m) => (
                  <ColorsPreview key={m} colors={defaultColors[m]} title={t.colors.preview.title(t.colors[m])} />
                ))}
              </div>
            </Part>

            <Part name="ColorSwatches" use={use.colorSwatches}>
              <ColorSwatches
                colors={[defaultColors.light.accent, defaultColors.light.tint, defaultColors.light.bg, defaultColors.light.ink]}
                label={t.colors.light}
              />
            </Part>

            <Part name="ChoiceRow, IconSwatches" use={use.choiceRow}>
              <Group>
                {iconPacks.slice(0, 2).map((x, i) => (
                  <ChoiceRow
                    key={x.id}
                    selected={placement === (i ? 'list' : 'top')}
                    trailing={<IconSwatches icons={x.samples} label={t.library.iconPackSamples(x.name)} />}
                    onClick={() => setPlacement(i ? 'list' : 'top')}
                  >
                    <span className="block truncate">{x.name}</span>
                    <span className="block truncate text-sm text-muted">{t.library.iconPackByline(x.author, x.license)}</span>
                  </ChoiceRow>
                ))}
              </Group>
            </Part>

            <Part name="Preview" use={use.preview}>
              <Preview>
                <details className="block-accordion-row">
                  <summary className="block-accordion-label">{sample.foldOut}</summary>
                  <div className="block-accordion-body">
                    <p>
                      {sample.foldedText} <a href="/">{sample.link}</a>
                    </p>
                  </div>
                </details>
              </Preview>
            </Part>
          </PartGroup>

          <FieldTypes env={env} />
        </PartsShown>
      </div>
    </Screen>
  );
}

// A type of field (Part's name: the type and the settings shown), and the fields that show it.
type FieldType = { name: string; use: string; fields: Field[] };

// One of each type of field, with the settings it can have. The names are all different, as the
// fields are all in one form.
function fieldTypes(): FieldType[] {
  const { fields: f } = t.parts;
  const types: FieldType[] = [
    {
      name: 'string · required, max, placeholder, pattern, address, digitsInPairs, phone, chips, edit',
      use: f.use.string,
      fields: [
        { name: 'heading', label: f.heading, type: 'string', required: true, max: 60, hint: f.headingHint },
        { name: 'tagline', label: f.underName, type: 'string', placeholder: () => examples.contact.name, hint: f.underNameHint },
        { name: 'email', label: f.email, type: 'string', pattern: ['^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', f.emailForm] },
        { name: 'path', label: sample.address, type: 'string', address: 'page' },
        { name: 'cvr', label: f.cvr, type: 'string', digitsInPairs: 8 },
        { name: 'phone', label: sample.phone, type: 'string', phone: '+45', digitsInPairs: 8 },
        { name: 'keyword', label: f.keyword, type: 'string', chips: 'one' },
        { name: 'keywords', label: f.keywords, type: 'string', chips: 'many' },
        { name: 'linkText', label: f.linkText, type: 'string', edit: { to: 'udseende/farver', text: f.editColors } },
      ],
    },
    {
      name: 'text · max',
      use: f.use.text,
      fields: [{ name: 'description', label: sample.description, type: 'text', required: true, max: 160, hint: f.descriptionHint }],
    },
    { name: 'markdown', use: f.use.markdown, fields: [{ name: 'body', label: f.text, type: 'markdown' }] },
    { name: 'number', use: f.use.number, fields: [{ name: 'price', label: f.price, type: 'number', required: true }] },
    {
      name: 'date, datetime',
      use: f.use.date,
      fields: [
        { name: 'date', label: f.date, type: 'date' },
        { name: 'publish', label: f.publish, type: 'datetime' },
      ],
    },
    {
      name: 'boolean · toggle',
      use: f.use.boolean,
      fields: [
        { name: 'frontPage', label: f.frontPage, type: 'boolean' },
        { name: 'popup', label: f.popup, type: 'boolean', toggle: [f.shown, f.hidden] },
      ],
    },
    {
      name: 'select · options, only, segments, icons, locked',
      use: f.use.select,
      fields: [
        {
          name: 'placement',
          label: sample.placement,
          type: 'select',
          required: true,
          options: [
            { value: 'top', label: sample.top },
            { value: 'list', label: sample.inList },
          ],
        },
        { name: 'listText', label: f.listText, type: 'string', hint: f.listTextHint, only: { field: 'placement', is: ['list'] } },
        {
          name: 'status',
          label: sample.status,
          type: 'select',
          required: true,
          options: [
            { value: 'published', label: t.library.statusShown.published, hint: f.publishedHint },
            { value: 'draft', label: t.library.statusShown.draft, hint: f.draftHint },
          ],
        },
        {
          name: 'look',
          label: f.look,
          type: 'select',
          segments: true,
          options: [
            { value: 'light', label: t.library.themes.light, icon: Sun },
            { value: 'auto', label: t.library.themes.auto, icon: CircleHalf },
            { value: 'dark', label: t.library.themes.dark, icon: Moon },
          ],
        },
        { name: 'icon', label: sample.icon, type: 'select', icons: true, options: iconOptions(t.blocks.icons) },
        {
          name: 'kind',
          label: f.kind,
          type: 'select',
          locked: true,
          options: [
            { value: 'standard', label: sample.standardKind, hint: sample.standardKindHint, icon: AppWindow },
            { value: 'app', label: sample.appKind, hint: sample.appKindHint, icon: EnvelopeSimple },
          ],
        },
      ],
    },
    {
      name: 'relation · to, fixed, multiple, add, maxItems',
      use: f.use.relation,
      fields: [
        { name: 'page', label: f.page, type: 'relation', to: 'pages', fixed: true, required: true },
        { name: 'post', label: f.post, type: 'relation', to: 'blog' },
        {
          name: 'tags',
          label: f.tags,
          type: 'relation',
          to: 'categories',
          multiple: true,
          add: sample.addTag,
          maxItems: 3,
          hint: f.tagsHint,
        },
      ],
    },
    { name: 'image', use: f.use.image, fields: [{ name: 'picture', label: f.picture, type: 'image' }] },
    { name: 'readonly', use: f.use.readonly, fields: [{ name: 'address', label: sample.address, type: 'readonly' }] },
    {
      name: 'object · fields',
      use: f.use.object,
      fields: [
        {
          name: 'contact',
          label: f.contact,
          type: 'object',
          fields: [
            { name: 'name', label: f.name, type: 'string', required: true },
            { name: 'phone', label: sample.phone, type: 'string', phone: '+45', digitsInPairs: 8 },
          ],
        },
      ],
    },
    {
      name: 'list · fields, summary, singular, field, maxItems',
      use: f.use.list,
      fields: [
        {
          name: 'questions',
          label: f.questions,
          type: 'list',
          singular: f.aQuestion,
          summary: 'question',
          fields: [
            { name: 'question', label: f.question, type: 'string', required: true },
            { name: 'answer', label: f.answer, type: 'text', required: true },
          ],
        },
        {
          name: 'pages',
          label: f.pages,
          type: 'list',
          singular: f.aPage,
          maxItems: 3,
          field: { name: 'page', label: f.page, type: 'relation', to: 'pages', required: true },
        },
      ],
    },
  ];
  // Sections as on a fixed page, here with the standard blocks.
  types.push({
    name: 'blocks · blocks',
    use: f.use.blocks,
    fields: [{ name: 'sections', label: f.text, singular: f.aSection, type: 'blocks', blocks: siteBlocks.filter((b) => b.standard) }],
  });
  return types;
}

// The form fields, drawn as in every form, filled in to begin with. "Prøv at gemme" checks them as a
// form does (problemAt), and says what is wrong and marks the field (useWrongField).
function FieldTypes({ env }: { env: Env }) {
  const f = t.parts.fields;
  const types = useMemo(fieldTypes, []);
  const data = useMemo(exampleData, []);
  // What the field types are, over them, while they are all shown in their groups.
  const grouped = useGrouped();
  const intro = !useSearched() && grouped;
  const all = types.flatMap((type) => type.fields);
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const page = data.relations.pages[0].value;
    // The first two standard blocks, filled in as an example.
    const sections = siteBlocks
      .filter((b) => b.standard)
      .slice(0, 2)
      .map((b) => ({ type: b.type, ...exampleOf(b, data) }));
    return {
      ...newValue(all),
      heading: f.values.heading,
      email: f.values.email,
      path: page,
      cvr: '12 34 56 78',
      phone: examples.contact.phone,
      description: sample.descriptionText,
      body: f.values.text,
      price: 950,
      date: '2026-11-02',
      publish: '2026-11-02T09:00',
      frontPage: true,
      popup: true,
      placement: 'top',
      status: 'published',
      look: 'auto',
      icon: 'heart',
      kind: 'standard',
      page,
      tags: data.relations.categories.slice(0, 2).map((o) => o.value),
      address: page,
      contact: { name: examples.contact.name, phone: examples.contact.phone },
      questions: [{ question: f.values.question, answer: f.values.answer }],
      pages: [page],
      sections,
    };
  });
  const wrongField = useWrongField((text) => env.notify({ text, error: true }));
  // The made-up site, and a picture picked here is the plain one: nothing of the site's own.
  const context: FieldContext = {
    relations: data.relations,
    lists: data.lists,
    testimonials: data.testimonials,
    site: data.site,
    pickImage: async () => examplePicture,
  };
  return (
    <Fields.Provider value={context}>
      <WrongField.Provider value={wrongField.field}>
        <PartGroup group="fieldTypes">
          {intro && <p className="text-muted">{f.intro('packages/editor/src/fields.tsx')}</p>}
          {types.map((type) => (
            <Part key={type.name} name={type.name} use={type.use}>
              <div className="space-y-5">
                <FieldList fields={type.fields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />
              </div>
            </Part>
          ))}
          <Part name="useWrongField, WrongField, problemAt" use={f.use.check}>
            <div>
              <Button
                onClick={() => {
                  if (!wrongField.stop(problemAt(all, values))) env.notify({ text: f.allRight });
                }}
              >
                {f.tryToSave}
              </Button>
            </div>
          </Part>
        </PartGroup>
      </WrongField.Provider>
    </Fields.Provider>
  );
}
