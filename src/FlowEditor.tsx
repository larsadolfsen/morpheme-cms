// The host of a flow editor, as a hook: makes a Milkdown/ProseMirror editor in a root element once, loads a document into it, tells the caller
// each change of the document after it is loaded, and destroys it. The page editor (MarkdownEditor.tsx) calls it with its Markdown schema;
// another window calls it with flowSchema (a JSON document, no Markdown). The work is in src/flowCore.ts (no React, tested). Exposes
// useFlowEditor. Depends on React and Milkdown.
import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@milkdown/kit/core';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { Node } from '@milkdown/kit/prose/model';
import type { EditorView } from '@milkdown/kit/prose/view';
import { startFlow, type FlowSchema } from './flowCore';

/** `schema` makes the editor of `doc`; `plugins` are put on it (called once, when the editor is made); `onChange` is told after the document
 * has loaded, each time it changes; `onCreated` runs once the editor is made and before changes are told. The editor is made once: the caller
 * keys it, as a page's file. Gives the root element's ref, the editor (null until it is made) and whether it is ready. */
export function useFlowEditor<Doc>({
  schema,
  doc,
  plugins,
  onChange,
  onCreated,
}: {
  schema: FlowSchema<Doc>;
  doc: Doc;
  plugins: () => MilkdownPlugin[];
  onChange?: (view: EditorView, prev: Node) => void;
  onCreated?: (editor: Editor) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const editor = useRef<Editor | null>(null);
  const [ready, setReady] = useState(false);
  const changed = useRef(onChange);
  changed.current = onChange;
  const created = useRef(onCreated);
  created.current = onCreated;
  useEffect(() => {
    const stop = startFlow({
      root: root.current,
      schema,
      doc,
      plugins,
      onChange: (view, prev) => changed.current?.(view, prev),
      onCreated: (made) => {
        editor.current = made;
        created.current?.(made);
      },
      onReady: () => setReady(true),
    });
    return () => {
      stop();
      editor.current = null;
    };
    // The editor is made once.
  }, []);
  return { root, editor, ready };
}
