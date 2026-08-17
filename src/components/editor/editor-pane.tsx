import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';

import { LazyEditor } from './lazy-editor';

interface EditorPaneProps {
  value: string;
  onChange: (value: string) => void;
  /** False once the browser has refused to keep the document. */
  saved: boolean;
}

/** Long enough to read twice, short enough that it is gone by the time you look back. */
const NOTICE_DURATION = 8000;

/**
 * The source pane: the editor, and the one place it can say something.
 *
 * Everything the editor needs to report is a refusal — an image too large to keep, a file
 * the browser cannot decode — and a refusal has to be visible where the action happened,
 * not in a corner of the screen the reader is not looking at.
 *
 * The unsaved warning is the exception that does not clear itself. Until images existed
 * nothing could make a document large enough for `localStorage` to refuse it, so the failed
 * write was swallowed; now that it can happen, a document that has silently stopped being
 * saved is the worst thing this app could do to someone, and it stays on screen until it
 * stops being true.
 */
export function EditorPane({ value, onChange, saved }: EditorPaneProps) {
  const [notice, setNotice] = useState<{ text: string; key: number }>();
  const [dropping, setDropping] = useState(false);
  const nextKey = useRef(0);

  // Keyed rather than compared: pasting the same oversized image twice is two refusals, and
  // a message that never changes would never restart its own clock.
  const notify = useCallback((text: string) => setNotice({ text, key: nextKey.current++ }), []);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(undefined), NOTICE_DURATION);

    return () => clearTimeout(timer);
  }, [notice]);

  // `dragover` has to be cancelled for a drop to be allowed at all, but only for files:
  // cancelling it for everything breaks dragging a selection around inside the editor.
  const carriesFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

  // Not "this document is too large": the origin can be full of somebody else's data, and
  // a message that names the wrong cause sends the reader off to fix the wrong thing.
  const message = saved
    ? notice?.text
    : 'The browser has no room left — changes are not being saved. Download the .md to keep them.';

  return (
    <div
      className="no-print relative flex h-full flex-col"
      onDragOver={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(event) => {
        // Moving between children fires `dragleave` on the one being left, so the flag is
        // only cleared when the pointer has actually left the pane.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false);
      }}
      onDrop={() => setDropping(false)}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <LazyEditor value={value} onChange={onChange} onNotice={notify} />
      </div>

      {/* `output` is announced politely without having to be asked, which is what a refusal
          wants: read out in a gap rather than over whatever is being typed. */}
      {message && (
        <output className="text-muted-foreground block border-t px-3 py-2 text-xs text-pretty">
          {!saved && <AlertTriangle className="-mt-0.5 mr-1.5 inline size-3.5 text-amber-600" />}
          {message}
        </output>
      )}

      {/* Nothing here may take the drop it is advertising, hence `pointer-events-none`. */}
      {dropping && (
        <div className="border-ring/60 bg-ring/5 pointer-events-none absolute inset-2 rounded-md border-2 border-dashed" />
      )}
    </div>
  );
}
