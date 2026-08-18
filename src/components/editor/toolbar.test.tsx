import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';

/**
 * Driven through the app rather than against the component's own props, because the decision
 * worth covering is not that a button calls a callback — it is that pressing it here changes
 * the document over there. A toolbar tested against its own `onAction` would pass with the
 * editor unplugged.
 *
 * The editor arrives in a second chunk, so everything here waits for it first. That wait is
 * itself the thing the `disabled` state exists for.
 */
async function editorReady() {
  render(<App />);

  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-disabled', 'false'),
  );
}

describe('the formatting toolbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('waits for the editor before it offers to act on it', () => {
    render(<App />);

    // The toolbar is in the first chunk and the editor is not, so for a moment there is a
    // toolbar and nothing to press it against. Announced as unavailable rather than taken
    // out of the tab order: a toolbar is one stop, and one that changes shape underneath a
    // keyboard reader is worse than one that says a button is not ready yet.
    const bold = screen.getByRole('button', { name: 'Bold' });

    expect(bold).toHaveAttribute('aria-disabled', 'true');
    expect(bold).toHaveAttribute('tabindex', '0');
  });

  it('changes the document, and the page follows', async () => {
    await editorReady();

    // The cursor starts at the top of the source, on the document's own title.
    await userEvent.click(screen.getByRole('button', { name: 'Heading 2' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Styledown' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Styledown' })).not.toBeInTheDocument();
  });

  it('is one stop for a keyboard, not fifteen', async () => {
    await editorReady();

    const buttons = screen.getAllByRole('button', { name: /Bold|Italic|Heading 1|Link/ });

    // Exactly one of them is in the tab order at a time; the arrow keys reach the rest.
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it('says what the keys are', async () => {
    await editorReady();

    await userEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

    const dialog = await screen.findByRole('dialog');

    expect(dialog).toHaveTextContent('Bold');
    // The one nobody would guess is there, which is the reason the dialog lists what it did
    // not implement as well as what it did.
    expect(dialog).toHaveTextContent('Continue a list');
  });
});
