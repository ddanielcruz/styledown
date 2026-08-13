import { useCallback, useEffect, useState } from 'react';

import { titleOf } from '@/lib/document/title';
import { loadState, serializeState, type PersistedState } from '@/lib/storage';
import type { DocumentStyles } from '@/lib/styles';

/**
 * The document and its styles, kept across refreshes.
 *
 * Two things are worth knowing about how this behaves. Emptying the editor is saved like
 * any other edit — clearing the page and walking away loses nothing — but an empty
 * document is not restored on the way back in, because an editor with nothing in it and no
 * way to ask for something is the blank canvas the product is built to avoid. That rule
 * lives in `loadState`, so it applies once, at the door.
 *
 * And a reader who has been here before keeps *their* copy of the default document even
 * after we improve ours — the moment it was saved it stopped being our sample and became
 * their draft.
 */

const STORAGE_KEY = 'styledown:state';

/**
 * Long enough that typing is not a write per keystroke, short enough that a crash costs a
 * sentence rather than a paragraph. The window is closed at the other end by the flush.
 */
const SAVE_DELAY = 500;

const APP_NAME = 'Styledown';

/**
 * Storage throws rather than degrading: Safari's private mode refuses writes outright, and
 * a full origin refuses them once the quota is reached. Forgetting the document is bad;
 * taking the editor down with it while the reader is mid-sentence is worse.
 */
function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* no storage, or no room in it */
  }
}

export function usePersistedState() {
  // Read once, on the way in. `navigator.languages` only decides the paper for a reader
  // with nothing stored, which is why the lib takes it as an argument rather than asking.
  const [state, setState] = useState<PersistedState>(() =>
    loadState(readRaw(), navigator.languages),
  );

  useEffect(() => {
    const commit = () => {
      // Chrome offers `document.title` as the filename when you save a PDF, so this is not
      // only the browser tab — it is the name the reader's document ends up on disk under.
      document.title = titleOf(state.content) ?? APP_NAME;
      writeRaw(serializeState(state));
    };

    const timer = setTimeout(commit, SAVE_DELAY);

    // The debounce window is exactly where a closed tab loses work, and `visibilitychange`
    // is the last event a tab reliably gets. `unload` is not: it is ignored under the
    // back-forward cache and unreliable on mobile.
    const flush = () => {
      if (document.visibilityState !== 'hidden') return;
      clearTimeout(timer);
      commit();
    };

    document.addEventListener('visibilitychange', flush);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [state]);

  const setContent = useCallback(
    (content: string) => setState((current) => ({ ...current, content })),
    [],
  );

  const setStyles = useCallback(
    (styles: DocumentStyles) => setState((current) => ({ ...current, styles })),
    [],
  );

  return { content: state.content, setContent, styles: state.styles, setStyles };
}
