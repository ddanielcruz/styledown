import {
  deleteMarkupBackward,
  insertNewlineContinueMarkupCommand,
} from '@codemirror/lang-markdown';
import { keymap, Prec, type EditorView, type Extension } from '@uiw/react-codemirror';

import { EDITOR_ACTIONS } from '@/lib/editor';

import { runAction } from './run-action';

/**
 * The action table, as keys.
 *
 * `Prec.high` because two of these have to be taken off somebody: `defaultKeymap` binds
 * `Mod-k` to `deleteLine`, and autocompletion answers `Mod-i`. Registered before the
 * Markdown language in the extension array, which is how it also outranks the language's own
 * high-precedence keymap — that one owns Enter and Backspace, which nothing here claims.
 */
export const editorKeymap: Extension = Prec.high(
  keymap.of(
    EDITOR_ACTIONS.flatMap((action) =>
      action.key
        ? [
            {
              key: action.key,
              // Said explicitly: the browser has its own ideas about several of these, and a
              // command returning true is not by itself enough to stop them.
              preventDefault: true,
              run: (view: EditorView) => {
                runAction(view, action.id);

                return true;
              },
            },
          ]
        : [],
    ),
  ),
);

/**
 * Ctrl/Cmd-S, swallowed.
 *
 * There is nothing to save — the document writes itself to storage on a debounce — and the
 * key is worth binding anyway, because unbound it hands the reader Chrome's "Save page"
 * dialog, which offers to write the *app* to their disk. `Prec.highest` so nothing else can
 * be in front of it.
 */
export const swallowSave: Extension = Prec.highest(
  keymap.of([{ key: 'Mod-s', preventDefault: true, run: () => true }]),
);

/**
 * Enter and Backspace, which the language package writes and we only configure.
 *
 * Continuing a list, leaving one, renumbering the rest and taking markup off a line a
 * character at a time are all its work rather than ours — the earlier project got them from
 * here too, without ever noticing it had them. What is not taken as it comes is one flag.
 * By default, Enter on an empty second item of a tight list inserts a blank line above it
 * and keeps the marker, which is how a list is made non-tight; it takes **three** presses to
 * get out of a list that way, where every editor anyone has used takes one. `nonTightLists`
 * turns it off, and a loose list is still one blank line away from being typed by hand.
 *
 * Ours rather than `markdown()`'s own, which is why the language is asked not to bring its
 * keymap — two Enter bindings at the same precedence is a question about array order that
 * nobody should have to ask.
 */
export const markdownKeys: Extension = Prec.high(
  keymap.of([
    { key: 'Enter', run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
    { key: 'Backspace', run: deleteMarkupBackward },
  ]),
);
