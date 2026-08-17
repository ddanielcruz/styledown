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

/**
 * How far below fully opaque a pixel has to be before it counts as transparent.
 *
 * Not `255`, because a canvas does not hand back exactly what was drawn on it. Measured in
 * WebKit: filling a rectangle with an opaque gradient leaves a sixth of the pixels at alpha
 * 254, which is its dithering and is invisible. Firefox returns 255 everywhere. Anything a
 * reader would call transparency is nowhere near this line.
 */
const OPAQUE = 250;

/**
 * Whether the image we drew has any transparency to lose.
 *
 * Asked of the pixels rather than of the file's type, which is a bad proxy: a screenshot
 * arrives as a PNG and is almost always opaque, and on a browser with no WebP encoder the
 * difference between believing the type and reading the alpha channel is more than a
 * megabyte. Measured at a few milliseconds for a 1600px image, and only reached by the
 * browsers that need the answer.
 */
function isOpaque(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const { data } = context.getImageData(0, 0, width, height);

    for (let index = 3; index < data.length; index += 4) if (data[index]! < OPAQUE) return false;

    return true;
  } catch {
    // Nothing here can taint a canvas — the bytes came from the reader's own file — but a
    // refusal must cost the image its size rather than cost the reader their image.
    return false;
  }
}

async function encoded(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
): Promise<Blob | undefined> {
  const webp = await toBlob(canvas, 'image/webp', QUALITY);
  if (!webp) return undefined;

  // A browser that cannot encode WebP does not say so — it quietly hands back a PNG, and a
  // downscaled photograph as PNG is several times the JPEG it could have been. Measured in
  // a WebKit build with no WebP encoder: the same screenshot is 1.8MB as PNG against a few
  // tens of kilobytes either way with a lossy format, which is the difference between a
  // handful of images fitting in the browser's five megabytes and one of them not.
  if (webp.type === 'image/webp' || !isOpaque(context, canvas.width, canvas.height)) return webp;

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

    return await encoded(canvas, context);
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
