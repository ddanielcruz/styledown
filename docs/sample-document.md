# Sample document

A deliberately dense document, kept so each milestone can be checked against something
constant. Paste it into the editor and look at the result — some things (whether the
typography works, whether the PDF paginates) can only be verified by looking.

It is not a style guide and not a test fixture. Tests assert on the tree; this asserts
on nothing, which is the point.

## Prose

Ordinary paragraphs with **strong**, _emphasis_, ~~strikethrough~~, `inline code`, a
[link](https://github.com/ddanielcruz/styledown), and a bare URL like
https://example.com that should still be clickable. Footnotes[^1] hang off the end of
the document rather than interrupting it.

> Blockquotes carry the arguments you are quoting rather than making.
>
> They can run to several paragraphs, and should still read as one block.

[^1]: Like this one, with a link back to where it was cited.

## Lists

1. Ordered lists for steps that happen in an order
2. With a second entry, because a one-item list is a sentence
   - And a nested unordered level
   - Which should indent without drifting

- [x] Task lists render as checkboxes
- [ ] Unchecked ones stay unchecked
- [ ] And none of them are clickable — this is a document, not a form

## Tables

| Page size | Width  | Height | Common where       |
| --------- | ------ | ------ | ------------------ |
| A4        | 210 mm | 297 mm | Most of the world  |
| Letter    | 216 mm | 279 mm | US, Canada, Mexico |
| Legal     | 216 mm | 356 mm | US legal filings   |

Tables are where technical documents most often look bad, so this one has enough
columns to be awkward.

## Code

```ts
export function renderMarkdown(markdown: string, math?: Pluggable): Root {
  const pipeline = math ? processor().use([math]) : processor;

  return pipeline.runSync(pipeline.parse(markdown));
}
```

```python
def paginate(blocks: list[Block], height: float) -> list[Page]:
    """Greedy first pass. Widow and orphan control comes later."""
    pages, current = [], Page()
    for block in blocks:
        if current.remaining < block.height:
            pages.append(current)
            current = Page()
        current.add(block)
    return [*pages, current]
```

```
A fence with no language stays plain, rather than being guessed at.
```

## Maths

Inline maths such as $e^{i\pi} + 1 = 0$ sits on the text baseline, and display maths
stands on its own:

$$
\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2}
$$

Loading it is what proves the lazy path works: KaTeX is fetched only because this
section exists.

## Headings

### Third level

Deep enough to show the scale, and to check that in-document links resolve — for
instance back to [Prose](#prose).

#### Fourth level

Rarely used, still has to look deliberate.

## Pagination

Everything above this line can be judged on screen. Nothing below it can — these are the
cases that only exist once the document is cut into pages, and the only way to check them
is to export a PDF and look at it.

The prose here is filler, but it has to be real filler: the failures are all about where a
break happens to land, so there has to be enough text for a break to land somewhere
awkward. A heading must never be left alone at the foot of a page with its section
starting on the next one. A paragraph must never leave a single line behind, or carry a
single line over. Those two are orphan and widow control, and they are invisible until
they are wrong.

Page boundaries are also where a document stops being a web page. On screen an
overlong table or code block can scroll sideways and no one minds. Paper has no
sideways, so anything that scrolls has to be un-boxed before printing — and if it is
not, the overflow does not warn anybody. It is simply absent from the PDF, and the
reader has no way to know that a line of code ended somewhere other than where it
appears to end.[^2]

### A fence longer than a page

Long enough that it cannot possibly fit, so it has to break rather than be pushed to the
next page and clipped there:

```ts
interface Block {
  readonly kind: 'heading' | 'paragraph' | 'code' | 'table' | 'figure';
  readonly height: number;
  readonly breakInside: 'auto' | 'avoid';
  readonly breakAfter: 'auto' | 'avoid';
}

interface Page {
  readonly blocks: Block[];
  readonly remaining: number;
}

const EMPTY: Page = { blocks: [], remaining: 0 };

function newPage(height: number): Page {
  return { blocks: [], remaining: height };
}

function place(page: Page, block: Block): Page {
  return {
    blocks: [...page.blocks, block],
    remaining: page.remaining - block.height,
  };
}

function fits(page: Page, block: Block): boolean {
  return block.height <= page.remaining;
}

/**
 * A block that refuses to be split, and does not fit what is left of the page, moves to
 * the next one whole. A block that is taller than an entire page has nowhere better to
 * go, so it is split regardless — refusing would loop forever.
 */
function mustMove(page: Page, block: Block, pageHeight: number): boolean {
  if (fits(page, block)) return false;
  if (block.breakInside === 'auto') return false;

  return block.height <= pageHeight;
}

/**
 * A heading is not allowed to be the last thing on a page. If it lands there, it goes
 * over with the section it introduces — which can cascade, so the check runs against the
 * page as it stands rather than against the original sequence.
 */
function stranded(page: Page): boolean {
  const last = page.blocks.at(-1);

  return last?.breakAfter === 'avoid';
}

export function paginate(blocks: Block[], pageHeight: number): Page[] {
  const pages: Page[] = [];
  let current = newPage(pageHeight);

  for (const block of blocks) {
    if (mustMove(current, block, pageHeight) || !fits(current, block)) {
      while (stranded(current)) {
        current = { ...current, blocks: current.blocks.slice(0, -1) };
      }

      pages.push(current);
      current = newPage(pageHeight);
    }

    current = place(current, block);
  }

  return current.blocks.length > 0 ? [...pages, current] : pages;
}

export { EMPTY, type Block, type Page };
```

### A line too wide for the measure

There is no honest way to fit this on a page, so the question is only whether it wraps or
disappears:

```ts
export const UNREASONABLY_LONG_IDENTIFIER =
  createPaginationStrategyForDocumentsThatContainVeryLongLinesOfCodeWhichCannotPossiblyFitWithinTheMeasureOfAnA4PageAtSixteenPixels(
    { orphans: 3, widows: 3 },
  );
```

### A table that crosses a break

Long enough to run off the bottom of a page, which is when the header row has to repeat:

| Setting         | Value              | Applies to       | Notes                                |
| --------------- | ------------------ | ---------------- | ------------------------------------ |
| Page size       | A4                 | `@page`          | Keyword, not a millimetre pair       |
| Page size       | Letter             | `@page`          | 216 × 279 mm                         |
| Page size       | Legal              | `@page`          | 216 × 356 mm                         |
| Margin          | Narrow             | `@page`          | 15 mm on all four edges              |
| Margin          | Normal             | `@page`          | 22 mm, the default                   |
| Margin          | Wide               | `@page`          | 32 mm                                |
| Orphans         | 3                  | Document root    | Inherited by every block container   |
| Widows          | 3                  | Document root    | Inherited the same way               |
| Break inside    | avoid              | `tr`             | A row split in half reads as two     |
| Break inside    | avoid              | `li`             | Short items only; long ones give way |
| Break inside    | avoid              | `img`            | An image halved is an image lost     |
| Break inside    | avoid              | `blockquote`     | Quoted matter reads as one object    |
| Break inside    | avoid              | `pre`            | Until the fence outgrows a page      |
| Break after     | avoid              | `h1`–`h6`        | Never strand a heading               |
| Header group    | table-header-group | `thead`          | Repeats the header on each page      |
| Colour          | exact              | Document root    | Or highlighting prints as grey       |
| Overflow        | visible            | `pre`            | Screen clips it; paper must not      |
| Overflow        | visible            | `.katex-display` | Same, for a long equation            |
| White space     | pre-wrap           | `pre code`       | Wrapping beats truncation            |
| Headers/footers | Off                | Print dialog     | The reader's switch, not ours        |

### An equation wider than the page

Display maths scrolls on screen, which is another way of saying it is clipped on paper
unless something undoes it:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)} = \frac{P(B \mid A)\,P(A)}{\sum_{i=1}^{n} P(B \mid A_i)\,P(A_i)} \quad \text{where} \quad \sum_{i=1}^{n} P(A_i) = 1
$$

### The last section

Deliberately short, and deliberately last: the final page of a document is where a stray
widow or an over-eager break is most obvious, because there is nothing after it to
distract from the mistake.

[^2]:
    Which is the argument for wrapping long code lines in print even though wrapped
    code reads worse than code that does not need to wrap.
