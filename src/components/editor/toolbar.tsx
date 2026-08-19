import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Keyboard,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  SquareCode,
  Strikethrough,
  TextQuote,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { Kbd } from '@/components/ui/kbd';
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@/components/ui/toolbar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ACTION_GROUPS,
  EDITOR_ACTIONS,
  formatShortcut,
  type ActionGroup,
  type ActionId,
} from '@/lib/editor';

import { PLATFORM } from './platform';
import { ShortcutsDialog } from './shortcuts-dialog';

interface EditorToolbarProps {
  /** False until the editor's own chunk has landed and there is a view to act on. */
  ready: boolean;
  onAction: (id: ActionId) => void;
  onImages: (files: File[]) => void;
}

/**
 * One icon per action, and the compiler refuses the file when an action has none — which is
 * the whole reason the table is a table.
 */
const ICONS: Record<ActionId, LucideIcon> = {
  bold: Bold,
  italic: Italic,
  strikethrough: Strikethrough,
  code: Code,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  bullet: List,
  ordered: ListOrdered,
  task: ListTodo,
  quote: TextQuote,
  link: Link,
  codeBlock: SquareCode,
  rule: Minus,
};

/**
 * The button's name, and its key where it has one.
 *
 * The name is on the button as well as in here, because a tooltip is not an accessible name
 * — it is what a pointer gets, and the two have to say the same thing. `Kbd` styles itself
 * for a tooltip's dark popup already; that styling has been sitting in `tooltip.tsx` since
 * the registry wrote it, waiting for something with a shortcut in it.
 */
function Labelled({
  label,
  binding,
  children,
}: {
  label: string;
  binding?: string;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      {/* Below, because the bar sits at the top of the pane and a tooltip above it lands
          on the document actions in the header. */}
      <TooltipContent side="bottom" className="no-print">
        {label}
        {binding && <Kbd>{formatShortcut(binding, PLATFORM)}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The formatting bar.
 *
 * Two decisions carry it. It is **one tab stop**, not fifteen — `role="toolbar"` with the
 * arrow keys moving between the buttons, on the same reasoning that put the skip link in
 * M10: a keyboard reader who came to read should not have to cross the entire control
 * surface to reach the document. And a click **never takes the focus out of the editor**, so
 * the selection the button is about to act on is still there when it acts, and the reader is
 * still typing where they were afterwards.
 *
 * On a narrow screen it becomes one row that scrolls sideways rather than wrapping to three,
 * which is what every editor on a phone does — the earlier project hid it entirely below
 * 768px, on the one device with no drag-and-drop and an awkward paste, which left nothing
 * there at all.
 *
 * No pressed state. Showing whether the cursor is inside bold means inspecting the syntax
 * tree on every selection change, and it is deferred deliberately rather than overlooked.
 */
export function EditorToolbar({ ready, onAction, onImages }: EditorToolbarProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [showingShortcuts, setShowingShortcuts] = useState(false);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    // Cleared so the same file can be chosen twice — an input whose value has not changed
    // fires no second `change`.
    event.target.value = '';

    if (files.length) onImages(files);
  }

  const buttonsIn = (group: ActionGroup) =>
    EDITOR_ACTIONS.filter((action) => action.group === group).map((action) => {
      const Icon = ICONS[action.id];

      return (
        <Labelled key={action.id} label={action.label} binding={action.key}>
          <ToolbarButton
            aria-label={action.label}
            disabled={!ready}
            // The editor keeps the focus it already has, so the selection survives the click.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onAction(action.id)}
          >
            <Icon />
          </ToolbarButton>
        </Labelled>
      );
    });

  return (
    <div className="no-print shrink-0 border-b">
      <TooltipProvider delay={400}>
        <Toolbar aria-label="Formatting" className="gap-0 px-2 py-1.5">
          {/* The half that scrolls. Everything in it is still a `Toolbar.Button`, so the
              arrow keys reach whatever the strip has pushed out of sight. */}
          <div className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {ACTION_GROUPS.map((group, index) => (
              <ToolbarGroup key={group.id} aria-label={group.label} className="shrink-0">
                {index > 0 && <ToolbarSeparator />}
                {buttonsIn(group.id)}

                {/* Beside the link and the code block, because it is a third thing a reader
                    puts into a document rather than a thing they do to what is there. */}
                {group.id === 'insert' && (
                  <Labelled label="Image">
                    <ToolbarButton
                      aria-label="Image"
                      disabled={!ready}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => fileInput.current?.click()}
                    >
                      <ImagePlus />
                    </ToolbarButton>
                  </Labelled>
                )}
              </ToolbarGroup>
            ))}
          </div>

          {/* Pinned, outside the strip. It is the way out of not knowing what the rest of
              the bar does, so scrolled off the end is the one place it must never be. */}
          <ToolbarSeparator />

          <Labelled label="Keyboard shortcuts">
            <ToolbarButton
              aria-label="Keyboard shortcuts"
              className="shrink-0"
              onClick={() => setShowingShortcuts(true)}
            >
              <Keyboard />
            </ToolbarButton>
          </Labelled>
        </Toolbar>
      </TooltipProvider>

      {/* Out of the tab order and out of the accessibility tree: the button beside it is the
          control, and a second stop that opens the same picker is noise. */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFiles}
      />

      {showingShortcuts && <ShortcutsDialog onClose={() => setShowingShortcuts(false)} />}
    </div>
  );
}
