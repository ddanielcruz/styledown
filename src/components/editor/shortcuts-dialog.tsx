import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import {
  ACTION_GROUPS,
  EDITOR_ACTIONS,
  formatShortcut,
  INHERITED_SHORTCUTS,
  type Platform,
} from '@/lib/editor';

interface ShortcutsDialogProps {
  onClose: () => void;
}

/**
 * Which symbols to print. Read here rather than in `src/lib`, which has no browser in it —
 * the same division `createDefaultStyles(locales)` already makes.
 */
const platform = (): Platform =>
  /mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? 'apple' : 'other';

function Row({ label, binding, on }: { label: string; binding: string; on: Platform }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <Kbd className="shrink-0">{formatShortcut(binding, on)}</Kbd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-1.5 text-xs font-medium tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  );
}

/**
 * What the keys are.
 *
 * Read off the same table the keymap and the toolbar are, so it cannot advertise a key that
 * nothing runs — and it lists what the editor already did before this milestone as well as
 * what was added, because Enter continuing a list is the one nobody would guess is there and
 * Escape releasing Tab is the one a keyboard reader most needs.
 *
 * Rendered only while it is open, so the dialog's own mount is what moves focus into it and
 * closing returns focus to the button that asked — the same shape as the top bar's.
 */
export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const on = platform();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Everything the source pane answers to. Formatting works on the selection, or on the line
            the cursor is on.
          </DialogDescription>
        </DialogHeader>

        <div className="columns-1 gap-8 text-sm sm:columns-2">
          {ACTION_GROUPS.map((group) => (
            <Section key={group.id} title={group.label}>
              {EDITOR_ACTIONS.filter((action) => action.group === group.id && action.key).map(
                (action) => (
                  <Row key={action.id} label={action.label} binding={action.key!} on={on} />
                ),
              )}
            </Section>
          ))}

          <Section title="Editing">
            {INHERITED_SHORTCUTS.map((shortcut) => (
              <Row key={shortcut.key} label={shortcut.label} binding={shortcut.key} on={on} />
            ))}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
