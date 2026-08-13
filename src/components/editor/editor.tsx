import { markdown } from '@codemirror/lang-markdown';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
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
 * `EditorView` comes from the React wrapper's own re-export rather than from
 * `@codemirror/view`: CodeMirror's modules must be a single instance, and taking it from
 * the package that owns the instance is how that stays true.
 */
export function Editor({ value, onChange }: EditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[markdown(), EditorView.lineWrapping]}
      height="100%"
      className="h-full text-sm"
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
