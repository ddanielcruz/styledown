import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';

/**
 * The bindings, driven as keys rather than as a table.
 *
 * `actions.test.ts` already says every action has one and that none of them collide; what it
 * cannot say is that a press reaches the document, because the answer to that is a question
 * about precedence — ours against `defaultKeymap`'s, against autocompletion's, against the
 * language's. So these press the two keys that had to be taken off somebody else, and read
 * the result out of the preview: the whole chain, end to end, or nothing.
 *
 * jsdom is not a Mac, so CodeMirror resolves `Mod` to Control here.
 */
async function selectAll(content: string) {
  localStorage.setItem('styledown:state', JSON.stringify({ version: 1, content, styles: {} }));

  render(<App />);

  const source = await screen.findByRole('textbox', { name: 'Markdown source' });

  // The preview renders from the same string, so its arrival is how we know the editor is up.
  await waitFor(() => expect(rendered().getByText(content)).toBeInTheDocument());

  // Focused rather than clicked: jsdom has no layout, so a click is a `posAtCoords` that
  // answers nothing and a selection that goes somewhere nobody asked for.
  source.focus();
  await userEvent.keyboard('{Control>}a{/Control}');
}

/** Scoped, because the source pane holds the same words the document does. */
const rendered = () => within(screen.getByRole('region', { name: 'Document' }));

describe('the keys', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reach the document', async () => {
    await selectAll('Hello');

    await userEvent.keyboard('{Control>}b{/Control}');

    await waitFor(() => expect(rendered().getByText('Hello').tagName).toBe('STRONG'));
  });

  it('outrank autocompletion, which answers Mod-i', async () => {
    await selectAll('Hello');

    await userEvent.keyboard('{Control>}i{/Control}');

    await waitFor(() => expect(rendered().getByText('Hello').tagName).toBe('EM'));
  });

  /** `defaultKeymap` binds `Mod-k` to `deleteLine`. Lose the precedence and the line goes. */
  it('outrank the default keymap, which deletes a line on Mod-k', async () => {
    await selectAll('Hello');

    await userEvent.keyboard('{Control>}k{/Control}');

    await waitFor(() => expect(rendered().getByText('Hello').tagName).toBe('A'));
  });

  /**
   * Unbound, this is Chrome offering to write the *app* to the reader's disk. The document
   * saves itself, so the binding exists only to stop that — and stopping it is the assertion.
   */
  it('keep Mod-s away from the browser', async () => {
    await selectAll('Hello');

    let prevented: boolean | undefined;

    document.addEventListener('keydown', (event) => {
      if (event.key === 's') prevented = event.defaultPrevented;
    });

    await userEvent.keyboard('{Control>}s{/Control}');

    expect(prevented).toBe(true);
  });
});
