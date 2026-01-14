import React, { Component, ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { Button } from "./ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps> {
  render() {
    return (
      <ErrorBoundary>
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

// Functional wrapper for easier use
export function withRouteErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  routeName?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <RouteErrorBoundary routeName={routeName}>
        <Component {...props} />
      </RouteErrorBoundary>
    );
  };
}

// Error fallback component for routes
export function RouteErrorFallback({ routeName, onReset }: { routeName?: string; onReset?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
        <h1 className="text-3xl font-bold text-destructive">
          {routeName ? `${routeName} Error` : "Page Error"}
        </h1>
        <p className="text-muted-foreground">
          Something went wrong while loading this page. Please try again or return to the dashboard.
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => {
              if (onReset) {
                onReset();
              } else {
                window.location.reload();
              }
            }}
            variant="default"
          >
            Try Again
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
