import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import type { VariantProps } from 'class-variance-authority';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Written by hand rather than pulled from the registry, which has no `toolbar` — the
 * primitive underneath is Base UI's, and it is the reason this exists at all: a toolbar is
 * one tab stop with arrow keys inside it, and rolling that by hand is how it ends up being
 * fourteen.
 */

function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function ToolbarButton({
  className,
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: ToolbarPrimitive.Button.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function ToolbarSeparator({ className, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn('bg-border mx-1 h-4 w-px shrink-0', className)}
      {...props}
    />
  );
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator };
