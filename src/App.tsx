import { useCallback, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { EditorPane } from '@/components/editor/editor-pane';
import { PreviewPane } from '@/components/preview/preview-pane';
import { StylePanel } from '@/components/style-panel/style-panel';
import { TopBar } from '@/components/top-bar/top-bar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { roomForThePanel, useNarrowScreen } from '@/hooks/use-narrow-screen';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { DEFAULT_DOCUMENT } from '@/lib/document/default-document';
import { cn } from '@/lib/utils';

type View = 'source' | 'document';

function App() {
  // The document and its styles are one saved thing, so one hook owns both. Everything
  // that reads them is still one level down — a context for that is still ceremony.
  const { content, setContent, styles, setStyles, saved } = usePersistedState();
  const narrow = useNarrowScreen();

  // Open by default, but only where opening it still leaves the document room to be read.
  const [panelOpen, setPanelOpen] = useState(roomForThePanel);
  const [view, setView] = useState<View>('source');

  const startFresh = useCallback(() => setContent(DEFAULT_DOCUMENT), [setContent]);

  const editor = <EditorPane value={content} onChange={setContent} saved={saved} />;
  const preview = <PreviewPane markdown={content} styles={styles} onNew={startFresh} />;

  /** The document, wherever it currently is: a landmark, and the skip link's target. */
  const documentRegion = (className?: string) => (
    <section
      id="document"
      tabIndex={-1}
      aria-label="Document"
      className={cn('h-full outline-none', className)}
    >
      {preview}
    </section>
  );

  const panel = <StylePanel styles={styles} onChange={setStyles} />;

  return (
    <div className="flex h-svh flex-col">
      {/* First in the DOM and invisible until it is focused. The editor is one enormous
          focus stop between the toolbar and everything after it, and a keyboard reader who
          came to read rather than to write should not have to cross it. On a narrow screen
          it also has to *reveal* the document, which is behind a switch rather than beside
          the source — a skip link to something hidden is a skip link that does nothing. */}
      <a
        href="#document"
        onClick={() => {
          setView('document');
          if (narrow) setPanelOpen(false);
        }}
        className="ring-ring bg-background sr-only z-50 rounded-md px-3 py-2 text-sm font-medium ring-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to the document
      </a>

      <TopBar
        content={content}
        styles={styles}
        onOpen={setContent}
        onNew={startFresh}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((open) => !open)}
      />

      {/* One pane at a time, and a way to say which. Hidden while the settings have the
          pane, because then neither of the two is what is showing. */}
      {narrow && !panelOpen && (
        <div className="no-print flex shrink-0 justify-center border-b px-4 py-1.5">
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full max-w-xs *:flex-1"
            value={[view]}
            onValueChange={([next]) => next && setView(next as View)}
          >
            <ToggleGroupItem value="source">Source</ToggleGroupItem>
            <ToggleGroupItem value="document">Document</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        {narrow ? (
          /*
           * Neither pane is ever unmounted, only hidden. Unmounting the editor would lose
           * the cursor and the undo history on every switch; unmounting the document would
           * mean printing from the Source tab prints nothing. `print.css` already forces
           * every ancestor of `.styledown-doc` back to `display: block`, so the hidden one
           * still reaches the paper — which is checked by printing, not by reading this.
           */
          <>
            <div className={cn('h-full flex-1', (panelOpen || view !== 'source') && 'hidden')}>
              {editor}
            </div>

            {documentRegion(cn('flex-1', (panelOpen || view !== 'document') && 'hidden'))}

            {panelOpen && panel}
          </>
        ) : (
          <>
            {/* Sizes are strings on purpose: this library reads a bare number as pixels. */}
            <Group orientation="horizontal" className="flex-1">
              <Panel defaultSize="50" minSize="25">
                {editor}
              </Panel>

              {/* The library ships this as a focusable `separator` that arrow keys resize.
                  What it cannot supply is what it separates. */}
              <Separator
                aria-label="Resize the source and the document"
                className="no-print bg-border hover:bg-ring w-px transition-colors"
              />

              <Panel defaultSize="50" minSize="25">
                {documentRegion()}
              </Panel>
            </Group>

            {/* Outside the group, and a fixed width: nobody resizes a settings panel, and a
                drag handle that earns nothing is still a drag handle to maintain. Closing it
                is how a narrow screen gets back the room to draw a whole page. */}
            {panelOpen && panel}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
