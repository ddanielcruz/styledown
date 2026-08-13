import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from '@/App';

/**
 * Rendered through the app rather than on its own, because the decision worth covering is
 * not that a button changes some state — it is that touching a control here changes the
 * document over there. A panel tested against its own `onChange` would pass with the
 * preview unplugged.
 *
 * Paper is the setting worth most of the attention: it leaves `src/lib` by two different
 * functions — one for the sheet on screen, one for the page box that decides the PDF — and
 * a document that shows Legal and prints A4 is worse than one that cannot change at all.
 */
describe('StylePanel', () => {
  const sheet = () => document.querySelector<HTMLElement>('.styledown-doc')!;
  const pageRules = () =>
    [...document.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .filter((css) => css.includes('@page'));

  it('repapers the preview and the page box together', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Legal' }));

    expect(sheet().dataset.pageSize).toBe('legal');
    expect(sheet().style.getPropertyValue('--doc-page-width')).toBe('216mm');
    expect(pageRules()).toEqual(['@page { size: Legal; margin: 22mm; }']);
  });

  it('leaves one page box behind, however often the paper changes', async () => {
    render(<App />);

    // Walking back to a size already chosen is what broke: a stylesheet React had hoisted
    // and never removed kept applying, so the PDF came out on the paper before last.
    await userEvent.click(screen.getByRole('button', { name: 'Legal' }));
    await userEvent.click(screen.getByRole('button', { name: 'A4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Legal' }));

    expect(pageRules()).toEqual(['@page { size: Legal; margin: 22mm; }']);
  });

  it('insets the sheet by the margin it will print with', async () => {
    render(<App />);

    // The paper is set too, so the assertion does not rest on which one the test
    // environment's locale happens to start on.
    await userEvent.click(screen.getByRole('button', { name: 'A4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wide' }));

    expect(sheet().style.getPropertyValue('--doc-page-margin')).toBe('32mm');
    expect(pageRules()).toEqual(['@page { size: A4; margin: 32mm; }']);
  });

  it('recolours the document from a swatch', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Rose' }));

    expect(sheet().style.getPropertyValue('--doc-accent')).toBe('#be123c');
  });

  it('restyles the document from the font menu', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Document font' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Lora' }));

    expect(sheet().style.getPropertyValue('--doc-font-body')).toContain('Lora');
  });

  it('swaps the code theme for exactly one stylesheet', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Code theme' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Nord' }));

    // Nord's own background. Six stylesheets all define `.hljs`, so the count is half the
    // assertion: the wrong number of them is the bug that made this an inline style.
    const themes = [...document.querySelectorAll('style')].filter((style) =>
      style.textContent?.includes('.hljs{'),
    );

    expect(themes).toHaveLength(1);
    expect(themes[0]!.textContent).toContain('#2e3440');
  });

  it('resizes the document from the slider', async () => {
    render(<App />);

    /*
     * Reached through the range input rather than by role, and the reason is worth
     * recording. shadcn's wrapper asks for `thumbAlignment="edge"`, so Base UI positions
     * the thumb by measuring the track — and in jsdom every `getBoundingClientRect()` is
     * zeroes, so that measurement divides 0 by 0, comes back `NaN`, and the thumb keeps
     * its `visibility: hidden`. An invisible element is correctly absent from the
     * accessibility tree, so `getByRole('slider')` finds nothing. The input underneath is
     * the real control, and in a browser it is exactly what the thumb wraps.
     */
    const slider = document.querySelector<HTMLInputElement>('input[type="range"]')!;
    fireEvent.change(slider, { target: { value: '19' } });

    // The panel unwraps what Base UI hands back: a slider that was given an array reports
    // one, and passing the bare number straight through would set `19px` to `NaN`.
    expect(sheet().style.getPropertyValue('--doc-font-size')).toBe('19px');
  });
});
