import { markdown } from '@codemirror/lang-markdown';
import CodeMirror from '@uiw/react-codemirror';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * The Markdown source pane. Bare on purpose for M1 — no toolbar, no shortcuts.
 *
 * `basicSetup` is trimmed rather than accepted wholesale: line numbers, fold gutters
 * and bracket matching are code-editor furniture, and this pane holds prose.
 */
export function Editor({ value, onChange }: EditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[markdown()]}
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
