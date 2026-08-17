import {
  Decoration,
  EditorView,
  RangeSetBuilder,
  StateField,
  WidgetType,
  type DecorationSet,
  type EditorState,
  type Extension,
} from '@uiw/react-codemirror';

/**
 * A data URI in the source, shown as what it weighs.
 *
 * Measured, one pasted photograph turns the source pane into eighty-eight screens of
 * scrolling, of which eighty-six are base64 — the document becomes two percent of its own
 * scrollbar. That is not a performance problem, CodeMirror handles the long line fine; it
 * is a navigation one, and it makes the end of a document with images in it unreachable.
 *
 * So the payload is replaced by its size. The label stays visible, the line stays a line,
 * and the range is atomic, so arrow keys step over it and selecting or deleting it takes
 * the whole image rather than half of one.
 */

/**
 * Low, and deliberately. There is no length at which base64 becomes worth reading, and a
 * small one left unfolded is the only ugly thing left on the screen — it wraps over three
 * lines beside the neat ones. Short enough that no line of prose can reach it either way.
 */
const MIN_PAYLOAD = 64;

const DATA_URI = new RegExp(`(data:[\\w.+/-]+;base64,)([A-Za-z0-9+/=]{${MIN_PAYLOAD},})`, 'g');

function sizeOf(payload: string): string {
  const bytes = Math.round((payload.replace(/=+$/, '').length * 3) / 4);

  if (bytes < 1024) return `${bytes} B`;

  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

class BytesWidget extends WidgetType {
  readonly label: string;

  constructor(label: string) {
    super();
    this.label = label;
  }

  eq(other: BytesWidget) {
    return other.label === this.label;
  }

  toDOM() {
    const span = document.createElement('span');

    span.className = 'cm-data-uri';
    span.textContent = this.label;

    return span;
  }
}

function folds(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  // By line, and only the long ones: a document's ordinary lines are never touched, and
  // the few that are get one linear scan each rather than a scan of the whole document.
  for (let number = 1; number <= state.doc.lines; number++) {
    const line = state.doc.line(number);
    if (line.length < MIN_PAYLOAD) continue;

    for (const match of line.text.matchAll(DATA_URI)) {
      const [, prefix = '', payload = ''] = match;
      const from = line.from + match.index + prefix.length;

      builder.add(
        from,
        from + payload.length,
        Decoration.replace({ widget: new BytesWidget(sizeOf(payload)) }),
      );
    }
  }

  return builder.finish();
}

const field = StateField.define<DecorationSet>({
  create: folds,
  // A view plugin cannot own these: replacing a range changes the height of a line, and a
  // decoration that changes heights has to be known outside the viewport as well as in it.
  update: (value, transaction) => (transaction.docChanged ? folds(transaction.state) : value),
  provide: (self) => [
    EditorView.decorations.from(self),
    EditorView.atomicRanges.of((view) => view.state.field(self)),
  ],
});

const theme = EditorView.baseTheme({
  '.cm-data-uri': {
    padding: '0 0.4em',
    borderRadius: '3px',
    fontSize: '0.85em',
    background: 'var(--muted)',
    color: 'var(--muted-foreground)',
  },
});

export const imageFolds = (): Extension => [field, theme];
