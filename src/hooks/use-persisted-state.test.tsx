import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App';

/**
 * Rendered through the app, and "reloaded" by unmounting and rendering again — which is
 * what a refresh is from the hook's point of view, since it reads storage exactly once on
 * the way in. The claim being tested is the milestone's whole success condition, and it is
 * a claim about the app rather than about a hook.
 */
describe('persistence', () => {
  const sheet = () => document.querySelector<HTMLElement>('.styledown-doc')!;
  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  /** Saves are debounced, so a test that never waits is a test that never sees one. */
  const settle = () => act(() => void vi.advanceTimersByTime(1000));

  beforeEach(() => {
    localStorage.clear();
    // `shouldAdvanceTime` keeps the clock ticking underneath: user-event awaits its own
    // timers between events, and a clock that only moves when a test says so deadlocks
    // against it.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('still has the document you opened after a reload', async () => {
    const { unmount } = render(<App />);

    // The hidden input is the control; the button beside it only clicks it. Reached
    // directly because it is deliberately out of the accessibility tree.
    const picker = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user().upload(picker, new File(['# Q3 Postmortem'], 'q3.md', { type: 'text/markdown' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Q3 Postmortem' })).toBeVisible();

    settle();
    unmount();
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Q3 Postmortem' })).toBeVisible();
  });

  it('still has the settings you chose after a reload', async () => {
    const { unmount } = render(<App />);

    await user().click(screen.getByRole('button', { name: 'Rose' }));
    await user().click(screen.getByRole('button', { name: 'Legal' }));

    settle();
    unmount();
    render(<App />);

    expect(sheet().style.getPropertyValue('--doc-accent')).toBe('#be123c');
    expect(sheet().dataset.pageSize).toBe('legal');
  });

  it('comes back on the default document when what was stored is nonsense', () => {
    // `docs/DESIGN.md`: a corrupted entry must never produce a broken app. Truncated JSON
    // is what a write interrupted by a closing tab actually leaves behind.
    localStorage.setItem('styledown:state', '{"version":1,"content":"# Half a docu');

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Styledown' })).toBeVisible();
  });

  it('names the tab after the document, which is what Chrome offers to save the PDF as', async () => {
    render(<App />);

    const picker = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user().upload(picker, new File(['# Q3 Postmortem'], 'q3.md', { type: 'text/markdown' }));
    await screen.findByRole('heading', { level: 1, name: 'Q3 Postmortem' });
    settle();

    expect(document.title).toBe('Q3 Postmortem');
  });
});
