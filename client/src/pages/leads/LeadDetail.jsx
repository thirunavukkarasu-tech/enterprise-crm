import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Pencil,
  Trash2,
  ArrowRightCircle,
  DollarSign,
} from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { leadService } from '../../services/leadService.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { LeadStatusBadge } from './components/LeadStatusBadge.jsx';
import { PriorityBadge } from './components/PriorityBadge.jsx';
import { LeadFormModal } from './components/LeadFormModal.jsx';
import { LeadNotes } from './components/LeadNotes.jsx';
import { LeadTimeline } from './components/LeadTimeline.jsx';
import { LeadAttachments } from './components/LeadAttachments.jsx';
import { LEAD_SOURCE_LABELS } from '../../utils/leadEnums.js';
import { formatCurrency } from '../../utils/formatters.js';

const getInitials = (name = '') =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const {
    data: lead,
    isLoading,
    error,
    refetch,
    setData,
  } = useApiQuery(() => leadService.getById(id), [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await leadService.remove(id);
      toast.success('Lead deleted');
      navigate('/leads', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this lead.');
      setIsDeleting(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const { customer } = await leadService.convert(id);
      toast.success(`Converted — "${customer.name}" is now a customer`);
      navigate(`/customers/${customer._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not convert this lead.');
      setIsConverting(false);
      setIsConvertOpen(false);
    }
  };

  const handleNoteAdded = (note) => {
    setData((prev) => (prev ? { ...prev, notes: [...prev.notes, note] } : prev));
  };

  const handleAttachmentUploaded = (attachment) => {
    setData((prev) => (prev ? { ...prev, attachments: [...prev.attachments, attachment] } : prev));
  };

  const handleAttachmentRemoved = (attachmentId) => {
    setData((prev) =>
      prev ? { ...prev, attachments: prev.attachments.filter((a) => a._id !== attachmentId) } : prev
    );
  };

  if (isLoading) return <FullPageLoader label="Loading lead…" />;

  if (error) {
    const notFound = error.response?.status === 404;
    return (
      <div className="mx-auto max-w-lg py-16">
        <ErrorState
          message={notFound ? 'This lead could not be found.' : "Couldn't load this lead."}
          onRetry={notFound ? undefined : refetch}
        />
        <div className="mt-4 text-center">
          <Link to="/leads" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  const isConverted = Boolean(lead.convertedToCustomer);

  return (
    <div className="space-y-6">
      <Link to="/leads" className="flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>

      {isConverted && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <ArrowRightCircle className="h-4 w-4 shrink-0" />
          This lead was converted to a customer.{' '}
          <Link to={`/customers/${lead.convertedToCustomer._id}`} className="font-medium underline">
            View customer →
          </Link>
        </div>
      )}

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-white">
              {getInitials(lead.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-semibold text-ink">{lead.name}</h1>
                <LeadStatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
              {lead.company && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                  <Building2 className="h-3.5 w-3.5" /> {lead.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!isConverted && (
              <Button size="sm" onClick={() => setIsConvertOpen(true)}>
                <ArrowRightCircle className="h-4 w-4" /> Convert to Customer
              </Button>
            )}
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

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-surface-300 pt-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Mail className="h-3.5 w-3.5" /> Email
            </dt>
            <dd className="mt-1 truncate text-sm text-ink-800">{lead.email || '—'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Phone className="h-3.5 w-3.5" /> Phone
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{lead.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-600">Source</dt>
            <dd className="mt-1 text-sm text-ink-800">{LEAD_SOURCE_LABELS[lead.source]}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <DollarSign className="h-3.5 w-3.5" /> Est. Value
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{formatCurrency(lead.estimatedValue)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Briefcase className="h-3.5 w-3.5" /> Owner
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{lead.assignedTo?.name || '—'}</dd>
          </div>
        </dl>
      </Card>

      {/* Notes + Attachments + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Notes" subtitle="Internal notes about this lead" />
          <div className="px-5 py-5">
            <LeadNotes leadId={id} notes={lead.notes} onAdded={handleNoteAdded} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Attachments" subtitle="Files related to this lead" />
          <div className="px-5 py-5">
            <LeadAttachments
              leadId={id}
              attachments={lead.attachments}
              onUploaded={handleAttachmentUploaded}
              onRemoved={handleAttachmentRemoved}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Activity Timeline" subtitle="Everything that's happened on this lead" />
          <div className="px-5 py-5">
            <LeadTimeline leadId={id} />
          </div>
        </Card>
      </div>

      <LeadFormModal
        isOpen={isEditOpen}
        lead={lead}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) => setData((prev) => ({ ...prev, ...updated }))}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete lead"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${lead.name}"? This can be restored by an administrator later.`}
      />

      <ConfirmDialog
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onConfirm={handleConvert}
        isLoading={isConverting}
        title="Convert to customer"
        confirmLabel="Convert"
        variant="primary"
        description={`This will create a new customer record from "${lead.name}" and mark this lead as won. This can't be undone.`}
      />
    </div>
  );
}
