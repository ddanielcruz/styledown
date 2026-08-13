import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App';

/**
 * The two ways a document leaves, driven through the app and caught at the last moment
 * before the browser would have written a file.
 *
 * jsdom cannot fetch the typefaces out of the bundle, so the HTML that comes out here is
 * the one a reader gets when a face fails to load — which is the behaviour we want anyway:
 * a missing font must cost the file its typeface, not cost the reader their document.
 */
describe('download', () => {
  let saved: { name: string; blob: Blob } | undefined;
  let offered: Blob | undefined;

  beforeEach(() => {
    localStorage.clear();
    saved = undefined;

    // jsdom implements neither, and `downloadText` is built on both.
    Object.assign(URL, {
      createObjectURL: (blob: Blob) => {
        offered = blob;

        return 'blob:styledown';
      },
      revokeObjectURL: () => {},
    });

    // Caught here rather than let through: a jsdom anchor click is a navigation it has no
    // way to perform, and the download name is only readable from the anchor itself.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function (this: HTMLAnchorElement) {
        saved = { name: this.download, blob: offered! };
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Opened from the keyboard, which is a real way to use a menu and the only one that
   * works here: Base UI opens on `mousedown`, and jsdom's synthetic `click` arrives as a
   * second toggle that shuts it again before anything can be read off it.
   */
  const download = async (item: RegExp) => {
    const user = userEvent.setup();

    screen.getByRole('button', { name: /Download/ }).focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: item }));
  };

  it('hands back the markdown that was typed', async () => {
    render(<App />);

    await download(/Markdown/);

    expect(saved?.name).toBe('styledown.md');
    expect(await saved!.blob.text()).toContain('# Styledown');
  });

  it('hands back a whole web page for the same document', async () => {
    render(<App />);

    await download(/Web page/);

    expect(saved?.name).toBe('styledown.html');

    const html = await saved!.blob.text();

    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<h1 id="styledown">Styledown</h1>');
    // The claim: a file that fetches nothing, from anyone.
    expect(html).not.toMatch(/<link|<script/i);
  });
});
