import React from 'react';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ThreatLens UI Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-app text-body flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-danger-soft border border-danger-soft flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-danger animate-bounce" />
          </div>
          <h1 className="text-2xl font-extrabold text-hi mb-2">
            ThreatLens UI Encountered an Issue
          </h1>
          <p className="text-sm text-muted max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred in the security console.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <RefreshCw size={14} /> Reload Console
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <Shield size={14} /> Return to Landing
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
