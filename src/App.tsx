import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { Editor } from '@/components/editor/editor';
import { Preview } from '@/components/preview/preview';
import { TopBar } from '@/components/top-bar/top-bar';
import { DEFAULT_DOCUMENT } from '@/lib/document/default-document';

function App() {
  // One useState is enough while the document is the only thing in flight. Styles join
  // it at M5, and that is the point to lift this into a context.
  const [markdown, setMarkdown] = useState(DEFAULT_DOCUMENT);

  return (
    <div className="flex h-svh flex-col">
      <TopBar />

      {/* Sizes are strings on purpose: this library reads a bare number as pixels. */}
      <Group orientation="horizontal" className="app-panels flex-1">
        <Panel defaultSize="45" minSize="25">
          <div className="no-print h-full overflow-auto">
            <Editor value={markdown} onChange={setMarkdown} />
          </div>
        </Panel>

        <Separator className="no-print bg-border hover:bg-ring w-px transition-colors" />

        <Panel defaultSize="55" minSize="25">
          <div className="print-pane h-full overflow-auto bg-white">
            <Preview markdown={markdown} />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

export default App;
