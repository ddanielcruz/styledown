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
