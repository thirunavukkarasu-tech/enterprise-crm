import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
      <Compass className="h-10 w-10 text-brand-500" aria-hidden="true" />
      <h1 className="font-display text-3xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-600">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button as={Link} to="/dashboard" className="mt-2">
        Back to Dashboard
      </Button>
    </div>
  );
}
