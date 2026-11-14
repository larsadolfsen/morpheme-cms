// The form fields of the editor, drawn from the field lists in collections.ts. Lists and groups
// (object) hold other fields, so the deep front page is the same code as a price. A list of blocks
// (a fixed page's sections) is a list whose items each have a `type` that gives their fields; it is
// edited as a text with the sections as cards in it (SectionsField.tsx).
import { createContext, Fragment, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CaretDown, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import {
  ArrowLink,
  Button,
  Checkbox,
  ChipField,
  FieldGroup,
  FoldItem,
  FoldList,
  DatePicker,
  DateTimeField,
  FormField,
  type InField,
  IconButton,
  ChoiceCards,
  IconPicker,
  ImagePick,
  Label,
  Group,
  listClass,
  MultiChoice,
  SupportingText,
  PhoneField,
  SegmentedButton,
  Select,
  SheetActions,
  SheetBody,
  SheetLink,
  BottomSheet,
  SheetTitle,
  ShownValue,
  subListClass,
  SwitchRow,
  TextArea,
  TextField,
  ProblemNote,
  type Pickable,
  ListItem,
} from './ui';
import type { Edit, Field, Relation, Template } from './schema';
import type { SiteData } from '@site/editor';
import { ask, closeChanged } from './ask';
import MarkdownEditor, { type MarkdownHandle } from './MarkdownEditor';
import { IMAGE, useBlockDialog } from './BlockDialog';
import PagePicker, { PageListItem } from './PagePicker';
import SectionsField from './SectionsField';
import { leaveTo } from './FormFrame';
import { shownAt } from './images';
import { oneLine } from '../lib/one-line.mjs';
import { drawnAddress, isSafeImage } from '../lib/section-marker.mjs';
import { addressOf } from './addresses';
import { LinkList } from './LinkList';
import { ToolSelect } from './ToolSelect';
import { MoveButtons } from './MoveButtons';
import { movedList } from './moveItem.mjs';
import { iconColorOf, iconColorOptions } from './iconColor';
import { clean, inPairs, inUse, newItem, phoneParts, phoneText, problemAt, problemOf, type Around, type Problem } from './check';
import { Icon, useAllIconNames } from './icon';
import { t } from './i18n';
import { snackbar } from '../lib/snackbar';

/** A choice of a relation. `on`: where it is shown on the site (a promotion), for a field with `onPage`; `text`: what a
 * button that opens it says when it has no text of its own, or `as`: the target of the buttons (`buttonTargets`) whose
 * text it has (Opens.as). */
/** A page or post may have its status, whether the menu links to it and its date, for the order and filters of the sheet
 * it is picked in (usePickTools). */
export type Option = Pickable & { on?: { everywhere: boolean; pages: string[] }; text?: string; as?: string };
export type { PageState } from './ui';

/** The choices shown on a page (its address), or on every page when no page is edited (Field.onPage). */
export const onThePage = (options: Option[], page?: string) =>
  options.filter((o) => !o.on || o.on.everywhere || (!!page && o.on.pages.includes(page)));

// More choices than this, and the sheet with them has a search over them.
const manyChoices = 10;

// The rows of the site's lists (the standard blocks' and the apps', "Lister"), each as its file has it, by the list's
// id, in their order: what a block shows from a list (an app's block from the app's own list).
export type ListRows = Record<string, Record<string, unknown>[]>;

// A testimonial as its file in src/data/testimonials/ has it (the quote's paragraphs separated by a
// blank line), for the cards of the testimonial blocks.
export type TestimonialRow = {
  slug: string;
  name: string;
  /** Its image (optional), by the name. */
  image?: string;
  context?: string;
  quote: string;
  categories?: string[];
  frontPage: boolean;
};

// What fields need from the editor: the choices for relations, the lists' rows and the testimonials, and
// images (the gallery, Media.tsx).
export type FieldContext = {
  relations: Record<Relation, Option[]>;
  lists: ListRows;
  testimonials: TestimonialRow[];
  /** The rest of the site, for the previews of the blocks (sitedata.ts). */
  site: SiteData;
  /** The address of the page being edited (a relation with `onPage` offers what is shown there). */
  page?: string;
  /** Asks for an image from the gallery or a new one (useMediaPicker); its address on the site. Also
   * for a text (MarkdownEditor); without it, no image button. */
  pickImage?: () => Promise<string | null>;
  /** The address of a field's page of its own (Field.page), by its name, in a form that has them (CompanyForm.tsx). */
  pageOf?: (field: string) => string;
  /** The file of a standard page by its key (Edit.page), if it is there (standardFile.mjs). */
  standardFile?: (key: string) => string | undefined;
};

export const Fields = createContext<FieldContext | null>(null);

type Props = { field: Field; value: unknown; onChange: (value: unknown) => void };

// Where a field is in what is edited: the names and item numbers to it joined with dots
// ("items.0.title"), as problemAt in check.ts names the field a problem is about.
const PathHere = createContext('');
const joined = (base: string, name: string | number) => (base ? `${base}.${name}` : String(name));

/** The field that keeps a form from being saved (problemAt in check.ts), when it was found (a new
 * number each time, so it is shown again on the next try), and how to stop showing it: the item of a
 * list it is in is opened, it is scrolled to and its border flashes (.editor-wrong in editor.css),
 * until it is changed. Every form has it (useWrongField). */
export type Wrong = { path: string; at: number; clear: () => void };
export const WrongField = createContext<Wrong | null>(null);

/** A form that cannot be saved as it is: the reason as a message at the front (`say`, the form's
 * notify; also over a sheet) and the field marked (WrongField, which the form's fields are put
 * inside). `stop(problem)` does both and is true when there is a problem, so a save can end there:
 * `if (stop(problemAt(fields, values))) return;`. The same in every form. `open`: opens what the field is in (a folded
 * section, FoldSection in ui.tsx), in the same go, so the field is shown when it is scrolled to. */
export function useWrongField(say: (text: string) => void, open?: (path: string) => void) {
  const [wrong, setWrong] = useState<{ path: string; at: number } | null>(null);
  const field = useMemo<Wrong | null>(() => wrong && { ...wrong, clear: () => setWrong(null) }, [wrong]);
  const stop = (problem: Problem | null) => {
    if (problem) open?.(problem.path);
    setWrong(problem && { path: problem.path, at: Date.now() });
    if (problem) say(problem.text);
    return !!problem;
  };
  return { field, stop };
}

// A field marked when it keeps the form from being saved (WrongField): its path, the element to mark (`box`), and its
// change, which ends the marking.
function useMarked<T extends HTMLElement>(props: Props) {
  const path = joined(useContext(PathHere), props.field.name);
  const wrong = useContext(WrongField);
  const here = wrong?.path === path;
  const box = useRef<T>(null);
  // The class is set here, not by React, so the flashing starts again on each try.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.classList.remove('editor-wrong');
    if (!here) return;
    void el.offsetWidth;
    el.classList.add('editor-wrong');
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [here, wrong?.at]);
  // A change in the marked field ends the marking.
  const onChange = (v: unknown) => {
    if (here) wrong.clear();
    props.onChange(v);
  };
  return { path, box, onChange };
}

export function FieldInput(props: Props) {
  const { path, box, onChange } = useMarked<HTMLDivElement>(props);
  return (
    <PathHere.Provider value={path}>
      <div ref={box}>
        <FieldControl {...props} onChange={onChange} />
      </div>
    </PathHere.Provider>
  );
}

/** A post's title drawn in the text as the site draws it (.theme-title: the display role, as PostHeader.astro), written in place
 * and not in a field with its name on its edge. It grows with what is typed; Enter does not make a line. Marked as the other
 * fields are when it keeps the form from being saved (WrongField). */
export function HeadTitle(props: Props) {
  const { box, onChange } = useMarked<HTMLDivElement>(props);
  const area = useRef<HTMLTextAreaElement>(null);
  const text = props.value == null ? '' : String(props.value);
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
  return (
    <div ref={box}>
      <textarea
        ref={area}
        rows={1}
        value={text}
        aria-label={props.field.label}
        placeholder={props.field.label}
        className="theme-title block w-full resize-none overflow-hidden bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant/60"
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        onChange={(e) => onChange(oneLine(e.target.value))}
      />
    </div>
  );
}

/** A post's top image drawn in the text as the site draws it (PostLayout.astro: wide, rounded by the theme's image radius,
 * 16:9 from the medium width): a tap on it changes it, and Remove (an image that is not required) takes it away. Without a
 * image, one box to tap. */
export function HeadImage(props: Props) {
  const { box, onChange } = useMarked<HTMLDivElement>(props);
  const context = useContext(Fields)!;
  const { field } = props;
  const text = props.value == null ? '' : String(props.value);
  // Only an address the section marker's validator accepts is drawn, rebuilt from the allowed characters (lib/section-marker.mjs).
  const drawn = text && isSafeImage(text) ? drawnAddress(shownAt(text), location.origin) : null;
  const pick = async () => {
    const src = await context.pickImage?.();
    if (src) onChange(src);
  };
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={pick}
        aria-label={text ? t.forms.changeImage : t.forms.pickImage}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-(--theme-picture-radius) bg-surface-container medium:aspect-[16/9]"
      >
        {drawn ? (
          <img src={drawn} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center rounded-(--theme-picture-radius) text-on-surface-variant outline-2 -outline-offset-2 outline-outline-variant outline-dashed">
            {t.forms.pickImage}
          </span>
        )}
      </button>
      {text && (
        <div className="absolute end-2 top-2 flex gap-2">
          <Button kind="tonal" size="small" onClick={pick}>
            {t.forms.changeImage}
          </Button>
          {!field.required && (
            <Button kind="tonal" size="small" onClick={() => onChange('')}>
              {t.common.remove}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// The pages a field that picks a page (`relation` to pages) offers, in groups: with `fixed`, the fixed pages first,
// without the ones that are also a page (Om mig).
function pageGroups(field: Field, context: FieldContext, options = context.relations[field.to!]) {
  const fixed = field.fixed ? context.relations.fixed.filter((f) => !options.some((o) => o.value === f.value)) : [];
  return fixed.length
    ? [
        { title: t.forms.fixedPages, options: fixed },
        { title: t.forms.pages, options },
      ]
    : [{ title: t.forms.pages, options }];
}

/** Fields that pick a page (`relation` to pages) as the rows of a list (Group), each with its name and the page picked,
 * that open the sheet with the pages, titled with its name and its hint under it (PageListItem): "Default pages"
 * (Part.rows). Marked as the other fields are (WrongField). */
export function FieldRows({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  return (
    <Group>
      {fields.map((f) => (
        <FieldRow key={f.name} field={f} value={value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} />
      ))}
    </Group>
  );
}

function FieldRow(props: Props) {
  const { box, onChange } = useMarked<HTMLButtonElement>(props);
  const { field, value } = props;
  return (
    <PageListItem
      ref={box}
      title={field.label}
      hint={field.hint}
      value={value == null ? '' : String(value)}
      groups={pageGroups(field, useContext(Fields)!)}
      required={field.required}
      onChange={onChange}
    />
  );
}

function FieldControl({ field, value, onChange }: Props) {
  const context = useContext(Fields)!;
  // A field of the form itself, not one in a group or a list (a field's page, Field.page).
  const own = useContext(PathHere) === field.name;
  const id = useId();
  const text = value == null ? '' : String(value);
  // What is wrong with the text, shown under it once it has been typed.
  const [wrong, setWrong] = useState<string | null>(null);
  // A phone number's country code (Field.phone), the last it had: kept when the number is emptied,
  // and when it is picked before the number is typed.
  const [pickedCode, setPickedCode] = useState(() => (field.phone && text.trim() ? phoneParts(field, text)[0] : undefined));
  // What a field to write or choose in says in itself, as the theme's text field does (its name on its edge, what it
  // does or what is wrong under it, how much it should have at most); the other fields have their name over them.
  const inField: InField = { label: field.label, hint: hintOf(field, text), problem: wrong ? `${wrong}.` : undefined, limit: field.max };
  let inside = false;
  let control;

  switch (field.type) {
    case 'boolean':
      if (field.toggle) {
        const on = value === true;
        return <SwitchRow label={field.label} hint={hintOf(field)} selected={on} onChange={onChange} />;
      }
      return <Checkbox label={field.label} hint={hintOf(field)} checked={value === true} onChange={onChange} />;
    case 'object':
      return (
        <FieldGroup label={field.label} hint={hintOf(field)}>
          <FieldList fields={field.fields!} value={(value ?? {}) as Record<string, unknown>} onChange={onChange} />
        </FieldGroup>
      );
    case 'list':
      if (field.links) return <Links field={field} value={value} onChange={onChange} />;
      return <ListInput field={field} value={(value ?? []) as unknown[]} onChange={onChange} />;
    case 'blocks':
      return <SectionsField field={field} value={(value ?? []) as Item[]} onChange={onChange} />;
    case 'markdown':
      control = field.template ? (
        <MarkdownWithBlocks value={text} template={field.template} onChange={onChange} />
      ) : (
        <MarkdownField value={text} onChange={onChange} />
      );
      break;
    case 'readonly':
      control = <ShownValue muted>{text || t.forms.fromTitle}</ShownValue>;
      break;
    case 'text':
      inside = true;
      control = (
        <TextArea
          id={id}
          {...inField}
          rows={4}
          value={text}
          placeholder={field.placeholder?.(context.site)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'date':
      inside = true;
      control = <DatePicker id={id} {...inField} value={text} onChange={onChange} />;
      break;
    // A date and a time, "2026-03-01T12:00" (Danish time, as the phone or computer shows it).
    case 'datetime':
      inside = true;
      control = <DateTimeField id={id} {...inField} value={text} onChange={onChange} />;
      break;
    case 'number':
      inside = true;
      control = (
        <TextField
          id={id}
          {...inField}
          type="number"
          inputMode="numeric"
          min={0}
          value={text}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
      break;
    case 'select': {
      // Filled from a tool of the app's MCP server (Field.optionsFrom).
      if (field.optionsFrom)
        return (
          <ToolSelect field={{ ...field, optionsFrom: field.optionsFrom }} id={id} inField={inField} value={text} onChange={onChange} />
        );
      // An option that needs a choice on the page (Field.options' onPage) only while there is one, or it is chosen.
      const colored = field.iconColor ? iconColorOptions(field, context.site.lowIconColors, text) : undefined;
      const offered = (colored?.options ?? field.options!).filter(
        (o) =>
          (!o.stored || o.value === text) &&
          (!o.onPage || o.value === text || onThePage(context.relations[o.onPage] ?? [], context.page).length > 0),
      );
      if (field.locked) {
        // The kind of an entry: what it is, not changed here (its hint under the label says more).
        const chosen = field.options!.find((o) => o.value === text) ?? (text ? undefined : field.options![0]);
        control = (
          <ShownValue id={id} icon={chosen?.icon}>
            {chosen?.label ?? text}
          </ShownValue>
        );
        break;
      }
      if (field.segments) {
        // Without a value (saved before the field was there), its default, as the fields that depend on it have it (inUse).
        const shown = text || String(field.default ?? '');
        control = <SegmentedButton label={field.label} value={shown} options={offered} dots={field.dots} onChange={onChange} />;
        // A saved icon color that is now below 3:1 on the page keeps its color; the field says so (not a block).
        if (colored?.low)
          control = (
            <>
              {control}
              <ProblemNote>{t.blocks.iconColor.low(colored.low)}</ProblemNote>
            </>
          );
        break;
      }
      if (field.cards) {
        // As segments: without a value, its default.
        const shown = text || String(field.default ?? '');
        return <ChoiceCards label={field.label} hint={hintOf(field)} value={shown} options={offered} onChange={onChange} />;
      }
      if (field.icons) {
        // The chosen icon, and all of them to tap (IconPicker).
        control = <IconField id={id} field={field} text={text} onChange={onChange} />;
        break;
      }
      {
        // Not chosen ("None"), unless a choice is itself the empty value (the price card's "Book an appointment").
        const none = !field.required && !offered.some((o) => o.value === '');
        const options = none ? [{ value: '', label: t.forms.noChoice }, ...offered] : offered;
        inside = true;
        control = (
          <Select
            id={id}
            {...inField}
            title={field.label}
            value={text}
            options={options}
            empty={t.forms.choose}
            search={options.length > manyChoices ? t.common.searchIn(field.label) : undefined}
            href={field.page && own && context.pageOf ? context.pageOf(field.name) : undefined}
            onChange={onChange}
          />
        );
        // Narrow, at the start of its line (the status over a page's title).
        if (field.narrow) control = <div className="w-full max-w-64">{control}</div>;
      }
      break;
    }
    case 'relation': {
      const options = field.onPage ? onThePage(context.relations[field.to!] ?? [], context.page) : context.relations[field.to!];
      if (field.multiple) {
        // With `fixed`, the fixed pages first (without the ones that are also a page), as below.
        const all =
          field.to === 'pages' && field.fixed
            ? [...context.relations.fixed.filter((f) => !options.some((o) => o.value === f.value)), ...options]
            : options;
        control = <MultiRelation field={field} options={all} value={(value ?? []) as string[]} onChange={onChange} />;
        break;
      }
      if (field.to === 'pages' || field.to === 'standardPages') {
        inside = true;
        control = (
          <PagePicker
            id={id}
            inField={inField}
            value={text}
            groups={pageGroups(field, context, options)}
            required={field.required}
            onChange={onChange}
          />
        );
        break;
      }
      // A value that is not among the choices (a removed page) is still shown, so it is not lost silently.
      const missing = text && !options.some((o) => o.value === text);
      const choices = [
        ...(field.required ? [] : [{ value: '', label: t.forms.noChoice }]),
        ...(missing ? [{ value: text, label: t.forms.missing(text) }] : []),
        ...options,
      ];
      inside = true;
      control = (
        <Select
          id={id}
          {...inField}
          title={field.label}
          value={text}
          options={choices}
          empty={t.forms.choose}
          search={choices.length > manyChoices ? t.common.searchIn(field.label) : undefined}
          onChange={onChange}
        />
      );
      break;
    }
    case 'image':
      control = (
        <ImagePick
          id={id}
          src={text ? shownAt(text) : undefined}
          onPick={async () => {
            const src = await context.pickImage?.();
            if (src) onChange(src);
          }}
          onRemove={field.required ? undefined : () => onChange('')}
        />
      );
      break;
    default: {
      if (field.chips) {
        control = (
          <ChipField
            id={id}
            value={text
              .split(',')
              .map((w) => w.trim())
              .filter(Boolean)}
            one={field.chips === 'one'}
            onChange={(words) => onChange(words.join(', '))}
          />
        );
        break;
      }
      // A phone number: its country code in the button before it (PhoneField), the number in the field.
      // Typed with a code before it (+46), the code goes to the button once it is one.
      const [code, number] = field.phone ? phoneParts(field, text) : ['', text];
      const shownCode = text.trim() ? code : (pickedCode ?? code);
      const full = (typed: string) => (field.phone ? phoneText(field, shownCode, typed) : typed);
      inside = true;
      control = (
        <TextField
          id={id}
          {...inField}
          value={number}
          placeholder={field.placeholder?.(context.site)}
          inputMode={field.digitsInPairs ? 'tel' : field.type === 'string' && field.name === 'email' ? 'email' : undefined}
          onChange={(e) => {
            const typed = full(e.target.value);
            onChange(typed);
            if (field.phone && typed.trim()) setPickedCode(phoneParts(field, typed)[0]);
            // Once shown, the problem goes as soon as it is put right.
            if (wrong) setWrong(problemOf(field, typed.trim()));
          }}
          // A text with a form is checked once it is typed (without spaces around it), and a number
          // in pairs is written so.
          onBlur={
            field.pattern || field.digitsInPairs || field.address
              ? () => {
                  const typed = field.digitsInPairs
                    ? inPairs(field, text)
                    : field.address
                      ? addressOf(text, field.address) || text.trim()
                      : text.trim();
                  if (typed !== text) onChange(typed);
                  setWrong(problemOf(field, typed));
                }
              : undefined
          }
        />
      );
      if (field.phone)
        control = (
          <PhoneField
            code={shownCode}
            onCode={(c) => {
              setPickedCode(c);
              if (number.trim()) {
                const typed = inPairs(field, phoneText(field, c, number));
                onChange(typed);
                setWrong(problemOf(field, typed));
              }
            }}
          >
            {control}
          </PhoneField>
        );
    }
  }

  if (inside) return control;
  return (
    <FormField
      label={field.label}
      htmlFor={id}
      hint={hintOf(field, text)}
      problem={wrong ? { id: `${id}-problem`, text: wrong } : undefined}
      count={field.max ? { length: text.length, max: field.max } : undefined}
    >
      {control}
    </FormField>
  );
}

// The object the fields being shown are in (an item of a list: the object with the list), for a field
// that depends on one there (inUse).
const AroundHere = createContext<Around | undefined>(undefined);

/** An object field's own fields without its group, whose heading is elsewhere (a section of Globals › Header: "Action
 * button"), at the object's path, so a wrong one is marked as it is in the group (WrongField). */
export function ObjectFields({ field, value, onChange }: Props) {
  return (
    <PathHere.Provider value={joined(useContext(PathHere), field.name)}>
      <FieldList fields={field.fields!} value={(value ?? {}) as Record<string, unknown>} onChange={onChange} />
    </PathHere.Provider>
  );
}

// The fields of an object, in order.
export function FieldList({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (v: unknown) => void;
}) {
  const around = useContext(AroundHere);
  return (
    <AroundHere.Provider value={{ fields, value, around }}>
      {fields
        .filter((f) => inUse(f, fields, value, around))
        .map((f) => (
          <Fragment key={f.name}>
            {/* A heading over it and those after it (Field.heading), in the form only. */}
            {f.heading && (
              <div className="pt-2">
                <Label hint={f.heading.hint}>{f.heading.label}</Label>
              </div>
            )}
            <FieldInput field={f} value={value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} />
          </Fragment>
        ))}
    </AroundHere.Provider>
  );
}

// Text with formatting, in the same editor as the pages (MarkdownEditor), saved as Markdown.
function MarkdownField({ value, onChange }: { value: string; onChange: (v: unknown) => void }) {
  const editor = useRef<MarkdownHandle>(null);
  return (
    <MarkdownEditor
      ref={editor}
      short
      value={value}
      onChange={() => {
        const markdown = editor.current?.markdown();
        if (markdown != null) onChange(markdown.trimEnd());
      }}
    />
  );
}

// The same with the blocks its template allows (Field.template: a "Banner"'s image and "Buttons"), put in with "+"
// as in a page's text, in the sheet of the blocks (BlockDialog.tsx) over the sheet or form the field is in. An image
// only when the template has 'image', without a format or crop of its own.
function MarkdownWithBlocks({ value, template, onChange }: { value: string; template: Template; onChange: (v: unknown) => void }) {
  const editor = useRef<MarkdownHandle>(null);
  const context = useContext(Fields)!;
  const [blocks, dialog] = useBlockDialog(
    undefined,
    { lists: context.lists, testimonials: context.testimonials, relations: context.relations, site: context.site, path: context.page },
    template,
    { crop: false },
  );
  const images = !template.blocks || template.blocks.includes(IMAGE);
  return (
    <>
      <MarkdownEditor
        ref={editor}
        short
        value={value}
        blocks={blocks}
        addImage={images ? context.pickImage : undefined}
        onChange={() => {
          const markdown = editor.current?.markdown();
          if (markdown != null) onChange(markdown.trimEnd());
        }}
      />
      {dialog}
    </>
  );
}

// Several picked from a list (a post's categories, the posts on the front page): the picked ones as
// pills like the filters in Files, a tap on one takes it away, and a last pill ("Add tag",
// Field.add) opens a sheet from the bottom with all the choices, where a tap picks one or takes it
// away again (the sheet stays open, so more can be picked). With many choices it has a search; at
// the bottom, the link to make a new one (Field.edit, "Create a tag"). A picked value that is
// not among the choices (a removed category) is still shown, so it is not lost.
function MultiRelation({
  field,
  options,
  value,
  onChange,
}: {
  field: Field;
  options: Option[];
  value: string[];
  onChange: (v: unknown) => void;
}) {
  const context = useContext(Fields);
  return (
    <MultiChoice
      label={field.label}
      options={options}
      value={value}
      add={field.add}
      max={field.maxItems}
      keep={field.to}
      footer={
        field.edit &&
        ((close) => (
          <SheetLink
            href={`#${editTarget(field.edit!, context)}`}
            onClick={(e) => {
              e.preventDefault();
              close();
              leaveTo(`#${editTarget(field.edit!, context)}`);
            }}
          >
            {field.edit!.text}
          </SheetLink>
        ))
      }
      onChange={onChange}
    />
  );
}

// What is written under a field's name: its hint, or the one of the option chosen (`value`), and the
// link to where it is edited instead (Field.edit). Several picked from a list have the link in their
// sheet instead (MultiRelation).
function hintOf(field: Field, value?: string): ReactNode {
  const edit = field.type === 'relation' && field.multiple ? undefined : field.edit;
  const hint = field.hint ?? field.options?.find((o) => o.value === value)?.hint;
  if (!hint && !edit) return undefined;
  return (
    <>
      {hint}
      {hint && edit && ' '}
      {edit && <EditLink edit={edit} />}
    </>
  );
}

/** Where an Edit link goes: the file of its standard page (Edit.page) when it is there, else `to`. */
export const editTarget = (edit: Edit, context: FieldContext | null) => (edit.page && context?.standardFile?.(edit.page)) || edit.to;

// A link to another screen of the editor, which asks first while something is unsaved.
export function EditLink({ edit }: { edit: Edit }) {
  const to = editTarget(edit, useContext(Fields));
  return (
    <ArrowLink
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault();
        leaveTo(`#${to}`);
      }}
    >
      {edit.text}
    </ArrowLink>
  );
}

type Item = Record<string, unknown>;

// An item's title in a list (Field.summary): its field's value, of several the first filled in.
const summaryOf = (field: Field, item: unknown) =>
  [field.summary ?? []]
    .flat()
    .map((name) => String((item as Item)?.[name] ?? '').trim())
    .find(Boolean) ?? '';

// A list of links (Field.links: LinkList.tsx), with the link whose address keeps the form from being saved (WrongField).
function Links({ field, value, onChange }: Props) {
  const path = useContext(PathHere);
  const wrong = useContext(WrongField);
  const index = wrong?.path.startsWith(`${path}.`) ? Number(wrong.path.slice(path.length + 1).split('.')[0]) : NaN;
  return (
    <LinkList
      field={field}
      value={(value ?? []) as Record<string, unknown>[]}
      onChange={(v) => {
        if (Number.isInteger(index)) wrong?.clear();
        onChange(v);
      }}
      hint={hintOf(field)}
      wrong={Number.isInteger(index) ? { index, at: wrong!.at } : null}
    />
  );
}

// A list of items, each opened to its fields. `add={false}` leaves out "Add …" below it, for a
// list that is added to with "+" in the top bar: an item added at the end, here or there, is opened
// and scrolled to. (The menu has its own, MenuList.)
export function ListInput({
  field,
  value,
  onChange,
  add: canAdd = true,
}: {
  field: Field;
  value: unknown[];
  onChange: (v: unknown) => void;
  add?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const length = useRef(value.length);
  // The item with the field that keeps it from being saved is opened (WrongField).
  const path = useContext(PathHere);
  const wrong = useContext(WrongField);
  useEffect(() => {
    if (!wrong?.path.startsWith(`${path}.`)) return;
    const i = Number(wrong.path.slice(path.length + 1).split('.')[0]);
    if (Number.isInteger(i)) setOpen(i);
  }, [wrong?.at]);
  useEffect(() => {
    if (value.length === length.current + 1) {
      setOpen(value.length - 1);
      requestAnimationFrame(() => list.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
    length.current = value.length;
  }, [value.length]);
  const move = (i: number, to: number) => {
    onChange(movedList(value, i, to));
    if (open === i) setOpen(to);
  };
  const remove = async (i: number) => {
    if (!(await ask(t.forms.removeQuestion(field.singular ?? t.forms.theItem), t.common.remove))) return;
    onChange(value.filter((_, j) => j !== i));
    setOpen(null);
  };
  const add = () => onChange([...value, newItem(field)]);
  // A list of pages, posts …: each by its name.
  const context = useContext(Fields);
  const named = field.field?.type === 'relation' ? context?.relations[field.field.to!] : undefined;
  const title = (item: unknown, i: number) =>
    field.field
      ? (named?.find((o) => o.value === item)?.label ?? String(item ?? '')).slice(0, 80)
      : summaryOf(field, item) || t.forms.numbered(field.singular ?? t.forms.itemTitle, i + 1);
  return (
    <div>
      <Label hint={hintOf(field)}>{field.label}</Label>
      <FoldList ref={list}>
        {value.map((item, i) => (
          <FoldItem
            key={i}
            title={title(item, i) || t.forms.empty}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
            tools={
              <>
                <MoveButtons index={i} length={value.length} onMove={(to) => move(i, to)} />
                <IconButton icon={Trash} label={t.common.remove} onClick={() => remove(i)} />
              </>
            }
          >
            <PathHere.Provider value={joined(path, i)}>
              {field.field ? (
                <FieldInput field={field.field} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
              ) : (
                <FieldList
                  fields={field.fields!}
                  value={(item ?? {}) as Item}
                  onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
                />
              )}
            </PathHere.Provider>
          </FoldItem>
        ))}
      </FoldList>
      {/* No more than `maxItems` (the action bar's two buttons). */}
      {canAdd && !(field.maxItems !== undefined && value.length >= field.maxItems) && (
        <Button kind="outlined" size="small" icon={Plus} className="mt-2" onClick={add}>
          {t.forms.addOne(field.singular ?? t.forms.item)}
        </Button>
      )}
    </div>
  );
}

const capitalFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// The menu (DataForm.tsx): the items as rows in a list like the editor's other lists (listClass,
// ListItem), and the items under one (its list field, the submenu) indented along a line, shown with
// the arrow at the right. An item's text and page are changed in a sheet from the bottom,
// opened with a tap on it or the pencil, and saved with "Save"; the sheet also removes it. A new item
// (+ in the top bar, "Add item" under a submenu, and under the menu with `add`) opens its sheet at once; "Cancel"
// there takes it away again. The arrows move an item up and down.
export function MenuList({
  field,
  value,
  onChange,
  depth = 0,
  add = false,
}: {
  field: Field;
  value: unknown[];
  onChange: (v: unknown) => void;
  depth?: number;
  /** "Add …" under the list too, where the top bar has no "+" for it (two menus on one screen: Globals › Header). */
  add?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  // The item whose sheet is open, its fields as they are being changed (and as they were, written as
  // they are saved, to tell whether they have been changed), and whether it was just added.
  const [editing, setEditing] = useState<{ i: number; value: Item; was: string; fresh: boolean } | null>(null);
  const [problem, setProblem] = useState('');
  // Why the sheet cannot be saved: a message in front of it and the field marked, as in every form.
  const wrongField = useWrongField((text) => {
    snackbar({ text, error: true });
    setProblem(text);
  });
  const sheetRef = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const length = useRef(value.length);
  const sub = (field.fields ?? []).find((f) => f.type === 'list');
  const own = (field.fields ?? []).filter((f) => f.type !== 'list');
  const nameOf = (item: unknown) => summaryOf(field, item);
  const singular = field.singular ?? t.forms.item;

  const edit = (i: number, fresh = false) => {
    setProblem('');
    wrongField.stop(null);
    const item = { ...((value[i] ?? {}) as Item) };
    setEditing({ i, value: item, was: JSON.stringify(clean(own, item)), fresh });
    requestAnimationFrame(() => sheetRef.current?.showModal());
  };
  const close = () => {
    setEditing(null);
    sheetRef.current?.close();
  };
  const save = () => {
    if (!editing) return;
    if (wrongField.stop(problemAt(own, editing.value))) return;
    onChange(value.map((x, j) => (j === editing.i ? { ...(x as Item), ...editing.value } : x)));
    close();
  };
  const cancel = () => {
    if (editing?.fresh) onChange(value.filter((_, j) => j !== editing.i));
    close();
  };
  // Closed (Cancel, the cross, a swipe down, Esc, a tap beside it) with the fields changed: the owner is
  // asked whether to keep them ("Add", "Save"), leave them or stay.
  const leave = async () => {
    if (!editing || JSON.stringify(clean(own, editing.value)) === editing.was) return cancel();
    const choice = await closeChanged(editing.fresh ? t.forms.add : t.common.save);
    if (choice === 'keep') save();
    else if (choice === 'discard') cancel();
  };
  const remove = async () => {
    if (!editing) return;
    const children = sub ? (((value[editing.i] as Item)?.[sub.name] ?? []) as unknown[]).length : 0;
    const question = children ? t.forms.removeWithChildren(singular, children) : t.forms.removeQuestion(singular);
    if (!(await ask(question, t.common.remove))) return;
    onChange(value.filter((_, j) => j !== editing.i));
    if (open === editing.i) setOpen(null);
    close();
  };
  const move = (i: number, to: number) => {
    onChange(movedList(value, i, to));
    if (open === i) setOpen(to);
    else if (open === to) setOpen(i);
  };
  // An item added at the end (+ in the top bar, or "Add item") opens its sheet.
  useEffect(() => {
    if (value.length === length.current + 1) {
      edit(value.length - 1, true);
      requestAnimationFrame(() => list.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
    length.current = value.length;
  }, [value.length]);

  return (
    <div>
      <ul ref={list} className={depth ? subListClass : listClass}>
        {value.map((item, i) => {
          const children = sub ? (((item as Item)?.[sub.name] ?? []) as unknown[]) : [];
          return (
            <ListItem
              key={i}
              tone={depth ? 'sub' : undefined}
              onClick={() => edit(i)}
              headline={nameOf(item) || t.forms.empty}
              truncate
              actions={
                <span className="flex shrink-0 pr-1.5">
                  <IconButton icon={PencilSimple} label={t.forms.editOne(nameOf(item))} onClick={() => edit(i)} />
                  <MoveButtons index={i} length={value.length} onMove={(to) => move(i, to)} />
                  {sub && (
                    <IconButton
                      icon={CaretDown}
                      label={open === i ? t.forms.hideChildrenOf(nameOf(item)) : t.forms.showChildrenOf(nameOf(item))}
                      aria-expanded={open === i}
                      className={`[&>svg]:transition-transform [&>svg]:duration-(--motion-spatial-duration) [&>svg]:ease-(--motion-ease) ${open === i ? '[&>svg]:rotate-180' : ''}`}
                      onClick={() => setOpen(open === i ? null : i)}
                    />
                  )}
                </span>
              }
            >
              {sub && open === i && (
                <div className="pb-2">
                  <MenuList
                    field={sub}
                    value={children}
                    onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...(x as Item), [sub.name]: v } : x)))}
                    depth={depth + 1}
                  />
                  <AddItem
                    field={sub}
                    sub
                    onClick={() =>
                      onChange(value.map((x, j) => (j === i ? { ...(x as Item), [sub.name]: [...children, newItem(sub)] } : x)))
                    }
                  />
                </div>
              )}
            </ListItem>
          );
        })}
      </ul>
      {add && <AddItem field={field} onClick={() => onChange([...value, newItem(field)])} />}
      <BottomSheet
        ref={sheetRef}
        aria-label={editing ? nameOf(editing.value) || capitalFirst(singular) : undefined}
        onCancel={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          void leave();
        }}
        onClick={(e) => e.target === sheetRef.current && void leave()}
      >
        {editing && (
          <>
            <SheetTitle title={nameOf(editing.value) || capitalFirst(singular)} onClose={() => void leave()} />
            <SheetBody>
              <PathHere.Provider value="">
                <WrongField.Provider value={wrongField.field}>
                  <FieldList fields={own} value={editing.value} onChange={(v) => setEditing({ ...editing, value: v as Item })} />
                </WrongField.Provider>
              </PathHere.Provider>
              {problem && <ProblemNote>{problem}</ProblemNote>}
            </SheetBody>
            <SheetActions
              onCancel={() => void leave()}
              onDone={save}
              done={editing.fresh ? t.forms.add : t.common.save}
              start={
                !editing.fresh && (
                  <Button kind="text" icon={Trash} onClick={remove}>
                    {t.common.remove}
                  </Button>
                )
              }
            />
          </>
        )}
      </BottomSheet>
    </div>
  );
}

// "Add …" (an item to a list of the menu): under a submenu (`sub`, indented as its items), or under the menu.
function AddItem({ field, sub = false, onClick }: { field: Field; sub?: boolean; onClick: () => void }) {
  return (
    <Button kind="text" size="small" icon={Plus} className={sub ? 'mt-1 ml-5' : 'mt-1'} onClick={onClick}>
      {t.forms.addOne(field.singular ?? t.forms.item)}
    </Button>
  );
}

/** A field with `icons`: the choices to tap, and a search in all the icons there are (IconPicker). */
function IconField({ id, field, text, onChange }: { id?: string; field: Field; text: string; onChange: (value: string) => void }) {
  const [wanted, setWanted] = useState(false);
  const all = useAllIconNames(wanted);
  const choices = [...(field.required ? [] : [{ label: t.forms.noIcon, value: '' }]), ...field.options!];
  // The color picked next to the icon (iconColor, src/iconColor.ts): the grid draws its icons in it.
  const around = useContext(AroundHere);
  return (
    <IconPicker
      iconColor={field.name === 'icon' ? iconColorOf(around?.value?.iconColor) : undefined}
      id={id}
      label={field.label}
      value={text}
      options={choices}
      all={all}
      onSearch={() => setWanted(true)}
      startOpen={field.iconsOpen}
      icon={(name, size) => <Icon name={name} size={size} />}
      onChange={onChange}
    />
  );
}
