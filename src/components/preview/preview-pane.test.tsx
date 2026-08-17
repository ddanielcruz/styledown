import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createDefaultStyles } from '@/lib/styles';

import { PreviewPane } from './preview-pane';

/**
 * The hole this closes: `docs/DESIGN.md` forbids a blank canvas, and until now that was
 * only true on the way in. Two keystrokes emptied the document mid-session and left nothing
 * on screen and nothing to ask for.
 */
describe('an empty document', () => {
  const styles = createDefaultStyles(['en-GB']);

  it('offers a way back rather than a blank sheet', async () => {
    const onNew = vi.fn<() => void>();

    // Braces, not quotes: a JSX string attribute takes `\n` as two characters.
    render(<PreviewPane markdown={'   \n'} styles={styles} onNew={onNew} />);

    await userEvent.click(screen.getByRole('button', { name: /sample document/i }));

    expect(onNew).toHaveBeenCalled();
  });
});
