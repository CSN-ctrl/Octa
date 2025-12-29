import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Log detailed error information for debugging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.error("Error details:", JSON.stringify(errorDetails, null, 2));
    
    // Try to send to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const errorMessage = error?.message || "An unexpected error occurred";
      
      // Try to provide more helpful error messages
      let helpfulMessage = errorMessage;
      if (errorMessage.includes("Cannot read property") || errorMessage.includes("Cannot read properties")) {
        helpfulMessage = "A component tried to access a property that doesn't exist. This is usually a bug in the code.";
      } else if (errorMessage.includes("is not a function")) {
        helpfulMessage = "A function was called that doesn't exist. This is usually a bug in the code.";
      } else if (errorMessage.includes("Cannot access") || errorMessage.includes("before initialization")) {
        helpfulMessage = "A variable was accessed before it was initialized. This is usually a bug in the code.";
      }
      
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-3xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground">
              {helpfulMessage}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
              >
                Try Again
              </button>
            </div>
            {error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                  {error.name && (
                    <p className="text-xs text-muted-foreground">
                      Error Type: {error.name}
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

