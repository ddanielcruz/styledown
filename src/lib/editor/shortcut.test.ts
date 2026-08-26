import { describe, expect, it } from 'vitest';

import { formatShortcut } from './shortcut';

describe('writing a shortcut down', () => {
  it('is symbols on a Mac and words everywhere else', () => {
    expect(formatShortcut('Mod-b', 'apple')).toBe('⌘B');
    expect(formatShortcut('Mod-b', 'other')).toBe('Ctrl+B');
  });

  it('keeps the modifiers in the order they are pressed', () => {
    expect(formatShortcut('Mod-Shift-x', 'apple')).toBe('⌘⇧X');
    expect(formatShortcut('Mod-Shift-x', 'other')).toBe('Ctrl+Shift+X');
    expect(formatShortcut('Mod-Alt-1', 'apple')).toBe('⌘⌥1');
    expect(formatShortcut('Mod-Alt-1', 'other')).toBe('Ctrl+Alt+1');
  });

  it('leaves a key that is already a character alone', () => {
    expect(formatShortcut('Mod-Shift-.', 'apple')).toBe('⌘⇧.');
  });

  it('gives the named keys the names people use for them', () => {
    expect(formatShortcut('Escape', 'apple')).toBe('Esc');
    expect(formatShortcut('Alt-ArrowUp', 'apple')).toBe('⌥↑');
    expect(formatShortcut('Alt-ArrowUp', 'other')).toBe('Alt+↑');
    expect(formatShortcut('Enter', 'other')).toBe('Enter');
  });
});
