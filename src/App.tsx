import { useCallback, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { EditorPane } from '@/components/editor/editor-pane';
import { PreviewPane } from '@/components/preview/preview-pane';
import { StylePanel } from '@/components/style-panel/style-panel';
import { TopBar } from '@/components/top-bar/top-bar';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { DEFAULT_DOCUMENT } from '@/lib/document/default-document';

function App() {
  // The document and its styles are one saved thing, so one hook owns both. Everything
  // that reads them is still one level down — a context for that is still ceremony.
  const { content, setContent, styles, setStyles, saved } = usePersistedState();
  const [panelOpen, setPanelOpen] = useState(true);

  // Asked for from the toolbar and from the empty document, which are the same request
  // arriving from the two places a reader can be when they have nothing to write on.
  const startFresh = useCallback(() => setContent(DEFAULT_DOCUMENT), [setContent]);

  return (
    <div className="flex h-svh flex-col">
      {/* First in the DOM and invisible until it is focused. The editor is one enormous
          focus stop between the toolbar and everything after it, and a keyboard reader who
          came to read rather than to write should not have to cross it. */}
      <a
        href="#document"
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

      <main className="flex flex-1 overflow-hidden">
        {/* Sizes are strings on purpose: this library reads a bare number as pixels. */}
        <Group orientation="horizontal" className="flex-1">
          <Panel defaultSize="50" minSize="25">
            <EditorPane value={content} onChange={setContent} saved={saved} />
          </Panel>

          {/* The library ships this as a focusable `separator` that arrow keys resize. What
              it cannot supply is what it separates. */}
          <Separator
            aria-label="Resize the source and the document"
            className="no-print bg-border hover:bg-ring w-px transition-colors"
          />

          <Panel defaultSize="50" minSize="25">
            <section
              id="document"
              tabIndex={-1}
              aria-label="Document"
              className="h-full outline-none"
            >
              <PreviewPane markdown={content} styles={styles} onNew={startFresh} />
            </section>
          </Panel>
        </Group>

        {/* Outside the group, and a fixed width: nobody resizes a settings panel, and a
            drag handle that earns nothing is still a drag handle to maintain. Closing it
            is how a narrow screen gets back the room to draw a whole page. */}
        {panelOpen && <StylePanel styles={styles} onChange={setStyles} />}
      </main>
    </div>
  );
}

export default App;
