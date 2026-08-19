import type { Platform } from '@/lib/editor';

/**
 * Which symbols a shortcut is printed in.
 *
 * Read once, here, because `src/lib` has no browser in it — the same division that has
 * `createDefaultStyles` take its locales as an argument. A constant rather than a function:
 * nobody's keyboard changes shape mid-session, and both the toolbar and the dialog were
 * otherwise asking the same question of `navigator` on every render.
 */
export const PLATFORM: Platform = /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
  ? 'apple'
  : 'other';
