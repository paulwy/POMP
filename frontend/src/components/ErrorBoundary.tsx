import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">出现了一些问题</h2>
              <p className="text-muted-foreground mb-6">
                应用程序遇到了一个错误，请尝试刷新页面或返回首页。
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="bg-muted p-4 rounded-md mb-6 text-left text-sm">
                  <p className="font-mono text-xs text-destructive">{this.state.error.message}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-2 truncate">
                    {this.state.error.stack}
                  </p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button onClick={this.handleGoHome}>
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
