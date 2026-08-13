import type { Element, Root } from 'hast';

import { toDataUrl } from '../images/encode';

/**
 * The images the exported file would otherwise have to fetch.
 *
 * A pasted image is already a data URI, so this is about the other kind: a URL the author
 * typed. Left alone it is the one thing in an exported document that still reaches for a
 * server — the file opens without a network and shows a broken image, and it keeps working
 * only for as long as someone else's host does.
 *
 * Best effort, and it has to be. Reading a cross-origin image's bytes needs CORS, which
 * plenty of hosts do not send, so an image that will not come back keeps its URL — which is
 * exactly what it had before, so nothing is ever made worse by trying. The preview has
 * already requested these same URLs to draw them, so no host learns anything new here.
 */

/** Long enough for a slow host, short enough that a dead one does not hold up a download. */
const TIMEOUT = 8000;

/** Past this, the URL is the better answer: nobody wants a 14MB file emailed to them. */
const MAX_BYTES = 5_000_000;

const isRemote = (src: unknown): src is string => typeof src === 'string' && /^https?:/i.test(src);

function collect(node: Root | Element, found: Element[]): void {
  for (const child of node.children) {
    if (child.type !== 'element') continue;

    if (child.tagName === 'img' && isRemote(child.properties.src)) found.push(child);
    else collect(child, found);
  }
}

async function fetched(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!response.ok) return undefined;

    const blob = await response.blob();

    return blob.size <= MAX_BYTES ? await toDataUrl(blob) : undefined;
  } catch {
    // Refused, offline, timed out, or blocked by CORS. All the same answer.
    return undefined;
  }
}

/** Swaps in the bytes wherever they can be had. Mutates the tree it is given. */
export async function inlineRemoteImages(tree: Root): Promise<void> {
  const images: Element[] = [];
  collect(tree, images);

  // One fetch per URL rather than per image, so a document that shows the same picture
  // twice does not carry it twice.
  const urls = new Set(images.map((image) => String(image.properties.src)));
  const inlined = new Map(
    await Promise.all([...urls].map(async (url) => [url, await fetched(url)] as const)),
  );

  for (const image of images) {
    const dataUrl = inlined.get(String(image.properties.src));
    if (dataUrl) image.properties.src = dataUrl;
  }
}
