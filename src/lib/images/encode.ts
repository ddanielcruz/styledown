/**
 * An image, small enough to keep.
 *
 * Nothing is uploaded, so whatever comes in has to fit in a document that has to fit in
 * `localStorage`. A photograph off a phone is four megabytes and the browser gives us five
 * in total, so an image is downscaled and re-encoded on the way in rather than stored as it
 * arrived — and the numbers are not close enough for that to be a judgement call.
 *
 * This is the one part of `src/lib` that cannot be unit tested: jsdom has no image decoder
 * and no encoder, so a test here would assert on a mock of the thing being tested. It is
 * verified in a browser instead, the same call `mermaid.ts` makes.
 */

/**
 * The long edge, in pixels. The print measure is about 172mm — call it 6.8 inches — so this
 * is roughly 230dpi across a full-width image, which is more than a laser printer resolves
 * and well past what a screen will ever ask for.
 */
const MAX_EDGE = 1600;

const QUALITY = 0.9;

/** Rasterising these loses the thing that makes them worth having: vectors, and motion. */
const PASS_THROUGH = new Set(['image/svg+xml', 'image/gif']);

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function encoded(canvas: HTMLCanvasElement, sourceType: string): Promise<Blob | undefined> {
  const webp = await toBlob(canvas, 'image/webp', QUALITY);
  if (!webp) return undefined;

  // A browser that cannot encode WebP does not say so — it quietly hands back a PNG. A
  // downscaled photograph as PNG is several times the JPEG it arrived as, so a source with
  // no transparency to lose is asked for one instead.
  if (webp.type === 'image/webp' || sourceType !== 'image/jpeg') return webp;

  return (await toBlob(canvas, 'image/jpeg', QUALITY)) ?? webp;
}

/** The image, redrawn no larger than `MAX_EDGE`. `undefined` means it would not decode. */
async function shrink(file: Blob): Promise<Blob | undefined> {
  let bitmap: ImageBitmap;

  try {
    // Without this a photograph taken in portrait arrives on its side: the camera writes
    // the rotation into EXIF rather than into the pixels, and the default throws it away.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // HEIC dragged out of Photos, most likely — a file no browser here can draw either.
    return undefined;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return await encoded(canvas, file.type);
  } finally {
    bitmap.close();
  }
}

export function toDataUrl(blob: Blob): Promise<string | undefined> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(blob);
  });
}

/**
 * The file as a data URI, downscaled if that makes it smaller. `undefined` means the
 * browser could not read it — which also means it could not have drawn it.
 */
export async function encodeImage(file: Blob): Promise<string | undefined> {
  if (PASS_THROUGH.has(file.type)) return toDataUrl(file);

  const shrunk = await shrink(file);
  if (!shrunk) return undefined;

  // Small PNGs and anything already smaller than we would make it keep their own bytes:
  // re-encoding one buys nothing and costs a generation of quality.
  return toDataUrl(shrunk.size < file.size ? shrunk : file);
}
