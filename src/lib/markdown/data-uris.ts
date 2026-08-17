import type { Nodes } from 'hast';

/**
 * Base64 image bytes, held back from the parser and put into the tree afterwards.
 *
 * An image lives in the document, so a document with three screenshots in it is about a
 * megabyte of base64 — and the preview re-renders on every keystroke. Measured against the
 * real pipeline, that is the whole of the typing lag and it is linear in the bytes:
 *
 * ```
 * prose only                    2.1ms
 * one image                   100.5ms
 * two images                  200.1ms
 * three images                300.0ms
 * two images, bytes replaced    1.4ms
 * ```
 *
 * None of that work is useful. The parser walks a quarter of a million characters per image
 * to decide they are one unremarkable link destination, and it reaches the same conclusion
 * on every keystroke. So each URI is swapped for a short token before parsing and put back
 * in the tree afterwards, which is invisible from outside: same markdown in, same tree out.
 *
 * The token is restored in text as well as in attributes, because a data URI can also be
 * *content* — someone documenting the format inside a code fence — and that has to come
 * back exactly as it was typed rather than as a placeholder.
 */

const DATA_URI = /data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+/g;

/**
 * Letters and digits only, and no punctuation. A token has to survive being a link
 * destination *and* being handed to the syntax highlighter, which would split anything
 * that looks like it has structure and leave the halves impossible to put back.
 */
const PREFIX = 'styledownimage';

export interface HeldBytes {
  /** The markdown with every data URI replaced by a token. */
  source: string;
  /** Token to URI. Empty when the document had none, which is nearly all of them. */
  uris: ReadonlyMap<string, string>;
  prefix: string;
}

export function holdDataUris(markdown: string): HeldBytes {
  // One `includes` on documents with no images at all, which is the common case.
  if (!markdown.includes(';base64,')) return { source: markdown, uris: new Map(), prefix: PREFIX };

  // A document that already contains the token gets a longer one, so restoring can never
  // rewrite something the author typed themselves.
  let prefix = PREFIX;
  while (markdown.includes(prefix)) prefix += 'x';

  const tokens = new Map<string, string>();
  const uris = new Map<string, string>();

  const source = markdown.replace(DATA_URI, (uri) => {
    const existing = tokens.get(uri);
    if (existing) return existing;

    // Two images that are the same picture share a token, so the same bytes are carried
    // once rather than twice.
    const token = `${prefix}${tokens.size}`;
    tokens.set(uri, token);
    uris.set(token, uri);

    return token;
  });

  return { source, uris, prefix };
}

export function restoreDataUris(tree: Nodes, { uris, prefix }: HeldBytes): void {
  if (!uris.size) return;

  const restored = (value: string) => {
    let out = value;
    for (const [token, uri] of uris) if (out.includes(token)) out = out.split(token).join(uri);

    return out;
  };

  const visit = (node: Nodes): void => {
    if (node.type === 'text' && node.value.includes(prefix)) node.value = restored(node.value);

    if (node.type === 'element') {
      for (const [name, value] of Object.entries(node.properties)) {
        if (typeof value === 'string' && value.includes(prefix)) {
          node.properties[name] = restored(value);
        }
      }
    }

    if ('children' in node) node.children.forEach(visit);
  };

  visit(tree);
}
