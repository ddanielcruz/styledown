import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { Editor } from '@/components/editor/editor';
import { Preview } from '@/components/preview/preview';
import { StylePanel } from '@/components/style-panel/style-panel';
import { TopBar } from '@/components/top-bar/top-bar';
import { DEFAULT_DOCUMENT } from '@/lib/document/default-document';
import { createDefaultStyles } from '@/lib/styles';

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_DOCUMENT);
  // Two direct children read this and one writes it, which is a prop each way — a context
  // for that is ceremony. M6 gives it a hook when it also has to be persisted.
  const [styles, setStyles] = useState(() => createDefaultStyles(navigator.languages));
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="flex h-svh flex-col">
      <TopBar panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((open) => !open)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sizes are strings on purpose: this library reads a bare number as pixels. */}
        <Group orientation="horizontal" className="app-panels flex-1">
          <Panel defaultSize="50" minSize="25">
            <div className="no-print h-full overflow-auto">
              <Editor value={markdown} onChange={setMarkdown} />
            </div>
          </Panel>

          <Separator className="no-print bg-border hover:bg-ring w-px transition-colors" />

          <Panel defaultSize="50" minSize="25">
            {/* The backdrop the sheet sits on. It is the pane's, not the document's — the
                document has to be exportable without it. `@container` lets the sheet ask how
                much room this pane has, and stop drawing itself as a page when the answer is
                "less than one"; the inset it used to carry came with it. */}
            <div className="@container h-full overflow-auto bg-neutral-100">
              <Preview markdown={markdown} styles={styles} />
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
