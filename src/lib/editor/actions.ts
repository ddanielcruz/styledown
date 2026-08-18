import { insertRule, wrapFence } from './blocks';
import type { Edit, Selection } from './edit';
import { toggleInline } from './inline';
import { toggleLinePrefix } from './line-prefix';
import { insertLink } from './link';

/**
 * Every formatting action, declared once.
 *
 * Three things read this: the CodeMirror keymap, the toolbar, and the dialog that lists the
 * shortcuts. Written as three lists they would be three places to forget one, and the
 * failure is silent in every direction — a button with no key, a key the dialog advertises
 * that nothing runs, an action nothing can reach. It is the shape `docs/DESIGN.md` already
 * uses for the option unions and schedules for the style settings in M12.
 *
 * The clipboard is passed to every action and wanted by one. Uniform on purpose: a keymap
 * that has to know which actions are the asynchronous ones is a keymap with two paths
 * through it.
 */

export interface EditorAction {
  id: string;
  label: string;
  group: ActionGroup;
  /** A CodeMirror binding, where there is one. Some actions are worth a button and no key. */
  key?: string;
  run: (doc: string, selection: Selection, clipboard?: string) => Edit;
}

export type ActionGroup = 'format' | 'headings' | 'blocks' | 'insert';

/** In the order they are shown, which is the order they are grouped in the toolbar. */
export const ACTION_GROUPS: { id: ActionGroup; label: string }[] = [
  { id: 'format', label: 'Formatting' },
  { id: 'headings', label: 'Headings' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'insert', label: 'Inserting' },
];

export const EDITOR_ACTIONS = [
  {
    id: 'bold',
    label: 'Bold',
    group: 'format',
    key: 'Mod-b',
    run: (doc, selection) => toggleInline(doc, selection, '**'),
  },
  {
    id: 'italic',
    label: 'Italic',
    group: 'format',
    key: 'Mod-i',
    // Underscores rather than a single asterisk, so italic inside bold cannot be read as
    // half of the bold — `**_word_**` is unambiguous where `***word***` is a puzzle.
    run: (doc, selection) => toggleInline(doc, selection, '_'),
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    group: 'format',
    key: 'Mod-Shift-x',
    run: (doc, selection) => toggleInline(doc, selection, '~~'),
  },
  {
    id: 'code',
    label: 'Inline code',
    group: 'format',
    key: 'Mod-e',
    run: (doc, selection) => toggleInline(doc, selection, '`'),
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    group: 'headings',
    // Not `Mod-1`: that is the browser's first tab, and no keymap of ours is going to win it.
    key: 'Mod-Alt-1',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '# '),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    group: 'headings',
    key: 'Mod-Alt-2',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '## '),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    group: 'headings',
    key: 'Mod-Alt-3',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '### '),
  },
  {
    id: 'bullet',
    label: 'Bullet list',
    group: 'blocks',
    key: 'Mod-Shift-l',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '- '),
  },
  {
    id: 'ordered',
    label: 'Numbered list',
    group: 'blocks',
    key: 'Mod-Shift-o',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '1. '),
  },
  {
    id: 'task',
    label: 'Task list',
    group: 'blocks',
    key: 'Mod-Shift-u',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '- [ ] '),
  },
  {
    id: 'quote',
    label: 'Blockquote',
    group: 'blocks',
    key: 'Mod-Shift-.',
    run: (doc, selection) => toggleLinePrefix(doc, selection, '> '),
  },
  {
    id: 'link',
    label: 'Link',
    group: 'insert',
    // Takes `deleteLine` from `defaultKeymap`, which still has `Mod-Shift-k`. A Markdown
    // editor where the most-guessed shortcut in the product deletes a line is worse.
    key: 'Mod-k',
    run: insertLink,
  },
  {
    id: 'codeBlock',
    label: 'Code block',
    group: 'insert',
    key: 'Mod-Shift-e',
    run: wrapFence,
  },
  {
    id: 'rule',
    label: 'Horizontal rule',
    group: 'insert',
    // No key. It is reached for once a document, and every binding left unclaimed is one the
    // reader's own tools can still have.
    run: insertRule,
  },
] as const satisfies readonly EditorAction[];

export type ActionId = (typeof EDITOR_ACTIONS)[number]['id'];

const BY_ID = new Map<string, EditorAction>(EDITOR_ACTIONS.map((action) => [action.id, action]));

export const actionById = (id: ActionId): EditorAction => BY_ID.get(id)!;

/**
 * What the editor can already do without us, listed because otherwise nobody finds it.
 *
 * These come from CodeMirror and from the Markdown language package rather than from this
 * module — Enter continuing a list is the one people would never guess is there, and the
 * two that were built for accessibility in M10 are the ones a keyboard reader most needs.
 */
export const INHERITED_SHORTCUTS: { label: string; key: string }[] = [
  { label: 'Undo', key: 'Mod-z' },
  { label: 'Redo', key: 'Mod-Shift-z' },
  { label: 'Continue a list, or leave an empty one', key: 'Enter' },
  { label: 'Indent', key: 'Tab' },
  { label: 'Let Tab move focus instead', key: 'Escape' },
  { label: 'Delete line', key: 'Mod-Shift-k' },
  { label: 'Move line up', key: 'Alt-ArrowUp' },
  { label: 'Move line down', key: 'Alt-ArrowDown' },
];
