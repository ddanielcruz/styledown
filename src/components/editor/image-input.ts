import { EditorView } from '@uiw/react-codemirror';
import type { Extension } from '@uiw/react-codemirror';

import { encodeImage, fitsInStorage, imageInsertion } from '@/lib/images';

/** How the editor says something went wrong, since it has no room to say it itself. */
export type Notify = (message: string) => void;

const TOO_LARGE =
  'That image would put the document over what the browser can store. Not added — download the .md to keep a copy.';

const imagesIn = (transfer: DataTransfer | null): File[] =>
  Array.from(transfer?.files ?? []).filter((file) => file.type.startsWith('image/'));

/**
 * One image, into the document. Answers where the next one should go.
 *
 * The position is clamped because encoding is asynchronous: the reader can keep typing
 * while a photograph is being resized, and a stale offset past the end of the document
 * would throw rather than land somewhere harmless.
 */
function placeImage(
  view: EditorView,
  at: number,
  file: File,
  dataUrl: string | undefined,
  notify: Notify,
) {
  if (!dataUrl) {
    notify(`${file.name} is not an image this browser can read.`);
    return at;
  }

  const doc = view.state.doc.toString();
  const insertion = imageInsertion(doc, Math.min(at, doc.length), {
    dataUrl,
    name: file.name,
  });

  const added = insertion.reference.insert.length + insertion.definition.insert.length;
  if (!fitsInStorage(doc, added)) {
    notify(TOO_LARGE);
    return at;
  }

  view.dispatch({
    changes: [insertion.reference, insertion.definition],
    // The alt text, selected: an image nobody has described is the normal state of a
    // pasted image, and this is the one moment the reader is looking straight at it.
    selection: { anchor: insertion.alt.from, head: insertion.alt.to },
    scrollIntoView: true,
    userEvent: 'input.paste',
  });

  // The cursor is now inside the alt of the image just placed, which `imageInsertion`
  // knows to step clear of — so the next one follows this one rather than landing in it.
  return view.state.selection.main.head;
}

/**
 * Encoded together, inserted one after another: three photographs resize in parallel, but
 * each one has to be placed against the document the one before it left behind.
 */
async function insertImages(view: EditorView, at: number, files: File[], notify: Notify) {
  const encoded = await Promise.all(files.map((file) => encodeImage(file)));

  files.reduce((next, file, index) => placeImage(view, next, file, encoded[index], notify), at);
}

/**
 * Paste and drop, as images rather than as text.
 *
 * Both have to be intercepted rather than added to. CodeMirror's own drop handler reads
 * *any* dropped file as text and discards what does not look like text, so an unhandled PNG
 * silently does nothing; its paste handler reads `text/plain`, which a screenshot does not
 * have, so an unhandled paste quietly deletes the selection and inserts nothing.
 *
 * Returning `true` is what stops both — CodeMirror calls `preventDefault` itself and skips
 * the rest of the chain, and handlers from extensions run before its own.
 */
export function imageInput(notify: Notify): Extension {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const files = imagesIn(event.clipboardData);
      if (!files.length) return false;

      void insertImages(view, view.state.selection.main.head, files, notify);

      return true;
    },

    drop(event, view) {
      const files = imagesIn(event.dataTransfer);
      if (!files.length) return false;

      const at = view.posAtCoords({ x: event.clientX, y: event.clientY });
      void insertImages(view, at ?? view.state.selection.main.head, files, notify);

      return true;
    },
  });
}
