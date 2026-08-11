import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Pluggable } from 'unified';

import { containsMath, loadMathPlugin, renderMarkdown } from '@/lib/markdown';

interface PreviewProps {
  markdown: string;
}

/** KaTeX and its stylesheet, fetched together so maths never paints half-styled. */
async function loadMath(): Promise<Pluggable> {
  const [plugin] = await Promise.all([loadMathPlugin(), import('katex/dist/katex.min.css')]);

  return plugin;
}

/**
 * The rendered document, and the only thing that survives into print — `print.css`
 * hides everything else by targeting `.print-root`.
 *
 * Turning markdown into a tree is `src/lib`'s job; this component only binds that
 * tree to React, and decides when a document has earned the weight of a typesetter.
 */
export function Preview({ markdown }: PreviewProps) {
  const [math, setMath] = useState<Pluggable>();
  const tree = useMemo(() => renderMarkdown(markdown, math), [markdown, math]);

  useEffect(() => {
    // Once loaded there is nothing left to detect: the tree comes back typeset, and
    // `math` short-circuits this before the walk.
    if (math || !containsMath(tree)) return;

    let active = true;
    void loadMath().then((plugin) => {
      // Wrapped in a callback because plugins are functions, and `setState` would
      // otherwise take this one for an updater and call it.
      if (active) setMath(() => plugin);
    });

    return () => {
      active = false;
    };
  }, [math, tree]);

  const content = useMemo(() => toJsxRuntime(tree, { Fragment, jsx, jsxs }), [tree]);

  return <article className="print-root mx-auto max-w-184 px-8 py-10">{content}</article>;
}
