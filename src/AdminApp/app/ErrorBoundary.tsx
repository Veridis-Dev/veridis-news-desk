import { Component, type ErrorInfo, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { EmptyState } from '../design-system/EmptyState';
import { VeridisButton } from '../design-system/VeridisButton';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { if (import.meta.env.DEV) console.error(error, info); }
  render() {
    return this.state.failed ? <EmptyState title={__('Something interrupted your desk', 'veridis-news-desk')} description={__('Reload the page to start again.', 'veridis-news-desk')} action={<VeridisButton onClick={() => window.location.reload()}>{__('Reload page', 'veridis-news-desk')}</VeridisButton>} /> : this.props.children;
  }
}
