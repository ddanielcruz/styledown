import { Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
         * The one thing about the PDF we cannot fix in code. Chrome prints the page URL
         * and the date into the margins by default, and neither CSS nor `window.print()`
         * can reach that switch — `@page` margin boxes have never been implemented in
         * Blink either, so we cannot draw our own page numbers in their place. Asking is
         * the whole of the remedy, so it is worth one quiet line.
         */}
        <p className="text-muted-foreground hidden text-xs sm:block">
          Turn off <span className="font-medium">Headers and footers</span> in the print dialog
        </p>

        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>
    </header>
  );
}
