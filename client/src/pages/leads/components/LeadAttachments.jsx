import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Paperclip, Download, Trash2, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { leadService } from '../../../services/leadService.js';
import { formatFileSize, formatRelativeTime } from '../../../utils/formatters.js';

const fileIconFor = (mimeType) => {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf' || mimeType?.includes('word')) return FileText;
  return FileIcon;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // matches server/src/middleware/upload.js

export const LeadAttachments = ({ leadId, attachments = [], onUploaded, onRemoved }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large — the limit is 10MB.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    try {
      const attachment = await leadService.uploadAttachment(leadId, file, setProgress);
      onUploaded(attachment);
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await leadService.removeAttachment(leadId, pendingDelete._id);
      onRemoved(pendingDelete._id);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove attachment.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
          <Paperclip className="h-4 w-4" /> {isUploading ? `Uploading ${progress}%` : 'Attach File'}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
      </div>

      {attachments.length === 0 ? (
        <EmptyState icon={Paperclip} title="No attachments" description="Files attached to this lead will show up here." />
      ) : (
        <ul className="divide-y divide-surface-300">
          {attachments.map((file) => {
            const Icon = fileIconFor(file.mimeType);
            return (
              <li key={file._id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-200 text-ink-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">{file.originalName}</p>
                  <p className="text-xs text-ink-600">
                    {formatFileSize(file.size)} · {file.uploadedBy?.name || 'Someone'} ·{' '}
                    {formatRelativeTime(file.createdAt)}
                  </p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  download={file.originalName}
                  className="rounded-md p-2 text-ink-600 hover:bg-surface-200 hover:text-ink-800"
                  aria-label={`Download ${file.originalName}`}
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPendingDelete(file)}
                  className="rounded-md p-2 text-ink-600 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${file.originalName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Remove attachment"
        confirmLabel="Remove"
        description={`Remove "${pendingDelete?.originalName}" from this lead?`}
      />
    </div>
  );
};
