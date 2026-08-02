import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary.jsx';

/**
 * Every chart/list widget on the dashboard follows the same shape: a header
 * (title + optional action), then one of {skeleton, error, empty, content}.
 * Centralizing that state machine here means each widget component (see
 * RevenueAnalyticsChart, ActivityTimeline, etc.) only has to implement the
 * "happy path" rendering — this file owns the rest.
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
