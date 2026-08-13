import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_STYLES } from '@/lib/styles';

import { Preview } from './preview';

/** The styles are App's to hold; every test here is about what the markdown turns into. */
const preview = (markdown: string) => <Preview markdown={markdown} styles={DEFAULT_STYLES} />;

describe('Preview', () => {
  it('renders headings as headings, not as text that looks like one', () => {
    render(preview('# Title'));

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
  });

  it('renders lists as lists', () => {
    render(preview('- one\n- two'));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders links that actually point somewhere', () => {
    render(preview('[Styledown](https://example.com)'));

    expect(screen.getByRole('link', { name: 'Styledown' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('updates when the markdown changes', () => {
    const { rerender } = render(preview('# Before'));
    expect(screen.getByRole('heading', { name: 'Before' })).toBeInTheDocument();

    rerender(preview('# After'));

    expect(screen.getByRole('heading', { name: 'After' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Before' })).not.toBeInTheDocument();
  });

  it('renders empty markdown without crashing', () => {
    expect(() => render(preview(''))).not.toThrow();
  });

  it('typesets maths once KaTeX has loaded, showing the source until then', async () => {
    const { container } = render(preview('$x = 1$'));

    // The decision this component makes: render immediately with the source visible,
    // fetch the typesetter, render again. Nobody waits on a spinner for a quarter of a
    // megabyte, and a document with no maths never fetches it at all.
    expect(container.querySelector('.katex')).toBeNull();
    expect(container.querySelector('.language-math')).not.toBeNull();

    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull());
  });
});
