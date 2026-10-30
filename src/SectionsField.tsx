// The sections of a fixed page (a list of blocks, collections.ts) as one text in the editor, like a
// page: the sections are cards in the text (Ret, Skjul/Vis, arrows, Fjern), the text between them is
// the owner's own, each heading a section of its own, and "Indsæt blok" puts a section back in.
// Read and written by sections.mjs; the file keeps its list of sections, so the site is unchanged.
// With the field's `intro`, the page's introduction is the text at the top (DataForm.tsx).
import { useContext, useMemo, useRef } from 'react';
import type { Field } from './schema';
import { sectionBlocks } from './blocks';
import { useBlockDialog } from './BlockDialog';
import MarkdownEditor, { type MarkdownHandle } from './MarkdownEditor';
import { Fields } from './fields';
import { introOf, leadsOfField, looksOf, sectionsFromParts, sectionsToMarkdown } from './sections.mjs';
import { headingLooks, sectionLooks } from '@site/editor';

type Props = {
  field: Field;
  value: Record<string, unknown>[];
  /** The page's introduction, with the field's `intro`. */
  intro?: string;
  /** The fixed page: its file and the values of its other fields, for the previews of the sections. */
  page?: { file: string; values: Record<string, unknown> };
  /** The blocks not offered under "Indsæt" (turned off, or of an app not installed); those already here stay. */
  off?: string[];
  onChange: (value: unknown, intro?: string) => void;
};

export default function SectionsField({ field, value, intro, page, off = [], onChange }: Props) {
  // The sections whose text and picture are written above their card.
  const leads = useMemo(() => leadsOfField(field), [field]);
  const list = useMemo(() => sectionBlocks(field.blocks!, leads), [field, leads]);
  const context = useContext(Fields)!;
  // What "Indsæt" offers: as EntryForm.tsx, the template's blocks without those not offered.
  const insertable = useMemo(
    () =>
      off.length
        ? { ...field.template, blocks: (field.template?.blocks ?? list.map((b) => b.type)).filter((type) => !off.includes(type)) }
        : field.template,
    [field, list, off],
  );
  const [ask, dialog] = useBlockDialog(list, { ...context, page }, insertable);
  const editor = useRef<MarkdownHandle>(null);
  // The text as the page is opened; after that the editor holds it.
  const markdown = useMemo(() => sectionsToMarkdown(value, leads, field.intro ? intro : undefined), []);
  return (
    <div>
      <span className="mb-1 block font-medium">{field.label}</span>
      <MarkdownEditor
        ref={editor}
        value={markdown}
        blocks={ask}
        addImage={context.pickImage}
        looks={(items) => looksOf(items, { file: page?.file, leads, intro: !!field.intro, sectionLooks, headingLooks })}
        sections
        onChange={() => {
          const parts = editor.current?.parts();
          if (!parts) return;
          if (!field.intro) return onChange(sectionsFromParts(parts, leads));
          const [text, rest] = introOf(parts);
          onChange(sectionsFromParts(rest, leads), text);
        }}
      />
      {dialog}
    </div>
  );
}
