import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';

/**
 * The behaviour this milestone decided *not* to write.
 *
 * `markdown()` installs its own high-precedence keymap, which is where Enter continuing a
 * list, leaving an empty one, and renumbering as it goes all come from. Nothing in this
 * repository implements any of it — so it is pinned here, because the way it would be lost
 * is a keymap of ours landing in front of it, and nothing else would say so.
 */
describe('the source pane, on Enter', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'styledown:state',
      JSON.stringify({ version: 1, content: '# List\n\n- item', styles: {} }),
    );
  });

  it('continues a list, and leaves it on an item nobody filled in', async () => {
    render(<App />);

    const source = await screen.findByRole('textbox', { name: 'Markdown source' });

    await waitFor(() => expect(screen.getByRole('listitem')).toBeInTheDocument());

    // Focused rather than clicked: jsdom has no layout, so a click is a `posAtCoords` that
    // answers nothing and a selection that goes somewhere nobody asked for.
    source.focus();
    await userEvent.keyboard('{Control>}{End}{/Control}');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
  });
});
