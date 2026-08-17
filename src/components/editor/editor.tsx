import { markdown } from '@codemirror/lang-markdown';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useMemo } from 'react';

import { imageFolds } from './image-folds';
import { imageInput, type Notify } from './image-input';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Somewhere to report a paste that could not become an image. */
  onNotice: Notify;
}

/**
 * The Markdown source pane. Bare on purpose for M1 — no toolbar, no shortcuts.
 *
 * `basicSetup` is trimmed rather than accepted wholesale: line numbers, fold gutters
 * and bracket matching are code-editor furniture, and this pane holds prose.
 *
 * Lines wrap for the same reason. A code editor scrolls sideways because a line of code
 * means something as a line; a paragraph does not, and a paragraph you have to scroll to
 * read is a paragraph you cannot read beside the document it is producing. The pane is
 * already resizable, so the reader sets the measure by dragging rather than by reflowing
 * their source.
 *
 * What is added rather than removed is images, as two extensions rather than as anything
 * wrapped around the component: pasting and dropping need the position under the pointer
 * and a transaction to dispatch, and folding a data URI needs the document. The editor
 * already has all three.
 *
 * `EditorView` comes from the React wrapper's own re-export rather than from
 * `@codemirror/view`: CodeMirror's modules must be a single instance, and taking it from
 * the package that owns the instance is how that stays true.
 */
export function Editor({ value, onChange, onNotice }: EditorProps) {
  // Held still on purpose: a fresh array is a fresh configuration, and CodeMirror rebuilds
  // its extensions every time it is handed one.
  const extensions = useMemo(
    () => [markdown(), EditorView.lineWrapping, imageInput(onNotice), imageFolds()],
    [onNotice],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      className="h-full text-sm"
      placeholder="Write in Markdown. The document builds itself as you type."
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        bracketMatching: false,
        closeBrackets: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
      }}
    />
  );
}
