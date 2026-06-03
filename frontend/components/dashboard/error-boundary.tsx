"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard error caught by boundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 border border-red-500/10 rounded-2xl bg-red-950/5 text-center min-h-[220px]">
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-red-400 mb-4 shadow-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white tracking-wide">Widget Error</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-[280px] leading-relaxed font-medium">
            Failed to render this section. Check your internet connection or reload the dashboard.
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            size="sm"
            className="mt-4 border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white h-9 rounded-xl gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reload Widget</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
