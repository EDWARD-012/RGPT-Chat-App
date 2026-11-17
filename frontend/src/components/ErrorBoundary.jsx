import { Component } from 'react';

// Without a boundary, one render error unmounts the whole app and leaves an
// empty dark page. Show the error and a way out instead.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('RGPT hit a render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-xl font-bold">Kuch gadbad ho gayi.</p>
        <p className="max-w-md text-sm text-muted">This page hit an error. Reloading usually fixes it.</p>
        <code className="max-w-md break-words font-mono text-xs text-muted">
          {String(this.state.error?.message || this.state.error)}
        </code>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="sticker rounded-xl border-2 border-ink bg-haldi px-4 py-2 font-display text-sm font-bold text-ink"
          >
            Reload
          </button>
          <a href="/" className="rounded-xl border-2 border-ink px-4 py-2 font-display text-sm font-bold dark:border-ink-4">
            Home
          </a>
        </div>
      </div>
    );
  }
}
