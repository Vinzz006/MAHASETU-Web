import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MahaSetu Global ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
          <div className="max-w-lg w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Application Error</h1>
                <p className="text-xs text-slate-400">MAHASETU Resilience Guard</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              We encountered an unexpected presentation error while rendering this page.
              Your data and session remain secure.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono text-red-300 mb-6 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                type="button"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleHome}
                type="button"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-700 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
