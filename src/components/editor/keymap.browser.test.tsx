import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import App from '@/App';

/**
 * The bindings, delivered by the engine rather than synthesised into it.
 *
 * `keymap.test.tsx` presses these in jsdom, where `userEvent` builds the event object itself
 * and every browser therefore agrees. Here Playwright drives real key input, so each engine
 * fills in `key`, `code` and the modifier flags its own way — and CodeMirror matches bindings
 * on exactly those fields.
 *
 * What it still cannot reach is the layer above the page: the browser's own menus. Headless
 * has none, and no automation anywhere delivers a key to a menu bar. `Mod-e` against Safari's
 * "Use Selection for Find" stays a person pressing a key.
 */

/** Cmd on a Mac, Control everywhere else — the same choice CodeMirror's `Mod-` makes. */
const MOD = navigator.platform.toLowerCase().includes('mac') ? 'Meta' : 'Control';

/**
 * Only the link asks the clipboard, so only the link waits — and `run-action.ts` caps that
 * wait, because Firefox refuses the read a second or more after being asked where the other
 * two refuse in the same tick. This is that cap plus room to render; it failed here at five
 * seconds before the cap existed, which is how the cap came to exist.
 */
const CLIPBOARD_PATIENCE = 2000;

async function selectAll(content: string) {
  localStorage.setItem('styledown:state', JSON.stringify({ version: 1, content, styles: {} }));

  await page.viewport(1280, 800);
  render(<App />);

  await expect
    .element(page.getByRole('button', { name: 'Bold' }))
    .toHaveAttribute('aria-disabled', 'false');

  await page.getByRole('textbox', { name: 'Markdown source' }).click();
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
}

/**
 * Asked of the rendered document by tag, because the source pane holds the same word and a
 * paragraph holds the same text as the element inside it — a text query matches whichever it
 * reaches first, which is not a thing to assert on.
 */
const marked = (tag: string) =>
  page.getByRole('region', { name: 'Document' }).element().querySelector(tag)?.textContent;

describe('the keys, pressed for real', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reach the document', async () => {
    await selectAll('Hello');

    await userEvent.keyboard(`{${MOD}>}b{/${MOD}}`);

    await expect.poll(() => marked('strong')).toBe('Hello');
  });

  it('outrank autocompletion, which answers Mod-i', async () => {
    await selectAll('Hello');

    await userEvent.keyboard(`{${MOD}>}i{/${MOD}}`);

    await expect.poll(() => marked('em')).toBe('Hello');
  });

  /** `defaultKeymap` binds `Mod-k` to `deleteLine`. Lose the precedence and the line goes. */
  it('outrank the default keymap, which deletes a line on Mod-k', async () => {
    await selectAll('Hello');

    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);

    await expect.poll(() => marked('a'), { timeout: CLIPBOARD_PATIENCE }).toBe('Hello');
  });
});
