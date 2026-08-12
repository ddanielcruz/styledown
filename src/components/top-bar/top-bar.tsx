import { Info, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Document actions. M1 has exactly one — printing is the whole point of the product,
 * so it is the first control to exist.
 */
export function TopBar() {
  return (
    <header className="no-print flex h-12 shrink-0 items-center justify-between border-b px-4">
      <span className="text-sm font-medium">Styledown</span>

      <div className="flex items-center gap-3">
        {/*
         * The one thing about the PDF we cannot fix in code, so the remedy is to ask.
         * The line says what to do; the tooltip says why, because an instruction with no
         * reason reads like superstition — and the reason is the interesting part.
         */}
        {/* Base UI keeps the delay on the provider, not the tooltip. Scoped here rather
            than wrapped around the app: this is the only tooltip until M5 needs more. */}
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground hover:text-foreground hidden cursor-help items-center gap-1.5 text-xs transition-colors sm:flex">
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

        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>
    </header>
  );
}
