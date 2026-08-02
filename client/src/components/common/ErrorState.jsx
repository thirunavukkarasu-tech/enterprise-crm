import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const ErrorState = ({ message = "Couldn't load this data.", onRetry }) => (
  <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
    <AlertTriangle className="h-7 w-7 text-rose-500" aria-hidden="true" />
    <p className="mt-3 text-sm font-medium text-ink-700">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
