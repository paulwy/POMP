import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

const useAccordionContext = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  }, []);

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { openItems } = useAccordionContext();
  const isOpen = openItems.has(value);

  return (
    <div
      ref={ref}
      className={cn("border-b border-border", className)}
      {...props}
      data-state={isOpen ? "open" : "closed"}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ isOpen?: boolean; value?: string }>, {
            isOpen,
            value,
          });
        }
        return child;
      })}
    </div>
  );
});
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  value?: string;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, isOpen, value, ...props }, ref) => {
    const { toggleItem } = useAccordionContext();

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        onClick={() => value && toggleItem(value)}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, isOpen, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
