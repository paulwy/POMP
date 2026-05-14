import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </>
  );
};

interface SheetContentProps {
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  onClose?: () => void;
  open?: boolean;
}

const SheetContent: React.FC<SheetContentProps> = ({
  children,
  className,
  side = "right",
  onClose,
  open = false,
}) => {
  const sideClasses = {
    top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
    bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
    right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
  };

  return (
    <div
      className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        sideClasses[side],
        className
      )}
      data-state={open ? "open" : "closed"}
    >
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <div className="flex justify-between items-center">
          {children}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
};

SheetContent.displayName = "SheetContent";

const SheetHeader: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
    >
      {children}
    </div>
  );
};

SheetHeader.displayName = "SheetHeader";

const SheetFooter: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
    >
      {children}
    </div>
  );
};

SheetFooter.displayName = "SheetFooter";

const SheetTitle: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
    >
      {children}
    </h2>
  );
};

SheetTitle.displayName = "SheetTitle";

const SheetDescription: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
    >
      {children}
    </p>
  );
};

SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
