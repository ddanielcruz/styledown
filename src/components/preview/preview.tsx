import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Pluggable } from 'unified';

import { containsMath, loadMathPlugin, renderMarkdown } from '@/lib/markdown';
import { toCssVariables, toPageRule, type DocumentStyles } from '@/lib/styles';

import { CODE_THEME_CSS } from './code-themes';

interface PreviewProps {
  markdown: string;
  styles: DocumentStyles;
}

/** KaTeX and its stylesheet, fetched together so maths never paints half-styled. */
async function loadMath(): Promise<Pluggable> {
  const [plugin] = await Promise.all([loadMathPlugin(), import('katex/dist/katex.min.css')]);

  return plugin;
}

/**
 * The rendered document, and the only thing that survives into print — `print.css`
 * hides everything else by targeting `.styledown-doc`.
 *
 * Turning markdown into a tree is `src/lib`'s job; this component only binds that
 * tree to React, and decides when a document has earned the weight of a typesetter.
 *
 * It carries no layout utilities of its own. The sheet — its width, its margins, its
 * typography — is `src/styles/document.css`, driven by the custom properties set below.
 * `export-html.ts` writes that same pairing out as a standalone file.
 */
export function Preview({ markdown, styles }: PreviewProps) {
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

  const { size } = styles.page;

  return (
    <>
      {/*
       * The code theme and the page box, each as one element whose text is swapped.
       *
       * Neither carries `href` and `precedence`, which is what would hand it to React to
       * hoist into the head — and hoisted stylesheets are keyed by `href` and never taken
       * out again. Encoding the setting in the `href` stops a stale rule being pinned in
       * place, but it does not stop them piling up, and among equal `@page` rules the
       * winner is the one inserted *last*. Go A4 → Letter → A4 and the second A4 reuses
       * the element already sitting above Letter, so the document prints Letter while the
       * panel says A4. Measured, not theorised: the PDF came out at 15mm with Wide
       * selected. One element per concern cannot get that wrong.
       *
       * A page box does not have to be in the head to apply, and this one is not; what it
       * cannot be is *inside* the article, where `document.css` gives `> :first-child` no
       * top margin and a `<style>` in that slot would absorb the rule and leave the real
       * first element pushed down the page.
       */}
      <style>{CODE_THEME_CSS[styles.codeTheme]}</style>
      <style>{toPageRule(styles)}</style>

      {/* The paper size is on the element as well as in the variables: the sheet only
          wears its frame when the pane can show a whole page, and a container query can
          read neither a custom property nor a page box. */}
      <article className="styledown-doc" data-page-size={size} style={toCssVariables(styles)}>
        {content}
      </article>
    </>
  );
}
