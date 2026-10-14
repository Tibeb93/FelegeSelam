'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            ያልተጠበቀ ስህተት አጋጥሟል (An error occurred)
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {this.state.error?.message ||
              'ይቅርታ፣ ገጹን በማስኬድ ላይ ሳለን ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            እንደገና ይሞክሩ (Try Again)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
