import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Preview } from './preview';

describe('Preview', () => {
  it('renders headings as headings, not as text that looks like one', () => {
    render(<Preview markdown="# Title" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
  });

  it('renders lists as lists', () => {
    render(<Preview markdown={'- one\n- two'} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders links that actually point somewhere', () => {
    render(<Preview markdown="[Styledown](https://example.com)" />);

    expect(screen.getByRole('link', { name: 'Styledown' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('updates when the markdown changes', () => {
    const { rerender } = render(<Preview markdown="# Before" />);
    expect(screen.getByRole('heading', { name: 'Before' })).toBeInTheDocument();

    rerender(<Preview markdown="# After" />);

    expect(screen.getByRole('heading', { name: 'After' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Before' })).not.toBeInTheDocument();
  });

  it('renders empty markdown without crashing', () => {
    expect(() => render(<Preview markdown="" />)).not.toThrow();
  });
});
