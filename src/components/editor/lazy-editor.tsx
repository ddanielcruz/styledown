import { lazy, Suspense } from 'react';

import type { EditorProps } from './editor';

/**
 * The editor, out of the first chunk.
 *
 * CodeMirror and its parsers are 598KB of the bundle — 40% of it, and more than everything
 * the document itself is rendered by put together. A third of that is the JavaScript, CSS
 * and HTML grammars that `@codemirror/lang-markdown` pulls in statically to colour inline
 * HTML in the source, which is markup this product deliberately drops rather than renders.
 *
 * None of it is on the path to the thing the reader came for. `docs/DESIGN.md` opens with
 * the promise that the first paint is a document that already looks good, so the document
 * should not be waiting on the editor to parse. Split, the two arrive in the order they
 * matter: the page paints, and the editor lands a moment later — its chunk is requested on
 * the first render, so nothing has to remember to prefetch it.
 */
const Editor = lazy(() => import('./editor').then((module) => ({ default: module.Editor })));

/**
 * Lines rather than a spinner, and deliberately not animated: on a warm connection this
 * shows for a tenth of a second, and a pulse that brief reads as a flicker in the corner of
 * the eye. Still, faint shapes where the text is about to be beat an empty half-screen that
 * looks like something failed.
 */
function EditorSkeleton() {
  return (
    <div className="space-y-3 p-3" aria-hidden>
      {['w-2/5', 'w-11/12', 'w-4/5', 'w-1/3'].map((width) => (
        <div key={width} className={`bg-muted h-3 rounded-sm ${width}`} />
      ))}
    </div>
  );
}

export function LazyEditor(props: EditorProps) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor {...props} />
    </Suspense>
  );
}
