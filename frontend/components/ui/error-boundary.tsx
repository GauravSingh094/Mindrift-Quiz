"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Unhandled Exception captured in boundary [${this.props.context || "Global"}]`, error, {
      componentStack: errorInfo.componentStack
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-md w-full text-center space-y-6 relative z-10">
            <div className="flex justify-center">
              <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-2xl text-purple-400">
                <ShieldAlert className="h-7 w-7 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Component Interface Interrupted
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                An unhandled dynamic exception occurred during render execution.
              </p>
              {this.state.error && (
                <div className="bg-black/60 border border-zinc-900 p-3 rounded-xl text-left max-h-32 overflow-y-auto mt-4">
                  <p className="text-[10px] font-mono text-purple-300 font-bold break-all leading-tight">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={this.handleReset}
              className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-9 px-6 rounded-xl text-xs gap-1.5 uppercase shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Recover Session
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Named wrappers for specific boundaries:
export function WidgetErrorBoundary({ children, context = "Widget" }: { children: ReactNode; context?: string }) {
  const widgetFallback = (
    <div className="p-4 border border-zinc-900 bg-zinc-950/20 rounded-2xl flex items-center gap-3">
      <ShieldAlert className="h-4.5 w-4.5 text-purple-400 shrink-0" />
      <div>
        <span className="text-[9px] font-black text-white uppercase tracking-wider font-mono block">Widget Failure</span>
        <span className="text-[8px] text-zinc-550 uppercase tracking-widest font-bold">Failed to load telemetry widget.</span>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={widgetFallback} context={context}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
