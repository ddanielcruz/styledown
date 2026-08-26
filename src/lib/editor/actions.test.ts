import { describe, expect, it } from 'vitest';

import { ACTION_GROUPS, EDITOR_ACTIONS, INHERITED_SHORTCUTS } from './actions';
import { applyEdit } from './apply-edit';

/**
 * The table is only worth being a table if nothing can quietly disagree with it. Three
 * consumers read it — the keymap, the toolbar and the dialog — and every failure it can
 * produce is silent: two actions on one key means one of them never runs, and a group with
 * nothing in it is an empty heading in the dialog.
 */
describe('the action table', () => {
  it('gives every action its own key', () => {
    const keys = EDITOR_ACTIONS.map((action) => action.key).filter(Boolean);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('does not advertise a key it also inherits', () => {
    const ours = new Set<string | undefined>(EDITOR_ACTIONS.map((action) => action.key));

    expect(INHERITED_SHORTCUTS.filter(({ key }) => ours.has(key))).toEqual([]);
  });

  it('puts every action in a group that is shown, and shows no empty ones', () => {
    const declared = ACTION_GROUPS.map((group) => group.id);
    const used = new Set(EDITOR_ACTIONS.map((action) => action.group));

    expect(declared.filter((group) => !used.has(group))).toEqual([]);
    expect([...used].filter((group) => !declared.includes(group))).toEqual([]);
  });

  it('leaves a document every action can be run against unchanged in shape', () => {
    // Not a behaviour test — those live beside each transform. This is the one that catches
    // an action wired to the wrong function, by proving each of them does something.
    const doc = 'Title\n\nsome words here\n';

    const inert = EDITOR_ACTIONS.filter(
      (action) => applyEdit(doc, action.run(doc, { from: 8, to: 12 })).doc === doc,
    );

    expect(inert.map((action) => action.id)).toEqual([]);
  });
});
