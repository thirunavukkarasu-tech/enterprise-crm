import { Phone, Users, Mail } from 'lucide-react';
import { FOLLOWUP_TYPE_LABELS } from '../../../utils/followupEnums.js';

const ICONS = { call: Phone, meeting: Users, email: Mail };

export const FollowUpTypeBadge = ({ type }) => {
  const Icon = ICONS[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-800">
      <Icon className="h-3.5 w-3.5 text-ink-600" aria-hidden="true" />
      {FOLLOWUP_TYPE_LABELS[type]}
    </span>
  );
};
