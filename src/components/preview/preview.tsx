import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Pluggable } from 'unified';

import { containsMath, loadMathPlugin, renderMarkdown } from '@/lib/markdown';
import { DEFAULT_STYLES, toCssVariables, toPageRule } from '@/lib/styles';

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
 * hides everything else by targeting `.styledown-doc`.
 *
 * Turning markdown into a tree is `src/lib`'s job; this component only binds that
 * tree to React, and decides when a document has earned the weight of a typesetter.
 *
 * It carries no layout utilities of its own. The sheet — its width, its margins, its
 * typography — is `src/styles/document.css`, driven by the custom properties set below;
 * M7 exports that same pairing as a standalone file.
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

  // M5 lifts these into state; until then the defaults are the whole story.
  const styles = DEFAULT_STYLES;
  const { size, margins } = styles.page;

  return (
    <>
      {/*
       * The paper. React moves a `<style>` carrying `href` and `precedence` into the
       * document head, which is the one place a page box has to be — and it is where
       * M7's exporter will write the same rule.
       *
       * The `href` has to spell out the setting. React de-duplicates by it, so a fixed
       * string would pin the first rule in place for the life of the page and the paper
       * would quietly stop following the control M5 adds. Nothing else declares `@page`,
       * so `precedence` has nothing to arbitrate here.
       */}
      <style href={`styledown-page-${size}-${margins}`} precedence="document">
        {toPageRule(styles)}
      </style>

      <article className="styledown-doc" style={toCssVariables(styles)}>
        {content}
      </article>
    </>
  );
}
