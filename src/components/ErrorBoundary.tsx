import React from 'react';

/**
 * ErrorBoundary
 * -----------------
 * A robust error boundary for a React app. It follows the recommended
 * pattern from the React docs and adds a few extra niceties:
 *   - Optional `fallback` component that can be supplied by the parent.
 *   - An optional `onError` callback to surface the error to an external
 *     monitoring service (e.g. Sentry, LogRocket).
 *   - A “Reset” button when a fallback is shown so the user can attempt to
 *     recover without reloading the page.
 *
 * The component exposes `fallback`, `onError` and the usual React children.
 */

export interface ErrorBoundaryProps {
  children?: React.ReactNode;
  /**
   * A component to render when an error occurs. If omitted, a default UI is
   * shown that includes a button to reset the boundary.
   */
  fallback?: React.ReactNode;
  /**
   * Callback invoked with the caught error and error info. Useful for sending
   * errors to an external monitoring service.
   */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.resetBoundary = this.resetBoundary.bind(this);
  }

  static getDerivedStateFromError(_: Error): Partial<ErrorBoundaryState> {
    // When an error is thrown, set the state so the next render shows the
    // fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { onError } = this.props;
    if (onError) {
      try {
        onError(error, info);
      } catch (_) {
        // Prevent any error from bubbling out of the error boundary.
      }
    }
    console.error('Uncaught error:', error, info);
  }

  /**
   * Reset the error state so children are re-rendered. This method is bound
   * to the component instance and can be passed to child components.
   */
  resetBoundary(): void {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      // If a custom fallback is provided, use it.
      if (fallback !== undefined) {
        return fallback;
      }
      // Default fallback UI with a reset button.
      return (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <button onClick={this.resetBoundary} type="button">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
