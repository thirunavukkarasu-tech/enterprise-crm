import { Card, CardHeader } from './Card.jsx';
import { ErrorState } from '../common/ErrorState.jsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';

/**
 * Same loading → error → empty → content state machine as
 * `pages/dashboard/components/ChartCard.jsx`. Promoted to `components/ui`
 * here so the Reports module (and any future module) can reuse it without
 * a cross-module import into `pages/dashboard`. The Dashboard's original
 * copy is left as-is rather than refactored to import this one — Dashboard
 * was already reviewed and shipped in Phase 3, and touching 8 files there
 * for a cosmetic dedupe isn't worth the regression risk this late. A
 * follow-up cleanup could point both at one shared source.
 */
export const ChartCard = ({
  title,
  subtitle,
  action,
  isLoading,
  error,
  isEmpty,
  emptyProps,
  errorMessage,
  onRetry,
  skeleton,
  className,
  children,
}) => {
  let body;
  if (isLoading) {
    body = skeleton;
  } else if (error) {
    body = <ErrorState message={errorMessage} onRetry={onRetry} />;
  } else if (isEmpty) {
    body = <EmptyState {...emptyProps} />;
  } else {
    body = <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {body}
    </Card>
  );
};
