import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { customerService } from '../../../services/customerService.js';

export const ImportExportMenu = ({ filters, onImported }) => {
  const fileInputRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await customerService.exportCsv({ status: filters.status, tag: filters.tag });
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await customerService.importCsv(file);
      setSummary(result);
      onImported();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed. Please check your CSV and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleExport} isLoading={isExporting}>
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          isLoading={isImporting}
        >
          <Upload className="h-4 w-4" /> Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      <Modal
        isOpen={Boolean(summary)}
        onClose={() => setSummary(null)}
        title="Import Complete"
        size="sm"
        footer={<Button onClick={() => setSummary(null)}>Done</Button>}
      >
        {summary && (
          <div className="space-y-3 text-sm">
            <p className="text-ink-800">
              Processed <span className="font-medium">{summary.totalRows}</span> rows —{' '}
              <span className="font-medium text-brand-600">{summary.created} created</span>,{' '}
              <span className="font-medium text-rose-600">{summary.skipped} skipped</span>.
            </p>
            {summary.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto scrollbar-thin rounded-lg border border-surface-300">
                <ul className="divide-y divide-surface-300">
                  {summary.errors.map((e, i) => (
                    <li key={i} className="px-3 py-2 text-xs text-ink-600">
                      <span className="font-medium text-ink-800">Row {e.row}:</span> {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
