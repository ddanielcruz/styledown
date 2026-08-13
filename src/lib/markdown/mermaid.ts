import type { Element, ElementContent, Root } from 'hast';
import type { Pluggable } from 'unified';

/** What `remark-rehype` leaves a ` ```mermaid ` fence as, before anything touches it. */
const MERMAID = 'language-mermaid';

/** The `<code>` inside this node, if this node is a mermaid fence. */
function fencedDiagram(node: ElementContent): Element | undefined {
  if (node.type !== 'element' || node.tagName !== 'pre') return undefined;

  for (const child of node.children) {
    if (child.type !== 'element' || child.tagName !== 'code') continue;

    const classes = child.properties.className;
    if (Array.isArray(classes) && classes.includes(MERMAID)) return child;
  }

  return undefined;
}

function sourceOf(code: Element): string {
  return code.children.map((child) => (child.type === 'text' ? child.value : '')).join('');
}

/**
 * Every diagram in the document, in the order they appear.
 *
 * Asked of the tree rather than the source text, for the reason `containsMath` is: by the
 * time the tree exists, the fence has already been recognised as a fence, so no `?```?`
 * inside a paragraph or a nested block can be mistaken for one.
 */
export function mermaidSources(tree: Root): string[] {
  const sources: string[] = [];

  const collect = (node: Root | Element): void => {
    for (const child of node.children) {
      if (child.type !== 'element') continue;

      const code = fencedDiagram(child);
      if (code) sources.push(sourceOf(code));
      else collect(child);
    }
  };

  collect(tree);

  return sources;
}

/** The drawing, in the box the stylesheet knows how to place. */
const diagram = (drawing: Element): Element => ({
  type: 'element',
  tagName: 'div',
  properties: { className: ['diagram'] },
  children: [drawing],
});

/**
 * Swap each fence for the diagram that was drawn from it.
 *
 * A fence with nothing in the map is left exactly as it was, which covers both the diagram
 * mermaid has not drawn yet and the one it cannot draw at all. That is deliberate: a broken
 * diagram ships as its own source, on screen, on paper and in the exported file, and needs
 * no code of its own to do it.
 */
export function rehypeMermaid(diagrams: ReadonlyMap<string, Element>): Pluggable {
  return function attach() {
    return function transform(node: Root | Element): void {
      node.children.forEach((child, index) => {
        if (child.type !== 'element') return;

        const code = fencedDiagram(child);
        if (!code) return transform(child);

        const drawing = diagrams.get(sourceOf(code));
        if (drawing) node.children[index] = diagram(drawing);
      });
    };
  };
}

export type DiagramRenderer = (source: string, fontFamily: string) => Promise<Element | undefined>;

/** Mermaid scopes each diagram's own `<style>` by id, so two of them must never collide. */
let drawn = 0;

/**
 * Mermaid, on demand.
 *
 * It is by some distance the heaviest thing this project could depend on — more than KaTeX
 * and the editor together — and most documents contain no diagram at all, so it stays out of
 * every chunk until one does. Mermaid then splits itself further: only the diagram types the
 * document actually uses are fetched.
 *
 * The drawing comes back as a string of SVG and is parsed into real tree nodes, which is
 * what lets one tree serve both consumers — React renders the nodes as elements and the
 * exporter serialises them, and neither has to be handed raw markup it must trust.
 *
 * `fontFamily` is the resolved stack rather than `var(--doc-font-body)`, because mermaid
 * measures label text in a throwaway element outside the document, where a custom property
 * set on the article does not resolve — and text measured in one face and drawn in another
 * overflows the box drawn for it.
 */
export async function loadDiagramRenderer(): Promise<DiagramRenderer> {
  const [{ default: mermaid }, { fromHtmlIsomorphic }] = await Promise.all([
    import('mermaid'),
    import('hast-util-from-html-isomorphic'),
  ]);

  return async (source, fontFamily) => {
    mermaid.initialize({
      startOnLoad: false,
      // Greys and hairlines. It prints legibly without colour, and it never argues with
      // whatever accent the reader has chosen.
      theme: 'neutral',
      // Labels as SVG text, not HTML in a `foreignObject`: the diagram is serialised into
      // an exported file and printed, and both are simpler when it is SVG all the way down.
      htmlLabels: false,
      // The document is someone else's text. Mermaid sanitises labels at this level.
      securityLevel: 'strict',
      fontFamily,
    });

    const id = `diagram-${++drawn}`;

    try {
      const { svg } = await mermaid.render(id, source);
      const [drawing] = fromHtmlIsomorphic(svg, { fragment: true }).children;

      return drawing?.type === 'element' && drawing.tagName === 'svg' ? drawing : undefined;
    } catch {
      // A diagram that will not parse is not an error to report — it is a fence the reader
      // is still in the middle of writing.
      return undefined;
    } finally {
      // Mermaid measures inside a throwaway element it appends to the body, and removes it
      // itself once the render completes. A render that threw does not get that far —
      // measured: one orphan per broken fence, and a fence is broken on most keystrokes.
      document.getElementById(`d${id}`)?.remove();
    }
  };
}
