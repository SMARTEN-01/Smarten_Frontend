// ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    /* console.error("Error caught by boundary:", error, errorInfo); */
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 text-center p-4">
          <h1>Something went wrong.</h1>
          <p>Please try again or refresh the page. Check the console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;