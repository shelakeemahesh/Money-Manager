import React, { Component } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught rendering error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--surface-2)] text-[var(--text-primary)]">
          <div className="card p-8 max-w-md w-full space-y-4 border border-rose-500/20 bg-[var(--surface)] text-center shadow-lg rounded-xl">
            <div className="mx-auto w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-[var(--text-primary)]">Render Execution Faulted</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                MoneyManager failed to draw this page layout. A component in the view tree crashed.
              </p>
            </div>
            {this.state.error && (
              <div className="text-left bg-[var(--surface-3)] p-3 rounded-lg border border-[var(--border)] max-h-40 overflow-y-auto font-mono text-[10px] text-rose-500">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full btn-brand py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Hard Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
