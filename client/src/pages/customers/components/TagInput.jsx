import { useState } from 'react';
import { X } from 'lucide-react';
import { tagTone } from '../../../utils/customerEnums.js';

export const TagInput = ({ value = [], onChange, label = 'Tags' }) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim().toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-700">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
        {value.map((tag) => (
          <span
            key={tag}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tagTone(tag)}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Add a tag and press Enter' : ''}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-600/50"
        />
      </div>
    </div>
  );
};
