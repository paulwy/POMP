import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "h-4 w-4 rounded border-input text-primary focus:ring-ring",
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
