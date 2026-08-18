import type { EditorView } from '@uiw/react-codemirror';

import { actionById, type ActionId } from '@/lib/editor';

/**
 * The thin part: an action, against the document the editor currently has.
 *
 * `EditorView` is imported as a type and nothing else, so this module weighs nothing and can
 * sit in the first chunk beside the toolbar while CodeMirror stays in the second. Everything
 * it needs is property access on the view it is handed — and `{ anchor, head }` is a
 * transaction spec CodeMirror accepts as it stands, so not even `EditorSelection` is needed.
 */

/**
 * What the reader last copied, if the browser will say and it is willing to be asked.
 *
 * Every failure here is the same failure — no clipboard API, a permission not granted, a
 * browser that only allows the read during a gesture — and the answer to all of them is to
 * carry on without it. A link with an empty destination is what the reader was going to type
 * anyway; a link that never appeared because a promise rejected is not.
 */
async function clipboardText(): Promise<string | undefined> {
  try {
    return await navigator.clipboard?.readText();
  } catch {
    return undefined;
  }
}

function dispatch(view: EditorView, id: ActionId, clipboard: string | undefined) {
  const doc = view.state.doc.toString();
  const { from, to } = view.state.selection.main;

  view.dispatch({
    ...actionById(id).run(doc, { from, to }, clipboard),
    scrollIntoView: true,
    userEvent: 'input.format',
  });
}

/**
 * Synchronous unless it has to ask the clipboard, which only the link does — and even then
 * this returns immediately, because a key binding has to say whether it handled the key
 * before anything it triggered has finished.
 */
export function runAction(view: EditorView, id: ActionId): void {
  if (!actionById(id).wantsClipboard) {
    dispatch(view, id, undefined);

    return;
  }

  void clipboardText().then((clipboard) => {
    dispatch(view, id, clipboard);
    view.focus();
  });
}
