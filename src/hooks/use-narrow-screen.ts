import { useSyncExternalStore } from 'react';

/**
 * Whether the screen is too small to show the source and the document at once.
 *
 * Tailwind's `md`, read from the other side. The question is phrased as *narrow* rather
 * than *wide* deliberately: `vitest.setup.ts` stubs `matchMedia` to report no match for
 * everything, on the rule that no component may depend on a query being true in a test — so
 * `false` has to be the ordinary two-pane layout, and the exception has to be what is asked
 * for.
 *
 * A `matchMedia` list rather than a resize listener: the browser already knows when the
 * answer changes, and it only says so when it does.
 */
const NARROW = '(max-width: 47.99rem)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(NARROW);

  media.addEventListener('change', onChange);

  return () => media.removeEventListener('change', onChange);
}

const isNarrow = () => window.matchMedia(NARROW).matches;

export function useNarrowScreen(): boolean {
  return useSyncExternalStore(subscribe, isNarrow, () => false);
}
