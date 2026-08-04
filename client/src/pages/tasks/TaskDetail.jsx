import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Bell,
  Briefcase,
  Building2,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { taskService } from '../../services/taskService.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { TaskStatusBadge } from './components/TaskStatusBadge.jsx';
import { TaskPriorityBadge } from './components/TaskPriorityBadge.jsx';
import { TaskFormModal } from './components/TaskFormModal.jsx';
import { TaskComments } from './components/TaskComments.jsx';
import { TaskAttachments } from './components/TaskAttachments.jsx';
import { TaskTimeline } from './components/TaskTimeline.jsx';
import { TASK_CATEGORY_LABELS } from '../../utils/taskEnums.js';
import { formatDateTime, formatDueDate } from '../../utils/formatters.js';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const {
    data: task,
    isLoading,
    error,
    refetch,
    setData,
  } = useApiQuery(() => taskService.getById(id), [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await taskService.remove(id);
      toast.success('Task deleted');
      navigate('/tasks', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this task.');
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    setIsToggling(true);
    try {
      const updated = await taskService.update(id, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      });
      setData((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update this task.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleCommentAdded = (comment) => {
    setData((prev) => (prev ? { ...prev, comments: [...prev.comments, comment] } : prev));
  };

  const handleAttachmentUploaded = (attachment) => {
    setData((prev) => (prev ? { ...prev, attachments: [...prev.attachments, attachment] } : prev));
  };

  const handleAttachmentRemoved = (attachmentId) => {
    setData((prev) =>
      prev ? { ...prev, attachments: prev.attachments.filter((a) => a._id !== attachmentId) } : prev
    );
  };

  if (isLoading) return <FullPageLoader label="Loading task…" />;

  if (error) {
    const notFound = error.response?.status === 404;
    return (
      <div className="mx-auto max-w-lg py-16">
        <ErrorState
          message={notFound ? 'This task could not be found.' : "Couldn't load this task."}
          onRetry={notFound ? undefined : refetch}
        />
        <div className="mt-4 text-center">
          <Link to="/tasks" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <div className="space-y-6">
      <Link to="/tasks" className="flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to Tasks
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={isToggling}
              className="mt-1 shrink-0 text-ink-600 hover:text-brand-600 disabled:opacity-50"
              aria-label={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="h-7 w-7 text-brand-500" />
              ) : (
                <Circle className="h-7 w-7" />
              )}
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl font-semibold text-ink">{task.title}</h1>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
              {task.description && <p className="mt-2 max-w-xl text-sm text-ink-600">{task.description}</p>}
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

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-surface-300 pt-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Calendar className="h-3.5 w-3.5" /> Due
            </dt>
            <dd className={`mt-1 text-sm ${isOverdue ? 'font-medium text-rose-600' : 'text-ink-800'}`}>
              {formatDueDate(task.dueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-600">Category</dt>
            <dd className="mt-1 text-sm text-ink-800">{TASK_CATEGORY_LABELS[task.category]}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Bell className="h-3.5 w-3.5" /> Reminder
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{task.reminderAt ? formatDateTime(task.reminderAt) : '—'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Briefcase className="h-3.5 w-3.5" /> Owner
            </dt>
            <dd className="mt-1 text-sm text-ink-800">{task.assignedTo?.name || '—'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-600">
              <Building2 className="h-3.5 w-3.5" /> Customer
            </dt>
            <dd className="mt-1 text-sm text-ink-800">
              {task.relatedCustomer ? (
                <Link to={`/customers/${task.relatedCustomer._id}`} className="text-brand-600 hover:underline">
                  {task.relatedCustomer.name}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Comments + Attachments + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Comments" subtitle="Discussion about this task" />
          <div className="px-5 py-5">
            <TaskComments taskId={id} comments={task.comments} onAdded={handleCommentAdded} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Attachments" subtitle="Files related to this task" />
          <div className="px-5 py-5">
            <TaskAttachments
              taskId={id}
              attachments={task.attachments}
              onUploaded={handleAttachmentUploaded}
              onRemoved={handleAttachmentRemoved}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Activity Timeline" subtitle="Everything that's happened on this task" />
          <div className="px-5 py-5">
            <TaskTimeline taskId={id} />
          </div>
        </Card>
      </div>

      <TaskFormModal
        isOpen={isEditOpen}
        task={task}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) => setData((prev) => ({ ...prev, ...updated }))}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete task"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${task.title}"? This can be restored by an administrator later.`}
      />
    </div>
  );
}
