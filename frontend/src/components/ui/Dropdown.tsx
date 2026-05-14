import * as React from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
}

export function Dropdown({ trigger, children, align = 'end' }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div className={`absolute ${align === 'end' ? 'right-0' : 'left-0'} top-full mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50`}>
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownItem({ children, onClick, className = '' }: DropdownItemProps) {
  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
