// The core of the flow editor's host with no React (FlowEditor.tsx wraps it in the hook): makes a Milkdown/ProseMirror editor in a root element,
// loads a document into it, tells each change of the document after it is loaded, and gives back what stops it. flowSchema is the schema of
// a document in JSON (no Markdown). Exposes startFlow, flowSchema and the type FlowSchema. Depends on Milkdown.
import { defaultValueCtx, Editor, rootCtx } from '@milkdown/kit/core';
import { docSchema, paragraphSchema, textSchema } from '@milkdown/kit/preset/commonmark';
import { history } from '@milkdown/kit/plugin/history';
import { $prose } from '@milkdown/kit/utils';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { JSONRecord } from '@milkdown/kit/transformer';
import type { Node } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

/** What makes the editor of `doc` in `root` (the nodes and marks, and how the document is read). Not created yet. */
export type FlowSchema<Doc> = (root: HTMLElement | null, doc: Doc) => Editor;

export type FlowOptions<Doc> = {
  root: HTMLElement | null;
  schema: FlowSchema<Doc>;
  doc: Doc;
  /** Put on the editor, in this order, before it is created. */
  plugins: () => MilkdownPlugin[];
  /** Told each time the document changes once it has loaded (not for what `onCreated` puts in): the view, and the document it was. */
  onChange?: (view: EditorView, prev: Node) => void;
  /** Runs once the editor is created, before changes are told (the cursor, the free lines). */
  onCreated?: (editor: Editor) => void;
  /** Gets the editor once it is created and loaded. */
  onReady?: (editor: Editor) => void;
};

/** Makes the editor and loads the document. Returns what stops it: destroys the editor, or if it is not created yet, destroys it when it is. */
export function startFlow<Doc>({ root, schema, doc, plugins, onChange, onCreated, onReady }: FlowOptions<Doc>) {
  let cancelled = false;
  let made: Editor | null = null;
  let loaded = false;
  const onEdit = $prose(
    () =>
      new Plugin({
        view: () => ({
          update: (view, prev) => {
            if (!loaded || view.state.doc.eq(prev.doc)) return;
            onChange?.(view, prev.doc);
          },
        }),
      }),
  );
  let editor = schema(root, doc);
  for (const plugin of plugins()) editor = editor.use(plugin);
  void editor
    .use(onEdit)
    .create()
    .then((created) => {
      if (cancelled) return created.destroy();
      made = created;
      onCreated?.(created);
      loaded = true;
      onReady?.(created);
    });
  return () => {
    cancelled = true;
    void made?.destroy();
    made = null;
  };
}

// A document in JSON (ProseMirror's `toJSON`) with no Markdown in or out. The nodes are the caller's, as Milkdown node schemas; the document
// node, text and the plain paragraph are the core's, and undo and redo are on. Milkdown reads a `{ type: 'json', value }` default value
// without its Markdown parser, so nothing is parsed or serialised.
export const flowSchema =
  (nodes: MilkdownPlugin[]): FlowSchema<JSONRecord> =>
  (root, doc) => {
    let editor = Editor.make().config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, { type: 'json', value: doc });
    });
    for (const node of [docSchema, textSchema, paragraphSchema, ...nodes, history].flat()) editor = editor.use(node);
    return editor;
  };
