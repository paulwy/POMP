import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, ref) => {
    const [showScrollbar, setShowScrollbar] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={() => setShowScrollbar(true)}
        onMouseLeave={() => setShowScrollbar(false)}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full overflow-auto",
            !showScrollbar && "scrollbar-hide"
          )}
        >
          {children}
        </div>
        {showScrollbar && orientation !== "horizontal" && (
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-transparent">
            <div className="h-full bg-black/10 rounded-full" />
          </div>
        )}
      </div>
    );
  }
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
