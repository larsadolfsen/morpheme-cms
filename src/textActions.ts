// The text's actions as registry entries (src/actions.ts): Bold, Italic, Link, the text styles, the lists, the alignment, Undo and Redo, Section settings and
// Insert. MarkdownEditor.tsx gives its own functions and the labels the bar draws (so the name is the same in the bar and in the palette), and registers the list
// while it is mounted; the bar still draws its tools from its own lists. The keys are those of the text engine (`handledBy: 'text'`): the registry only shows them
// in the tooltip and the palette. Exposes textActions, TextApi, TextLabels. Pure: no packages, no browser.
import type { EditorAction } from './actions';
import { listRows, styleRows } from './styleMenu.mjs';

/** What the actions do: the editor's own functions. */
export type TextApi = {
  bold: () => void;
  italic: () => void;
  link: () => void;
  undo: () => void;
  redo: () => void;
  /** A text style ('h1', 'h2', 'h3', 'large', 'medium', 'small', 'label', 'quote') or a list ('bullet', 'check', 'ordered'). */
  setKind: (kind: string) => void;
  align: (align: 'left' | 'center' | 'right') => void;
  sectionSettings: () => void;
  /** Missing while the text has no blocks / no gallery. */
  insertBlock?: () => void;
  insertImage?: () => void;
  /** A page's or post's text only: the form's Preview (pagePreview.tsx), and View on site (a saved page; not a new one). */
  preview?: () => void;
  viewOnSite?: () => void;
};

/** The names the bar draws, in the editor's language. */
export type TextLabels = {
  bold: string;
  italic: string;
  link: string;
  undo: string;
  redo: string;
  styles: Record<string, string>;
  lists: Record<string, string>;
  align: Record<'left' | 'center' | 'right', string>;
  sectionSettings: string;
  insertBlock: string;
  insertImage: string;
  preview: string;
  viewOnSite: string;
};

const STYLE_ORDER = ['h1', 'h2', 'h3', 'large', 'medium', 'small', 'label', 'quote'];
const LIST_ORDER = ['bullet', 'check', 'ordered'];
const LIST_ICONS: Record<string, string> = { bullet: 'format_list_bulleted', check: 'checklist', ordered: 'format_list_numbered' };

/**
 * @param api the editor's functions
 * @param labels the names, in the editor's language
 *
 * A style or a list that does not apply where the cursor is (a heading in a list item, a list in a heading) is hidden, as the bar's menus hide their rows.
 */
export function textActions(api: TextApi, labels: TextLabels): EditorAction[] {
  const inText = (ctx: { text?: boolean }) => (ctx.text ? 'enabled' : 'hidden');
  const marked = (name: string) => (ctx: { active?: string[] }) => !!ctx.active?.includes(name);
  const out: EditorAction[] = [
    {
      id: 'text.bold',
      label: labels.bold,
      icon: 'format_bold',
      words: ['strong'],
      group: 'text',
      shortcut: { key: 'Mod+B' },
      handledBy: 'text',
      where: { bar: { context: 'text', order: 0 } },
      state: inText,
      pressed: marked('strong'),
      run: api.bold,
    },
    {
      id: 'text.italic',
      label: labels.italic,
      icon: 'format_italic',
      words: ['emphasis'],
      group: 'text',
      shortcut: { key: 'Mod+I' },
      handledBy: 'text',
      where: { bar: { context: 'text', order: 1 } },
      state: inText,
      pressed: marked('emphasis'),
      run: api.italic,
    },
    {
      id: 'text.link',
      label: labels.link,
      icon: 'link',
      group: 'text',
      where: { bar: { context: 'text', order: 5 } },
      state: inText,
      pressed: marked('link'),
      run: api.link,
    },
  ];
  for (const kind of STYLE_ORDER.filter((k) => labels.styles[k])) {
    out.push({
      id: `text.style-${kind}`,
      label: labels.styles[kind],
      words: ['text style', 'style'],
      group: 'text',
      where: {},
      state: (ctx) => (ctx.text && styleRows(ctx.active ?? [], ctx.levels ?? [2, 3]).includes(kind) ? 'enabled' : 'hidden'),
      pressed: marked(kind),
      run: () => api.setKind(kind),
    });
  }
  for (const kind of LIST_ORDER.filter((k) => labels.lists[k])) {
    out.push({
      id: `text.list-${kind}`,
      label: labels.lists[kind],
      icon: LIST_ICONS[kind],
      words: ['list'],
      group: 'text',
      where: {},
      state: (ctx) => (ctx.text && listRows(ctx.active ?? []).includes(kind) ? 'enabled' : 'hidden'),
      pressed: marked(kind),
      run: () => api.setKind(kind),
    });
  }
  for (const align of ['left', 'center', 'right'] as const) {
    out.push({
      id: `text.align-${align}`,
      label: labels.align[align],
      icon: `format_align_${align}`,
      words: ['alignment'],
      group: 'text',
      where: {},
      // A paragraph or a smaller heading can be aligned (`alignable`).
      state: (ctx) => (!ctx.text ? 'hidden' : ctx.active?.includes('alignable') ? 'enabled' : 'disabled'),
      run: () => api.align(align),
    });
  }
  out.push(
    {
      id: 'text.undo',
      label: labels.undo,
      icon: 'undo',
      group: 'text',
      shortcut: { key: 'Mod+Z' },
      handledBy: 'text',
      where: { bar: { context: 'fixed', order: 0 } },
      state: inText,
      run: api.undo,
    },
    {
      id: 'text.redo',
      label: labels.redo,
      icon: 'redo',
      group: 'text',
      shortcut: { key: 'Mod+Shift+Z' },
      handledBy: 'text',
      where: { bar: { context: 'fixed', order: 1 } },
      state: inText,
      run: api.redo,
    },
    {
      id: 'section.settings',
      label: labels.sectionSettings,
      icon: 'tune',
      meaning: 'settings-here',
      group: 'section',
      where: { more: { context: 'section', order: 0 } },
      state: (ctx) => (ctx.section ? 'enabled' : 'hidden'),
      run: api.sectionSettings,
    },
  );
  if (api.insertBlock)
    out.push({
      id: 'insert.block',
      label: labels.insertBlock,
      icon: 'add',
      words: ['add', 'new block'],
      group: 'insert',
      where: { bar: { context: 'fixed', order: 2 } },
      state: inText,
      run: api.insertBlock,
    });
  if (api.insertImage)
    out.push({
      id: 'insert.image',
      label: labels.insertImage,
      icon: 'image',
      words: ['photo', 'image'],
      group: 'insert',
      where: {},
      state: inText,
      run: api.insertImage,
    });
  // Preview and View on site are in the text's one bar (one save while writing, 3.3): Preview is a main tool before Undo, View on site the last group of the ⋮.
  if (api.preview)
    out.push({
      id: 'page.preview',
      label: labels.preview,
      icon: 'devices',
      words: ['preview page', 'see page'],
      group: 'page',
      where: { bar: { context: 'fixed', order: -1 } },
      run: api.preview,
    });
  if (api.viewOnSite)
    out.push({
      id: 'page.view-on-site',
      label: labels.viewOnSite,
      icon: 'open_in_new',
      words: ['open page', 'live page', 'website'],
      group: 'page',
      where: { more: { context: 'fixed', order: 99 } },
      run: api.viewOnSite,
    });
  return out;
}
