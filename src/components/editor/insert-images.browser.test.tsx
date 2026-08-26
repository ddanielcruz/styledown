import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import App from '@/App';

/**
 * `src/lib/images/encode.ts` opens by saying it is the one part of `src/lib` that cannot be
 * unit tested: it is `createImageBitmap`, a canvas, and an encoder, none of which jsdom has,
 * so a test there would assert on a mock of the thing being tested. Its own comment says it
 * is verified in a browser instead. This is that, automated — and until now it was the
 * largest piece of the app with no coverage of any kind.
 *
 * What it claims, and what is checked here: an image is redrawn no larger than 1600px on its
 * long edge, and it is re-encoded rather than stored as it arrived, because a phone
 * photograph is four megabytes and the whole document has to fit in five.
 */

/** A PNG, made here rather than fetched: bigger than `MAX_EDGE`, and flat enough to shrink. */
async function widePng(): Promise<File> {
  const canvas = document.createElement('canvas');

  canvas.width = 2400;
  canvas.height = 1200;

  const context = canvas.getContext('2d')!;

  // A gradient rather than a fill: a single flat colour compresses to almost nothing in
  // every format, which would make the size comparison prove nothing.
  const gradient = context.createLinearGradient(0, 0, 2400, 1200);

  gradient.addColorStop(0, '#1d4ed8');
  gradient.addColorStop(1, '#f59e0b');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 2400, 1200);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

  return new File([blob!], 'wide photo.png', { type: 'image/png' });
}

describe('an image chosen from the toolbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('arrives downscaled, re-encoded, and named after its file', async () => {
    await page.viewport(1280, 800);

    render(<App />);

    // Enabled, not merely present: the toolbar is in the first chunk and the editor is in
    // the second, and there is nothing to insert into until the second one lands.
    await expect
      .element(page.getByRole('button', { name: 'Image' }))
      .toHaveAttribute('aria-disabled', 'false');

    // The input is deliberately `aria-hidden` — the button beside it is the control, and the
    // picker it opens is the browser's own, which no test can drive. Choosing the file is
    // what the picker would have done.
    const picker = document.querySelector<HTMLInputElement>(
      'input[type="file"][accept="image/*"]',
    )!;
    const file = await widePng();
    const transfer = new DataTransfer();

    transfer.items.add(file);
    picker.files = transfer.files;
    picker.dispatchEvent(new Event('change', { bubbles: true }));

    const image = page.getByRole('img', { name: 'wide photo' });

    await expect.element(image).toBeVisible();

    const element = image.element() as HTMLImageElement;

    await expect.poll(() => element.complete && element.naturalWidth > 0).toBe(true);

    // MAX_EDGE. A 2400px image had to be redrawn to get here.
    expect(element.naturalWidth).toBeLessThanOrEqual(1600);

    // Re-encoded, not passed through: WebP where the engine can write one, JPEG where it
    // cannot and the pixels turned out opaque. Either way, not the PNG that went in.
    expect(element.src.startsWith('data:image/')).toBe(true);
    expect(element.src).not.toContain('data:image/png');

    // And the point of all of it — smaller than what the reader handed us.
    const stored = Math.floor((element.src.length - element.src.indexOf(',') - 1) * 0.75);
    expect(stored).toBeLessThan(file.size);
  });
});
