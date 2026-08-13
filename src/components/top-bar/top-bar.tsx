import { Download, FolderOpen, Info, PanelRight, Printer } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fileNameOf, titleOf } from '@/lib/document/title';

import { downloadText } from './download';

interface TopBarProps {
  content: string;
  onOpen: (content: string) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
}

/**
 * Document actions. Printing is the whole point of the product, so it is the one that
 * looks like a button; the rest of the bar is about getting out of the document's way.
 *
 * Open and Download are how work gets in and out of a browser that stores everything
 * locally — the answer to "what happens to my document if I clear my browsing data" has to
 * be something the reader can act on, and a `.md` file on their disk is that answer.
 *
 * Open replaces the document outright, with no confirmation. Picking a file in the OS
 * dialog is already a deliberate act, and CodeMirror's own undo still reaches back over it.
 */
export function TopBar({ content, onOpen, panelOpen, onTogglePanel }: TopBarProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Clearing it is what lets the same file be opened twice: an input whose value has not
    // changed fires no second `change`, so re-opening a file you just edited elsewhere
    // would silently do nothing.
    event.target.value = '';

    if (file) onOpen(await file.text());
  }

  return (
    <header className="no-print flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Styledown</span>

        <span className="bg-border h-4 w-px" />

        {/* Out of the tab order and out of the accessibility tree: the button beside it is
            the control, and a second stop that opens the same dialog is noise. */}
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt,text/markdown"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={handleFile}
        />

        <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}>
          <FolderOpen />
          Open
        </Button>

        {/* The name is decided at the click rather than held in state, so it always
            matches the heading the document currently has. */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => downloadText(fileNameOf(titleOf(content)), content, 'text/markdown')}
        >
          <Download />
          Download
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {/*
         * The one thing about the PDF we cannot fix in code, so the remedy is to ask.
         * The line says what to do; the tooltip says why, because an instruction with no
         * reason reads like superstition — and the reason is the interesting part.
         */}
        {/* Base UI keeps the delay on the provider, not the tooltip. Scoped here rather
            than wrapped around the app: this is still the only tooltip in it. */}
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground hover:text-foreground hidden cursor-help items-center gap-1.5 text-xs transition-colors lg:flex">
              <Info className="size-3.5" />
              Turn off <span className="font-medium">Headers and footers</span> when you print
            </TooltipTrigger>

            {/* Portalled to the body, so it sits outside the header's `no-print` and needs
                its own: focusing the trigger opens it, and the reader may then hit Cmd+P. */}
            <TooltipContent side="bottom" className="no-print max-w-xs text-pretty">
              Chrome prints the page URL and today&rsquo;s date into the margins of every page.
              Nothing on the page can switch that off — the checkbox in the print dialog is the only
              way to it, and a document reads like a document without it.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          size="sm"
          variant={panelOpen ? 'secondary' : 'ghost'}
          aria-pressed={panelOpen}
          aria-label="Style settings"
          onClick={onTogglePanel}
        >
          <PanelRight />
        </Button>

        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>
    </header>
  );
}
