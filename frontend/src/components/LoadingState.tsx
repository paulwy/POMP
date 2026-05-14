import React from 'react';
import { Loader2, AlertCircle, Search, Database, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  text = '加载中...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary`} />
      {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  iconClassName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  action,
  iconClassName = 'h-12 w-12 text-muted-foreground'
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 rounded-full bg-muted mb-4">
      <Icon className={iconClassName} />
    </div>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
    )}
    {action && (
      <Button onClick={action.onClick} variant="outline">
        {action.label}
      </Button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: string | Error;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '加载失败',
  description = '请检查网络连接，然后重试',
  error,
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 rounded-full bg-destructive/10 mb-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
    </div>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-2">
      {description}
    </p>
    {error && process.env.NODE_ENV === 'development' && (
      <p className="text-xs text-destructive mb-4 font-mono">
        {typeof error === 'string' ? error : error.message}
      </p>
    )}
    {onRetry && (
      <Button onClick={onRetry}>
        重试
      </Button>
    )}
  </div>
);

export const NoDataState: React.FC<{ 
  message?: string; 
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ 
  message = '暂无数据', 
  icon: Icon = Database 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
    <Icon className="h-12 w-12 mb-4 opacity-30" />
    <p className="text-lg">{message}</p>
  </div>
);

export const NoContentState: React.FC<{ 
  title?: string;
  description?: string;
}> = ({ 
  title = '暂无内容',
  description = '此分类下还没有内容'
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 rounded-full bg-muted mb-4">
      <FolderOpen className="h-12 w-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
