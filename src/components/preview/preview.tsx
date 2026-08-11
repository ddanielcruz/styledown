import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useMemo } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import { renderMarkdown } from '@/lib/markdown';

interface PreviewProps {
  markdown: string;
}

/**
 * The rendered document, and the only thing that survives into print — `print.css`
 * hides everything else by targeting `.print-root`.
 *
 * Turning markdown into a tree is `src/lib`'s job; this component only binds that
 * tree to React.
 */
export function Preview({ markdown }: PreviewProps) {
  const content = useMemo(
    () => toJsxRuntime(renderMarkdown(markdown), { Fragment, jsx, jsxs }),
    [markdown],
  );

  return <article className="print-root mx-auto max-w-[46rem] px-8 py-10">{content}</article>;
}
