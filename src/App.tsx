import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { EditorPane } from '@/components/editor/editor-pane';
import { Preview } from '@/components/preview/preview';
import { StylePanel } from '@/components/style-panel/style-panel';
import { TopBar } from '@/components/top-bar/top-bar';
import { usePersistedState } from '@/hooks/use-persisted-state';

function App() {
  // The document and its styles are one saved thing, so one hook owns both. Everything
  // that reads them is still one level down — a context for that is still ceremony.
  const { content, setContent, styles, setStyles, saved } = usePersistedState();
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="flex h-svh flex-col">
      <TopBar
        content={content}
        styles={styles}
        onOpen={setContent}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((open) => !open)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sizes are strings on purpose: this library reads a bare number as pixels. */}
        <Group orientation="horizontal" className="app-panels flex-1">
          <Panel defaultSize="50" minSize="25">
            <EditorPane value={content} onChange={setContent} saved={saved} />
          </Panel>

          <Separator className="no-print bg-border hover:bg-ring w-px transition-colors" />

          <Panel defaultSize="50" minSize="25">
            {/* The backdrop the sheet sits on. It is the pane's, not the document's — the
                document has to be exportable without it. `@container` lets the sheet ask how
                much room this pane has, and stop drawing itself as a page when the answer is
                "less than one"; the inset it used to carry came with it. */}
            <div className="@container h-full overflow-auto bg-neutral-100">
              <Preview markdown={content} styles={styles} />
            </div>
          </Panel>
        </Group>

        {/* Outside the group, and a fixed width: nobody resizes a settings panel, and a
            drag handle that earns nothing is still a drag handle to maintain. Closing it
            is how a narrow screen gets back the room to draw a whole page. */}
        {panelOpen && <StylePanel styles={styles} onChange={setStyles} />}
      </div>
    </div>
  );
}

export default App;
