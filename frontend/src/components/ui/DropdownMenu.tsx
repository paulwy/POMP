import * as React from 'react';
import { ChevronRight } from 'lucide-react';

const DropdownMenuContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within DropdownMenu');
  }
  return context;
}

export function DropdownMenu({ children, open, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DropdownMenuContext.Provider value={{ open: currentOpen, onOpenChange: handleOpenChange }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild = false }: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { open, onOpenChange } = useDropdownMenu();

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      onClick: () => onOpenChange(!open),
    });
  }

  return (
    <button
      type="button"
      onClick={() => onOpenChange(!open)}
      className="flex items-center gap-2"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useDropdownMenu();

  return (
    <>
      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50 ${className}`}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </>
  );
}

export function DropdownMenuItem({ children, onClick, className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const { onOpenChange } = useDropdownMenu();

  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        onOpenChange(false);
      }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-border my-1" />;
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
      {children}
    </div>
  );
}

export function DropdownMenuSubmenu({ children, label }: {
  children: React.ReactNode;
  label: React.ReactNode;
}) {
  const [subOpen, setSubOpen] = React.useState(false);
  const { onOpenChange } = useDropdownMenu();

  return (
    <div className="relative group">
      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
        onClick={() => setSubOpen(!subOpen)}
        onMouseEnter={() => setSubOpen(true)}
        onMouseLeave={() => setSubOpen(false)}
      >
        {label}
        <ChevronRight className="h-4 w-4" />
      </button>
      {subOpen && (
        <div className="absolute left-full top-0 ml-1 w-56 bg-background border border-border rounded-md shadow-lg z-50">
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
}