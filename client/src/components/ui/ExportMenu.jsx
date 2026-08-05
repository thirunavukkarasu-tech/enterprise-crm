import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Generic "Export ▾" button with CSV/Excel options. Takes an `onExport(format)`
 * callback rather than knowing anything about reports itself, so it can be
 * reused anywhere a dataset needs exporting, not just the Reports module.
 */
export const ExportMenu = ({ onExport, label = 'Export' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      await onExport(format);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen((o) => !o)} isLoading={isExporting}>
        <Download className="h-4 w-4" /> {label} <ChevronDown className="h-3.5 w-3.5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-surface-300 bg-surface-100 py-1.5 shadow-popover">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-800 hover:bg-surface-200"
          >
            <FileText className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-800 hover:bg-surface-200"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
        </div>
      )}
    </div>
  );
};
