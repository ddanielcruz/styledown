import { EditorView } from '@uiw/react-codemirror';
import type { Extension } from '@uiw/react-codemirror';

import { imagesIn, insertImages, type Notify } from './insert-images';

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
