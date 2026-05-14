import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface HelpTooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export default function HelpTooltip({ content, placement = 'top' }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center p-1 rounded-full hover:bg-muted transition-colors" title="帮助">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side={placement}>
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function HelpSection({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-medium text-foreground">{title}</h3>
        <HelpTooltip content={description} />
      </div>
      {children}
    </div>
  );
}