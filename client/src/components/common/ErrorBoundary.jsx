import { Component } from 'react';
import { ErrorState } from './ErrorState.jsx';

/**
 * Class component is required here — React has no hook equivalent of
 * componentDidCatch/getDerivedStateFromError yet. Wraps each dashboard
 * section so a rendering bug in one widget (e.g. a malformed chart dataset)
 * shows an inline error card instead of taking down the entire dashboard.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="This widget hit an unexpected error."
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
