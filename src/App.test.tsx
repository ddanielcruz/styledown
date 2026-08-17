import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from '@/App';

/**
 * The small-screen layout, which is one decision worth holding onto: the pane that is not
 * showing is *hidden*, never unmounted.
 *
 * jsdom loads no Tailwind, so `display: none` is not observable here and asserting on it
 * would be asserting on a class name. What is observable is the thing that actually matters
 * — that the document is still in the page while the source is the tab in front. Unmount it
 * and printing from the Source tab prints nothing, which is a failure nobody would see
 * until they had lost a document to it.
 */
describe('on a screen too small for both panes', () => {
  const real = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();

    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('max-width'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = real;
  });

  it('keeps the document in the page while the source is the one showing', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Source' }));

    expect(screen.getByRole('region', { name: 'Document' })).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'Styledown' }),
    );
  });
});
