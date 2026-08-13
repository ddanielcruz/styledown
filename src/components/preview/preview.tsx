import type { Element } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Pluggable } from 'unified';

import {
  containsMath,
  loadDiagramRenderer,
  loadMathPlugin,
  mermaidSources,
  rehypeMermaid,
  renderMarkdown,
} from '@/lib/markdown';
import { FONT_STACKS, toCssVariables, toPageRule, type DocumentStyles } from '@/lib/styles';

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
 * Every diagram drawn so far, and every one already tried.
 *
 * `attempted` holds the failures as well as the successes, so a diagram that will not parse
 * is drawn once and then left as the source fence it already is. The font is part of the
 * record because mermaid sizes each box to the text measured in the face it drew it in — a
 * different body font is a different drawing, not the same one restyled.
 */
interface Drawings {
  fontFamily: string;
  diagrams: ReadonlyMap<string, Element>;
  attempted: ReadonlySet<string>;
}

const NONE: Drawings = { fontFamily: '', diagrams: new Map(), attempted: new Set() };

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
  const [drawings, setDrawings] = useState<Drawings>(NONE);

  const fontFamily = FONT_STACKS[styles.bodyFont];

  // The document before anything that arrives late has touched it. It is what the two
  // effects below ask their questions of — a typeset formula no longer looks like maths,
  // and a drawn diagram no longer looks like a fence.
  const plain = useMemo(() => renderMarkdown(markdown), [markdown]);

  useEffect(() => {
    if (math || !containsMath(plain)) return;

    let active = true;
    void loadMath().then((plugin) => {
      // Wrapped in a callback because plugins are functions, and `setState` would
      // otherwise take this one for an updater and call it.
      if (active) setMath(() => plugin);
    });

    return () => {
      active = false;
    };
  }, [math, plain]);

  const drawn = drawings.fontFamily === fontFamily ? drawings : NONE;

  useEffect(() => {
    const sources = mermaidSources(plain);
    const pending = sources.filter((source) => !drawn.attempted.has(source));
    if (!pending.length) return;

    let active = true;

    void (async () => {
      const draw = await loadDiagramRenderer();
      const results = await Promise.all(pending.map((source) => draw(source, fontFamily)));
      // Abandoned because the document moved on. Nothing is recorded, so whatever survived
      // the edit is simply drawn again — which is what keeps the preview honest about the
      // source as it is now rather than as it was three keystrokes ago.
      if (!active) return;

      setDrawings((previous) => {
        const base = previous.fontFamily === fontFamily ? previous : NONE;
        const diagrams = new Map(base.diagrams);
        const attempted = new Set(base.attempted);

        pending.forEach((source, index) => {
          attempted.add(source);
          const drawing = results[index];
          if (drawing) diagrams.set(source, drawing);
        });

        // Forget the versions the document has moved past. Writing one diagram walks
        // through dozens of them, and each one that drew left a whole SVG behind.
        const current = new Set(sources);
        for (const source of attempted) if (!current.has(source)) attempted.delete(source);
        for (const source of diagrams.keys()) if (!current.has(source)) diagrams.delete(source);

        return { fontFamily, diagrams, attempted };
      });
    })();

    return () => {
      active = false;
    };
  }, [drawn, fontFamily, plain]);

  const tree = useMemo(() => {
    const plugins: Pluggable[] = [];
    if (math) plugins.push(math);
    if (drawn.diagrams.size) plugins.push(rehypeMermaid(drawn.diagrams));

    // A document with neither is rendered exactly once, which is nearly all of them.
    return plugins.length ? renderMarkdown(markdown, plugins) : plain;
  }, [drawn, markdown, math, plain]);

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
