import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import App from '@/App';

/**
 * What jsdom cannot be asked.
 *
 * The jsdom tests beside this one cover what the toolbar *decides* — that a press changes
 * the document, that it is one tab stop, that it waits for the editor. None of them can see
 * a pixel: jsdom runs no layout, so `getBoundingClientRect` is zeros, hit-testing answers
 * nothing, and there is no canvas to encode an image with. Every bug this milestone shipped
 * and then fixed was in that blind spot and was found by hand in a browser. These are those
 * bugs, written down.
 */
describe('the toolbar, laid out', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Both of the layout bugs, in one place, because they are the same 390px screen.
   *
   * The first: a flex item's minimum width is its content, and the content here is fifteen
   * buttons — so the source pane measured 534px inside a 390px viewport and the whole app
   * scrolled sideways. The second: the strip that fixes it scrolls, which put the button
   * that explains the rest of the bar off the end of it, where nobody would ever find it.
   */
  it('fits a phone, and keeps the way out of it in sight', async () => {
    await page.viewport(390, 844);

    render(<App />);

    await expect.element(page.getByRole('button', { name: 'Bold' })).toBeVisible();

    // Nothing may make the page itself scroll sideways.
    const root = document.documentElement;
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    // Pinned outside the scrolling strip, so it is reachable without discovering that the
    // strip scrolls at all.
    await expect.element(page.getByRole('button', { name: 'Keyboard shortcuts' })).toBeInViewport();

    // And the strip really is overflowing rather than having quietly shrunk its buttons:
    // the last thing in it starts out past the edge.
    await expect.element(page.getByRole('button', { name: 'Image' })).not.toBeInViewport();
  });

  /**
   * The selection survives the click, which is what `onMouseDown` preventDefault is for.
   *
   * Unreachable in jsdom twice over: selecting a word by double-clicking it needs
   * `posAtCoords`, which needs layout, and a toolbar that stole the focus would still look
   * fine to a runner where focus is bookkeeping rather than something the caret sits in.
   */
  it('acts on the word the pointer chose, and does not take the focus to do it', async () => {
    // Set per test rather than once: the viewport is the browser's and outlives a render,
    // so the phone-sized test before this one would otherwise hand it a hidden document.
    await page.viewport(1280, 800);

    render(<App />);

    // The document's own title, in the source rather than the preview: only the source
    // carries the hash.
    await page.getByText('# Styledown').dblClick();

    await page.getByRole('button', { name: 'Bold' }).click();

    const title = page.getByRole('heading', { level: 1, name: 'Styledown' });

    await expect.element(title).toBeVisible();
    expect(title.element().querySelector('strong')).not.toBeNull();

    // Still in the editor, so the next keystroke goes where the reader is looking.
    expect(document.activeElement?.closest('.cm-content')).not.toBeNull();
  });
});
