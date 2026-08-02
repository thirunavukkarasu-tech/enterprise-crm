import { useState } from 'react';
import toast from 'react-hot-toast';
import { StickyNote } from 'lucide-react';
import { TextArea } from '../../../components/ui/TextArea.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { customerService } from '../../../services/customerService.js';
import { formatRelativeTime } from '../../../utils/formatters.js';

const getInitials = (name = '') =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/**
 * Notes are embedded on the Customer document (see server/src/models/Customer.js)
 * rather than fetched separately — `notes` arrives already populated as part
 * of the customer prop, and `onAdded` lets the parent optimistically merge
 * the new note back in without a full refetch.
 */
export const CustomerNotes = ({ customerId, notes = [], onAdded }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const note = await customerService.addNote(customerId, trimmed);
      onAdded(note);
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note about this customer…"
          rows={3}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!text.trim()}>
            Add Note
          </Button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Notes you add about this customer will show up here."
        />
      ) : (
        <ul className="space-y-4">
          {sorted.map((note) => (
            <li key={note._id} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                {getInitials(note.createdBy?.name)}
              </span>
              <div className="min-w-0 flex-1 rounded-lg bg-surface-200/60 px-3.5 py-2.5">
                <p className="whitespace-pre-wrap text-sm text-ink-800">{note.text}</p>
                <p className="mt-1.5 text-xs text-ink-600">
                  {note.createdBy?.name || 'Someone'} · {formatRelativeTime(note.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
