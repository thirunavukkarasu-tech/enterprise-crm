import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { customerService } from '../../services/customerService.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { StatusBadge } from './components/StatusBadge.jsx';
import { TagList } from './components/TagList.jsx';
import { CustomerFormModal } from './components/CustomerFormModal.jsx';
import { CustomerNotes } from './components/CustomerNotes.jsx';
import { CustomerTimeline } from './components/CustomerTimeline.jsx';
import { CustomerInteractionHistory } from './components/CustomerInteractionHistory.jsx';

const getInitials = (name = '') =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: customer,
    isLoading,
    error,
    refetch,
    setData,
  } = useApiQuery(() => customerService.getById(id), [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await customerService.remove(id);
      toast.success('Customer deleted');
      navigate('/customers', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this customer.');
      setIsDeleting(false);
    }
  };

  const handleNoteAdded = (note) => {
    setData((prev) => (prev ? { ...prev, notes: [...prev.notes, note] } : prev));
  };

  if (isLoading) return <FullPageLoader label="Loading customer…" />;

  if (error) {
    const notFound = error.response?.status === 404;
    return (
      <div className="mx-auto max-w-lg py-16">
        <ErrorState
          message={notFound ? 'This customer could not be found.' : "Couldn't load this customer."}
          onRetry={notFound ? undefined : refetch}
        />
        <div className="mt-4 text-center">
          <Link to="/customers" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/customers"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Link>

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-white">
              {getInitials(customer.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-semibold text-ink">{customer.name}</h1>
                <StatusBadge status={customer.status} />
              </div>
              {customer.company && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                  <Building2 className="h-3.5 w-3.5" /> {customer.company}
                  {customer.industry && ` · ${customer.industry}`}
                </p>
              )}
              <div className="mt-3">
                <TagList tags={customer.tags} max={8} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-surface-300 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Mail className="h-3.5 w-3.5" /> Email
            </dt>
            <dd className="mt-1 truncate text-sm text-ink-800">{customer.email}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Phone className="h-3.5 w-3.5" /> Phone
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{customer.phone || '—'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <MapPin className="h-3.5 w-3.5" /> Address
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{customer.address || '—'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Briefcase className="h-3.5 w-3.5" /> Owner
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{customer.assignedTo?.name || '—'}</dd>
          </div>
        </dl>
      </Card>

      {/* Notes + Interaction History + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Notes" subtitle="Internal notes about this customer" />
          <div className="px-5 py-5">
            <CustomerNotes customerId={id} notes={customer.notes} onAdded={handleNoteAdded} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Interaction History" subtitle="Calls, meetings, and email follow-ups" />
          <CustomerInteractionHistory customerId={id} />
        </Card>

        <Card>
          <CardHeader title="Activity Timeline" subtitle="Everything that's happened on this record" />
          <div className="px-5 py-5">
            <CustomerTimeline customerId={id} />
          </div>
        </Card>
      </div>

      <CustomerFormModal
        isOpen={isEditOpen}
        customer={customer}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) => setData((prev) => ({ ...prev, ...updated }))}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete customer"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${customer.name}"? This can be restored by an administrator later.`}
      />
    </div>
  );
}
