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
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer />
        Print
      </Button>
    </header>
  );
}
