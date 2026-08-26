import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { ACTION_GROUPS, EDITOR_ACTIONS, formatShortcut, INHERITED_SHORTCUTS } from '@/lib/editor';

import { PLATFORM } from './platform';

interface ShortcutsDialogProps {
  onClose: () => void;
}

function Row({ label, binding }: { label: string; binding: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-pretty">{label}</span>
      <Kbd className="shrink-0">{formatShortcut(binding, PLATFORM)}</Kbd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 break-inside-avoid">
      <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
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
                  <Row key={action.id} label={action.label} binding={action.key!} />
                ),
              )}
            </Section>
          ))}

          <Section title="Editing">
            {INHERITED_SHORTCUTS.map((shortcut) => (
              <Row key={shortcut.key} label={shortcut.label} binding={shortcut.key} />
            ))}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
