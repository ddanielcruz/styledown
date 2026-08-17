import { Button } from '@/components/ui/button';
import type { DocumentStyles } from '@/lib/styles';

import { Preview } from './preview';

interface PreviewPaneProps {
  markdown: string;
  styles: DocumentStyles;
  /** Put the starting document back — the way out of an empty editor. */
  onNew: () => void;
}

/**
 * The document pane: the backdrop the sheet sits on, and what is there when the sheet is not.
 *
 * The backdrop belongs to the pane rather than to the document — the document has to be
 * exportable without it. `@container` lets the sheet ask how much room this pane has and
 * stop drawing itself as a page when the answer is "less than one"; the inset it used to
 * carry came with it.
 *
 * The empty state closes a hole in `docs/DESIGN.md`'s third rule. "No blank canvas" is
 * enforced on the way in — an empty document is never restored — but not during a session,
 * and select-all-delete is two keystrokes. It left a reader looking at nothing with nothing
 * to ask, which is the one state the product is built to avoid.
 *
 * It is `no-print`, and it replaces the sheet rather than covering it: an empty document
 * prints as a blank page, not as a page with an invitation on it.
 */
export function PreviewPane({ markdown, styles, onNew }: PreviewPaneProps) {
  if (!markdown.trim()) {
    return (
      <div className="no-print flex h-full items-center justify-center bg-neutral-100 p-6">
        <div className="max-w-xs space-y-3 text-center">
          <p className="text-sm font-medium">Nothing to show yet</p>
          <p className="text-muted-foreground text-sm text-pretty">
            Whatever you write appears here, already set as a document.
          </p>
          <Button size="sm" variant="outline" onClick={onNew}>
            Start from the sample document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="@container h-full overflow-auto bg-neutral-100">
      <Preview markdown={markdown} styles={styles} />
    </div>
  );
}
