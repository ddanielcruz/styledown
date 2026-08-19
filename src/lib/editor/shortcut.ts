/**
 * A CodeMirror binding as something to print in a tooltip or a dialog.
 *
 * The platform arrives as an argument rather than being read off `navigator`, for the reason
 * `createDefaultStyles(locales)` takes its locales: there is no browser inside `src/lib`, and
 * a function that reaches for one cannot be tested in the runner that keeps this module
 * honest. The component knows which platform it is on; this only knows what that looks like.
 */

export type Platform = 'apple' | 'other';

const MODIFIERS: Record<string, Record<Platform, string>> = {
  Mod: { apple: '⌘', other: 'Ctrl' },
  Shift: { apple: '⇧', other: 'Shift' },
  Alt: { apple: '⌥', other: 'Alt' },
  Ctrl: { apple: '⌃', other: 'Ctrl' },
};

/** The keys whose CodeMirror name is not what anybody calls them. */
const NAMES: Record<string, string> = {
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

export function formatShortcut(binding: string, platform: Platform): string {
  const parts = binding.split('-');
  const key = parts.pop()!;

  const printed = [
    ...parts.map((part) => MODIFIERS[part]?.[platform] ?? part),
    // A bare letter is shown as a capital because that is the key on the keyboard, not
    // because Shift is involved.
    NAMES[key] ?? (key.length === 1 ? key.toUpperCase() : key),
  ];

  // Nothing between them on a Mac, where the glyphs are the convention and a plus sign
  // between two symbols reads as a third symbol.
  return printed.join(platform === 'apple' ? '' : '+');
}
