import { markdown } from '@codemirror/lang-markdown';
import CodeMirror, { EditorView, keymap } from '@uiw/react-codemirror';
import { useMemo } from 'react';

import { imageFolds } from './image-folds';
import { imageInput } from './image-input';
import type { Notify } from './insert-images';
import { editorKeymap, markdownKeys, swallowSave } from './keymap';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Somewhere to report a paste that could not become an image. */
  onNotice: Notify;
  /** The view, once there is one — which is what the toolbar acts through. */
  onReady?: (view: EditorView) => void;
}

/**
 * Tab indents, as it does in every Markdown editor, and Escape lets a keyboard user out.
 *
 * Tab that indents is Tab that does not move focus, which is a keyboard trap in a product
 * whose entire surface is this one pane. CodeMirror ships the remedy — tab-focus mode — and
 * `defaultKeymap` already binds it to Ctrl-m, which nobody has ever guessed. Escape is the
 * binding people try.
 *
 * It chains rather than overrides: `defaultKeymap` binds Escape to `simplifySelection`,
 * which returns false when the selection is already a bare cursor, and a binding that
 * returns false hands the key to the next one. So Escape collapses a selection if there is
 * one, and otherwise opens a two-second window in which Tab moves focus. Registered after
 * `basicSetup` so it is the lower-precedence half of that pair.
 */
const releaseTab = keymap.of([
  {
    key: 'Escape',
    run: (view) => {
      view.setTabFocusMode(2000);

      return true;
    },
  },
]);

/** Named, because "edit text" is what a screen reader calls an unlabelled text box. */
const named = EditorView.contentAttributes.of({
  'aria-label': 'Markdown source',
  'aria-keyshortcuts': 'Escape',
});

/**
 * The Markdown source pane.
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
 * The keymap goes in **first**, because two of its bindings have to be taken off somebody
 * else: `defaultKeymap` owns `Mod-k`, and autocompletion answers `Mod-i`.
 *
 * `addKeymap: false` is not a rejection of what the language binds — `markdownKeys` puts
 * the same two commands back, one of them configured. It is how there comes to be exactly
 * one Enter binding rather than two at the same precedence.
 *
 * `EditorView` comes from the React wrapper's own re-export rather than from
 * `@codemirror/view`: CodeMirror's modules must be a single instance, and taking it from
 * the package that owns the instance is how that stays true.
 */
export function Editor({ value, onChange, onNotice, onReady }: EditorProps) {
  // Held still on purpose: a fresh array is a fresh configuration, and CodeMirror rebuilds
  // its extensions every time it is handed one.
  const extensions = useMemo(
    () => [
      swallowSave,
      editorKeymap,
      markdownKeys,
      markdown({ addKeymap: false }),
      EditorView.lineWrapping,
      imageInput(onNotice),
      imageFolds(),
      releaseTab,
      named,
    ],
    [onNotice],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      onCreateEditor={(view) => onReady?.(view)}
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
